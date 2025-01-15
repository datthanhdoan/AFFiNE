import type { File } from 'node:buffer';
import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import OpenAI from 'openai';
import { z } from 'zod';

import { Config, PrismaTransaction } from '../../base';
import { parseDoc } from '../../native';

const ContextConfigSchema = z.object({
  files: z
    .object({
      id: z.string(),
      chunk_size: z.number(),
      name: z.string(),
    })
    .array(),
});

type ContextConfig = z.infer<typeof ContextConfigSchema>;

type FileChunkSimilarity = {
  fileId: string;
  chunk: number;
  content: string;
  distance: number | null;
};

@Injectable()
export class CopilotContextService {
  private readonly sessionCache = new Map<string, ContextSession>();
  private readonly client: OpenAI | undefined;

  constructor(
    config: Config,
    private readonly db: PrismaClient
  ) {
    const configure = config.plugins.copilot.openai;
    if (configure) {
      this.client = new OpenAI(configure);
    }
  }

  private cacheSession(
    client: OpenAI,
    workspaceId: string,
    id: string,
    config: ContextConfig
  ): ContextSession {
    const context = new ContextSession(
      client,
      workspaceId,
      id,
      config,
      this.db
    );
    this.sessionCache.set(context.id, context);
    return context;
  }

  async getOrCreate(workspaceId: string, id?: string): Promise<ContextSession> {
    if (!this.client) {
      throw new Error('copilot key not configured yet');
    }
    if (id) {
      const context = this.sessionCache.get(id);
      if (context) return context;
      const ret = await this.db.aiContext.findUnique({
        where: { workspaceId, id },
        select: { config: true },
      });
      if (ret) {
        const config = ContextConfigSchema.safeParse(ret.config);
        if (config.success)
          return this.cacheSession(this.client, workspaceId, id, config.data);
        throw new Error('Invalid context config');
      }
    }

    const context = await this.db.aiContext.create({
      data: { workspaceId, config: { files: [] } },
    });
    const config = ContextConfigSchema.parse(context.config);
    return this.cacheSession(this.client, workspaceId, context.id, config);
  }
}

export class ContextSession implements AsyncDisposable {
  constructor(
    private readonly client: OpenAI,
    private readonly wsId: string,
    private readonly contextId: string,
    private readonly config: ContextConfig,
    private readonly db: PrismaClient
  ) {}

  get workspaceId() {
    return this.wsId;
  }

  get id() {
    return this.contextId;
  }

  private get embeddings() {
    return this.client.embeddings;
  }

  async list() {
    return this.config.files.map(f => ({ ...f }));
  }

  private processEmbeddings(
    fileId: string,
    input: string[],
    embeddings: OpenAI.Embeddings.Embedding[]
  ) {
    const groups = embeddings.map(e => [
      randomUUID(),
      this.contextId,
      fileId,
      e.index,
      input[e.index],
      Prisma.raw(`'[${e.embedding.join(',')}]'`),
      new Date(),
    ]);
    return Prisma.join(groups.map(row => Prisma.sql`(${Prisma.join(row)})`));
  }

  private async insertEmbeddings(
    name: string,
    input: string[],
    embeddings: OpenAI.Embeddings.Embedding[]
  ) {
    const fileId = nanoid();
    const values = this.processEmbeddings(fileId, input, embeddings);
    return this.db.$transaction(async tx => {
      await tx.$executeRaw`
        INSERT INTO "ai_context_embeddings"
        ("id", "context_id", "file_id", "chunk", "content", "embedding", "updated_at") VALUES ${values}
        ON CONFLICT (context_id, file_id, chunk) DO UPDATE SET
        content = EXCLUDED.content, embedding = EXCLUDED.embedding, updated_at = excluded.updated_at;
      `;
      this.config.files.push({ id: fileId, chunk_size: input.length, name });
      await this.save(tx);
      return fileId;
    });
  }

  async add(content: File, signal?: AbortSignal): Promise<string | undefined> {
    if (signal?.aborted) return;
    const buffer = new Uint8Array(await content.arrayBuffer());
    const doc = await parseDoc(content.name, buffer);
    if (doc && !signal?.aborted) {
      const input = doc.chunks
        .toSorted((a, b) => a.index - b.index)
        .map(chunk => chunk.content);
      const embeddings = await this.embeddings.create(
        {
          input,
          model: 'text-embedding-3-small',
          dimensions: 512,
          encoding_format: 'float',
        },
        { signal }
      );
      return await this.insertEmbeddings(content.name, input, embeddings.data);
    }
    return undefined;
  }

  async remove(fileId: string) {
    await this.db.$transaction(async tx => {
      await tx.aiContextEmbedding.deleteMany({
        where: { contextId: this.contextId, fileId },
      });
      this.config.files = this.config.files.filter(f => f.id !== fileId);
      await this.save(tx);
    });
  }

  async match(
    content: string,
    topK: number,
    signal?: AbortSignal
  ): Promise<FileChunkSimilarity[]> {
    const embedding = await this.embeddings
      .create(
        {
          input: content,
          model: 'text-embedding-3-small',
          dimensions: 512,
          encoding_format: 'float',
        },
        { signal }
      )
      .then(r => r.data?.[0]?.embedding);
    if (!embedding) return [];
    return await this.db.$queryRaw<Array<FileChunkSimilarity>>`
      SELECT "file_id" as "fileId", "chunk", "content", "embedding" <=> ${embedding}::vector as "distance" 
      FROM "ai_context_embeddings"
      ORDER BY "distance" ASC
      LIMIT ${topK};
    `;
  }

  async save(tx?: PrismaTransaction) {
    const executor = tx || this.db;
    await executor.aiContext.update({
      where: { workspaceId: this.wsId, id: this.contextId },
      data: { config: this.config },
    });
  }

  async [Symbol.asyncDispose]() {
    await this.save?.();
  }
}

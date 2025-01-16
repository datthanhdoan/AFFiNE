import type { File } from 'node:buffer';
import { randomUUID } from 'node:crypto';

import { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

import { PrismaTransaction } from '../../../base';
import { parseDoc } from '../../../native';
import {
  ContextConfig,
  Embedding,
  EmbeddingClient,
  FileChunkSimilarity,
} from './types';

export class ContextSession implements AsyncDisposable {
  constructor(
    private readonly client: EmbeddingClient,
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

  async list() {
    return this.config.files.map(f => ({ ...f }));
  }

  private processEmbeddings(
    fileId: string,
    input: string[],
    embeddings: Embedding[]
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
    embeddings: Embedding[]
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
      const embeddings = await this.client.getEmbeddings(input, signal);
      return await this.insertEmbeddings(content.name, input, embeddings);
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
    const embedding = await this.client
      .getEmbeddings([content], signal)
      .then(r => r?.[0]?.embedding);
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

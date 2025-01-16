import { File } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

import { Prisma, PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

import { BlobQuotaExceeded, PrismaTransaction } from '../../../base';
import { OneMB } from '../../../core/quota/constant';
import { parseDoc } from '../../../native';
import {
  ContextConfig,
  ContextFile,
  ContextFileStatus,
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
    blobId: string,
    input: string[],
    embeddings: Embedding[]
  ) {
    const fileId = nanoid();
    await this.saveFileRecord(fileId, file => ({
      ...file,
      blobId,
      chunk_size: input.length,
      name,
    }));

    const values = this.processEmbeddings(fileId, input, embeddings);
    return this.db.$transaction(async tx => {
      await tx.$executeRaw`
        INSERT INTO "ai_context_embeddings"
        ("id", "context_id", "file_id", "chunk", "content", "embedding", "updated_at") VALUES ${values}
        ON CONFLICT (context_id, file_id, chunk) DO UPDATE SET
        content = EXCLUDED.content, embedding = EXCLUDED.embedding, updated_at = excluded.updated_at;
      `;
      await this.saveFileRecord(fileId, file => ({
        ...(file as ContextFile),
        status: ContextFileStatus.finished,
      }));
      return fileId;
    });
  }

  private readStream(
    readable: Readable,
    maxSize = 50 * OneMB
  ): Promise<Buffer<ArrayBuffer>> {
    return new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      let totalSize = 0;

      readable.on('data', chunk => {
        totalSize += chunk.length;
        if (totalSize > maxSize) {
          reject(new BlobQuotaExceeded());
          readable.destroy(new BlobQuotaExceeded());
          return;
        }
        chunks.push(chunk);
      });

      readable.on('end', () => {
        resolve(Buffer.concat(chunks, totalSize));
      });

      readable.on('error', err => {
        reject(err);
      });
    });
  }

  async addStream(
    readable: Readable,
    name: string,
    blobId: string,
    signal?: AbortSignal
  ): Promise<string | undefined> {
    if (signal?.aborted) return;
    const buffer = await this.readStream(readable, 50 * OneMB);
    const file = new File([buffer], name);
    return await this.add(file, blobId, signal);
  }

  async add(
    file: File,
    blobId: string,
    signal?: AbortSignal
  ): Promise<string | undefined> {
    if (signal?.aborted) return;
    const buffer = new Uint8Array(await file.arrayBuffer());
    const doc = await parseDoc(file.name, buffer);
    if (doc && !signal?.aborted) {
      const input = doc.chunks
        .toSorted((a, b) => a.index - b.index)
        .map(chunk => chunk.content);
      const embeddings = await this.client.getEmbeddings(input, signal);
      return await this.insertEmbeddings(file.name, blobId, input, embeddings);
    }
    return undefined;
  }

  async remove(fileId: string) {
    return await this.db.$transaction(async tx => {
      const ret = await tx.aiContextEmbedding.deleteMany({
        where: { contextId: this.contextId, fileId },
      });
      this.config.files = this.config.files.filter(f => f.id !== fileId);
      await this.save(tx);
      return ret.count > 0;
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

  private async saveFileRecord(
    fileId: string,
    cb: (
      record: Pick<ContextFile, 'id' | 'status'> &
        Partial<Omit<ContextFile, 'id' | 'status'>>
    ) => ContextFile,
    tx?: PrismaTransaction
  ) {
    const files = this.config.files;
    const file = files.find(f => f.id === fileId);
    if (file) {
      Object.assign(file, cb({ ...file }));
    } else {
      const file = { id: fileId, status: ContextFileStatus.processing };
      files.push(cb(file));
    }
    await this.save(tx);
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

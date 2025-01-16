import { z } from 'zod';

export const ContextConfigSchema = z.object({
  files: z
    .object({
      id: z.string(),
      chunk_size: z.number(),
      name: z.string(),
      status: z.enum(['processing', 'finished', 'failed']),
    })
    .array(),
});

export type ContextConfig = z.infer<typeof ContextConfigSchema>;
export type ContextFile = z.infer<typeof ContextConfigSchema>['files'][number];

export enum ContextFileStatus {
  processing = 'processing',
  finished = 'finished',
  failed = 'failed',
}

export type FileChunkSimilarity = {
  fileId: string;
  chunk: number;
  content: string;
  distance: number | null;
};

export type Embedding = {
  /**
   * The index of the embedding in the list of embeddings.
   */
  index: number;
  embedding: Array<number>;
};

export interface EmbeddingClient {
  getEmbeddings(input: string[], signal?: AbortSignal): Promise<Embedding[]>;
}

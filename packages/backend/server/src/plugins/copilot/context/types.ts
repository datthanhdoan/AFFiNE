import { z } from 'zod';

export const ContextConfigSchema = z.object({
  files: z
    .object({
      id: z.string(),
      chunk_size: z.number(),
      name: z.string(),
    })
    .array(),
});

export type ContextConfig = z.infer<typeof ContextConfigSchema>;

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

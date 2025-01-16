import OpenAI from 'openai';

import { Embedding, EmbeddingClient } from './types';

export class OpenAIEmbeddingClient implements EmbeddingClient {
  constructor(private readonly client: OpenAI) {}

  async getEmbeddings(
    input: string[],
    signal?: AbortSignal
  ): Promise<Embedding[]> {
    const resp = await this.client.embeddings.create(
      {
        input,
        model: 'text-embedding-3-small',
        dimensions: 512,
        encoding_format: 'float',
      },
      { signal }
    );
    return resp.data;
  }
}

export class MockEmbeddingClient implements EmbeddingClient {
  async getEmbeddings(input: string[]): Promise<Embedding[]> {
    return input.map((_, i) => ({
      index: i,
      embedding: Array.from({ length: 512 }, () => Math.random()),
    }));
  }
}

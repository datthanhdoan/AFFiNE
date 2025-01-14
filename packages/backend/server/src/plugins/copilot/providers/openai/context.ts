import OpenAI from 'openai';
import type { VectorStore } from 'openai/resources/beta/vector-stores/vector-stores.mjs';

import { CopilotContext, FileLike } from '../../types';

export class ContextService {
  private readonly storeIdMap = new Map<string, string>();
  private readonly storeMap = new Map<string, Context>();

  constructor(private readonly client: OpenAI) {}

  private saveContext(store: VectorStore) {
    const context = new Context(this.client, store);
    // TODO(@darkskygit): save to redis to share between pods
    this.storeIdMap.set(context.name, context.id);
    this.storeMap.set(context.name, context);
    return context;
  }

  async getOrCreate(name: string, id?: string): Promise<Context> {
    const storeId = id || this.storeIdMap.get(name);
    if (storeId) {
      const context = this.storeMap.get(name);
      if (context) return context;

      try {
        const store = await this.client.beta.vectorStores.retrieve(storeId);
        if (store.name === name) {
          return this.saveContext(store);
        }
      } catch {}
    }
    const store = await this.client.beta.vectorStores.create({
      name,
      expires_after: { anchor: 'last_active_at', days: 30 },
    });
    return this.saveContext(store);
  }
}

export class Context implements CopilotContext {
  constructor(
    private readonly client: OpenAI,
    public readonly store: VectorStore
  ) {}

  get id() {
    return this.store.id;
  }

  get name() {
    return this.store.name;
  }

  private get files() {
    return this.client.files;
  }

  private get vectorFiles() {
    return this.client.beta.vectorStores.files;
  }

  async list() {
    const lists = await this.vectorFiles.list(this.id);
    const list = [];
    for await (const page of lists.iterPages()) {
      list.push(...page.data);
    }
    return list;
  }

  async add(content: FileLike, signal?: AbortSignal) {
    const file = await this.vectorFiles.uploadAndPoll(this.id, content, {
      signal,
    });
    if (file.status !== 'completed') {
      // revert the file upload if processing failed
      await this.remove(file.id);
      throw new Error('Failed to upload file');
    }
    return file.id;
  }

  async addByFileId(fileId: string, signal?: AbortSignal): Promise<string> {
    const file = await this.vectorFiles.createAndPoll(
      this.id,
      { file_id: fileId },
      { signal }
    );
    if (file.status !== 'completed') {
      throw new Error('Failed to upload file');
    }
    return file.id;
  }

  async remove(fileId: string) {
    const vector = await this.vectorFiles.del(this.id, fileId);
    const polled = await this.vectorFiles.poll(this.id, fileId);
    const file = await this.files.del(fileId);
    return vector.deleted && polled.status === 'completed' && file.deleted;
  }
}

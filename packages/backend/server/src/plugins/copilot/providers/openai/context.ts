import OpenAI from 'openai';
import type { VectorStore } from 'openai/resources/beta/vector-stores/vector-stores.mjs';
import type { Uploadable } from 'openai/uploads.mjs';

export class ContextService {
  private readonly storeIdMap = new Map<string, string>();
  private readonly storeMap = new Map<string, Context>();

  constructor(private readonly client: OpenAI) {}

  private saveContext(store: VectorStore) {
    const context = new Context(this.client, store);
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

export class Context {
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
    return this.client.beta.vectorStores.files;
  }

  async list() {
    const lists = await this.files.list(this.id);
    const list = await Array.fromAsync(lists.iterPages());
    return list.flatMap(f => f.data);
  }

  async add(content: Uploadable, signal?: AbortSignal) {
    const file = await this.files.uploadAndPoll(this.id, content, {
      signal,
    });
    return file.id;
  }

  async remove(fileId: string) {
    const ret = await this.files.del(this.id, fileId);
    return ret.deleted;
  }
}

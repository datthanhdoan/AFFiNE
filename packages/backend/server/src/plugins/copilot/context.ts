import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// import type { FileLike } from './types';

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

@Injectable()
export class CopilotContextService {
  private readonly sessionCache = new Map<string, ContextSession>();

  constructor(private readonly db: PrismaClient) {}

  private saveContext(
    workspaceId: string,
    id: string,
    config: ContextConfig
  ): ContextSession {
    const context = new ContextSession(workspaceId, id, config, this.db);
    this.sessionCache.set(context.id, context);
    return context;
  }

  async getOrCreate(workspaceId: string, id?: string): Promise<ContextSession> {
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
          return this.saveContext(workspaceId, id, config.data);
        throw new Error('Invalid context config');
      }
    }

    const context = await this.db.aiContext.create({
      data: { workspaceId, config: { files: [] } },
    });
    const config = ContextConfigSchema.parse(context.config);
    return this.saveContext(workspaceId, context.id, config);
  }
}

export class ContextSession implements AsyncDisposable {
  constructor(
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

  async list() {}

  // async add(content: FileLike, signal?: AbortSignal) {}

  // async remove(fileId: string) {}

  async save() {
    await this.db.aiContext.update({
      where: { workspaceId: this.wsId, id: this.contextId },
      data: { config: this.config },
    });
  }

  async [Symbol.asyncDispose]() {
    await this.save?.();
  }
}

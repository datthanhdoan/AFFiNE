import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

import {
  Config,
  CopilotInvalidContext,
  CopilotSessionNotFound,
  NoCopilotProviderAvailable,
} from '../../../base';
import { OpenAIEmbeddingClient } from './embedding';
import { ContextSession } from './session';
import { ContextConfig, ContextConfigSchema, EmbeddingClient } from './types';

@Injectable()
export class CopilotContextService {
  private readonly sessionCache = new Map<string, ContextSession>();
  private readonly client: EmbeddingClient | undefined;

  constructor(
    config: Config,
    private readonly db: PrismaClient
  ) {
    const configure = config.plugins.copilot.openai;
    if (configure) {
      this.client = new OpenAIEmbeddingClient(new OpenAI(configure));
    }
  }

  // public this client to allow overriding in tests
  get embeddingClient() {
    return this.client as EmbeddingClient;
  }

  private cacheSession(
    contextId: string,
    config: ContextConfig
  ): ContextSession {
    const context = new ContextSession(
      this.embeddingClient,
      contextId,
      config,
      this.db
    );
    this.sessionCache.set(contextId, context);
    return context;
  }

  async create(sessionId: string): Promise<ContextSession> {
    const session = await this.db.aiSession.findFirst({
      where: { id: sessionId },
      select: { workspaceId: true },
    });
    if (!session) {
      throw new CopilotSessionNotFound();
    }

    const context = await this.db.aiContext.create({
      data: {
        sessionId,
        config: { workspaceId: session.workspaceId, docs: [], files: [] },
      },
    });

    const config = ContextConfigSchema.parse(context.config);
    return this.cacheSession(context.id, config);
  }

  async get(id: string): Promise<ContextSession> {
    if (!this.embeddingClient) {
      throw new NoCopilotProviderAvailable('embedding client not configured');
    }

    const context = this.sessionCache.get(id);
    if (context) return context;
    const ret = await this.db.aiContext.findUnique({
      where: { id },
      select: { config: true },
    });
    if (ret) {
      const config = ContextConfigSchema.safeParse(ret.config);
      if (config.success) return this.cacheSession(id, config.data);
    }
    throw new CopilotInvalidContext({ contextId: id });
  }

  async list(sessionId: string): Promise<{ id: string; createdAt: number }[]> {
    const contexts = await this.db.aiContext.findMany({
      where: { sessionId },
      select: { id: true, createdAt: true },
    });
    return contexts.map(c => ({
      id: c.id,
      createdAt: c.createdAt.getTime(),
    }));
  }
}

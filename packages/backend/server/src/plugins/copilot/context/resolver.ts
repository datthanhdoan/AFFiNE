import { Req } from '@nestjs/common';
import {
  Args,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Parent,
  registerEnumType,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Request } from 'express';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

import {
  CallMetric,
  CopilotFailedToModifyContext,
  CopilotSessionNotFound,
  FileUpload,
  RequestMutex,
  Throttle,
  TooManyRequest,
} from '../../../base';
import { CurrentUser } from '../../../core/auth';
import { COPILOT_LOCKER, CopilotType } from '../resolver';
import { ChatSessionService } from '../session';
import { CopilotContextService } from './service';
import { type ContextFile, ContextFileStatus } from './types';

@InputType()
class AddContextFileInput {
  @Field(() => String)
  contextId!: string;

  @Field(() => String)
  fileName!: string;

  @Field(() => String)
  blobId!: string;

  @Field(() => GraphQLUpload)
  content!: Promise<FileUpload>;
}

@InputType()
class RemoveContextFileInput {
  @Field(() => String)
  contextId!: string;

  @Field(() => String)
  fileId!: string;
}

@ObjectType('CopilotContext')
export class CopilotContextType {
  @Field(() => ID)
  id!: string;
}

registerEnumType(ContextFileStatus, { name: 'ContextFileStatus' });

@ObjectType()
class CopilotContextFile implements ContextFile {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Number)
  chunk_size!: number;

  @Field(() => ContextFileStatus)
  status!: ContextFileStatus;

  @Field(() => String)
  blobId!: string;
}

@Throttle()
@Resolver(() => CopilotType)
export class CopilotContextRootResolver {
  constructor(
    private readonly mutex: RequestMutex,
    private readonly chatSession: ChatSessionService,
    private readonly context: CopilotContextService
  ) {}

  private async checkChatSession(
    user: CurrentUser,
    sessionId: string,
    workspaceId?: string
  ): Promise<void> {
    const session = await this.chatSession.get(sessionId);
    if (
      !session ||
      session.config.workspaceId !== workspaceId ||
      session.config.userId !== user.id
    ) {
      throw new CopilotSessionNotFound();
    }
  }

  @ResolveField(() => [CopilotContextType], {
    description: 'Get the context list of a session',
    complexity: 2,
  })
  @CallMetric('ai', 'context_create')
  async contexts(
    @Parent() copilot: CopilotType,
    @CurrentUser() user: CurrentUser,
    @Args('sessionId') sessionId: string
  ) {
    const lockFlag = `${COPILOT_LOCKER}:context:${sessionId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      return new TooManyRequest('Server is busy');
    }
    await this.checkChatSession(user, sessionId, copilot.workspaceId);

    return await this.context.list(sessionId);
  }

  @Mutation(() => String, {
    description: 'Create a context session',
  })
  @CallMetric('ai', 'context_create')
  async createCopilotContext(
    @CurrentUser() user: CurrentUser,
    @Args('workspaceId') workspaceId: string,
    @Args('sessionId') sessionId: string
  ) {
    const lockFlag = `${COPILOT_LOCKER}:context:${sessionId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      return new TooManyRequest('Server is busy');
    }
    await this.checkChatSession(user, sessionId, workspaceId);

    const context = await this.context.create(sessionId);
    return context.id;
  }
}

@Throttle()
@Resolver(() => CopilotContextType)
export class CopilotContextResolver {
  constructor(
    private readonly mutex: RequestMutex,
    private readonly context: CopilotContextService
  ) {}

  private getSignal(req: Request) {
    const controller = new AbortController();
    req.on('close', () => controller.abort());
    return controller.signal;
  }

  @ResolveField(() => [CopilotContextFile], {
    description: 'list files in context',
  })
  @CallMetric('ai', 'context_file_list')
  async files(
    @Parent() context: CopilotContextType,
    @Args('contextId', { nullable: true }) contextId?: string
  ): Promise<CopilotContextFile[] | TooManyRequest> {
    const id = contextId || context.id;
    const lockFlag = `${COPILOT_LOCKER}:context:${id}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      return new TooManyRequest('Server is busy');
    }
    const session = await this.context.get(id);

    return await session.list();
  }

  @Mutation(() => String, {
    description: 'add a file to context',
  })
  @CallMetric('ai', 'context_file_add')
  async addContextFile(
    @Req() req: Request,
    @Args({ name: 'options', type: () => AddContextFileInput })
    options: AddContextFileInput
  ) {
    const lockFlag = `${COPILOT_LOCKER}:context:${options.contextId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      return new TooManyRequest('Server is busy');
    }
    const session = await this.context.get(options.contextId);

    try {
      const content = await options.content;
      const signal = this.getSignal(req);
      return await session.addStream(
        content.createReadStream(),
        content.filename,
        options.blobId,
        signal
      );
    } catch (e: any) {
      throw new CopilotFailedToModifyContext({
        contextId: options.contextId,
        message: e.message,
      });
    }
  }

  @Mutation(() => Boolean, {
    description: 'remove a file from context',
  })
  @CallMetric('ai', 'context_file_remove')
  async removeContextFile(
    @Args({ name: 'options', type: () => RemoveContextFileInput })
    options: RemoveContextFileInput
  ) {
    const lockFlag = `${COPILOT_LOCKER}:context:${options.contextId}`;
    await using lock = await this.mutex.acquire(lockFlag);
    if (!lock) {
      return new TooManyRequest('Server is busy');
    }
    const session = await this.context.get(options.contextId);

    try {
      return await session.remove(options.fileId);
    } catch (e: any) {
      throw new CopilotFailedToModifyContext({
        contextId: options.contextId,
        message: e.message,
      });
    }
  }
}

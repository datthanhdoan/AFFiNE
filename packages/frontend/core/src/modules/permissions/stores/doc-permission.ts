import type { WorkspaceServerService } from '@affine/core/modules/cloud';
import { getCurrentUserDocPermissionQuery } from '@affine/graphql';
import { Store } from '@toeverything/infra';

export class DocPermissionStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchCurrentUserDocPermissions(
    workspaceId: string,
    docId: string,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('No Server');
    }
    const res = await this.workspaceServerService.server.gql({
      query: getCurrentUserDocPermissionQuery,
      variables: {
        pageId: docId,
        workspaceId,
      },
      context: { signal },
    });

    return res.workspace.currentUserPermission;
  }
}

import type { WorkspaceServerService } from '@affine/core/modules/cloud';
import {
  type DocRole,
  getCurrentUserDocPermissionQuery,
  getPageGrantedUsersListQuery,
  type GrantDocUserRolesInput,
  grantDocUserRolesMutation,
  type PageGrantedUsersInput,
  revokeDocUserRolesMutation,
  updateDocUserRoleMutation,
} from '@affine/graphql';
import { Store } from '@toeverything/infra';

export class DocGrantedUsersStore extends Store {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  async fetchCurrentUserDocPermissions(workspaceId: string, docId: string) {
    if (!this.workspaceServerService.server) {
      throw new Error('No Server');
    }
    const res = await this.workspaceServerService.server.gql({
      query: getCurrentUserDocPermissionQuery,
      variables: {
        pageId: docId,
        workspaceId,
      },
    });

    return res.workspace.currentUserPermission;
  }

  async fetchDocGrantedUsersList(
    workspaceId: string,
    docId: string,
    pageGrantedUsersInput: PageGrantedUsersInput,
    signal?: AbortSignal
  ) {
    if (!this.workspaceServerService.server) {
      throw new Error('No Server');
    }
    const res = await this.workspaceServerService.server.gql({
      query: getPageGrantedUsersListQuery,
      variables: {
        pageGrantedUsersInput,
        pageId: docId,
        workspaceId,
      },
      context: { signal },
    });

    return res.workspace.pageGrantedUsersList;
  }

  async grantDocUserRoles(input: GrantDocUserRolesInput) {
    if (!this.workspaceServerService.server) {
      throw new Error('No Server');
    }
    const res = await this.workspaceServerService.server.gql({
      query: grantDocUserRolesMutation,
      variables: {
        input,
      },
    });

    return res.grantDocUserRoles;
  }

  async revokeDocUserRoles(docId: string, userIds: string[]) {
    if (!this.workspaceServerService.server) {
      throw new Error('No Server');
    }
    const res = await this.workspaceServerService.server.gql({
      query: revokeDocUserRolesMutation,
      variables: {
        docId,
        userIds,
      },
    });

    return res.revokeDocUserRoles;
  }

  async updateDocUserRole(docId: string, userId: string, role: DocRole) {
    if (!this.workspaceServerService.server) {
      throw new Error('No Server');
    }
    const res = await this.workspaceServerService.server.gql({
      query: updateDocUserRoleMutation,
      variables: {
        docId,
        userId,
        role,
      },
    });

    return res.updateDocUserRole;
  }
}

import type { DocRole } from '@affine/graphql';
import { Service } from '@toeverything/infra';

import type { DocService } from '../../doc';
import type { WorkspaceService } from '../../workspace';
import { DocGrantedUsers } from '../entities/doc-granted-users';
import type { DocGrantedUsersStore } from '../stores/doc-granted-users';

export class DocGrantedUsersService extends Service {
  constructor(
    private readonly store: DocGrantedUsersStore,
    private readonly workspaceService: WorkspaceService,
    private readonly docService: DocService
  ) {
    super();
  }

  docGrantedUsers = this.framework.createEntity(DocGrantedUsers);

  async grantUsersRole(userIds: string[], role: DocRole) {
    return await this.store.grantDocUserRoles({
      docId: this.docService.doc.id,
      workspaceId: this.workspaceService.workspace.id,
      userIds,
      role,
    });
  }

  async revokeUsersRole(userIds: string[]) {
    return await this.store.revokeDocUserRoles(this.docService.doc.id, userIds);
  }

  async updateUserRole(userId: string, role: DocRole) {
    return await this.store.updateDocUserRole(
      this.docService.doc.id,
      userId,
      role
    );
  }
}

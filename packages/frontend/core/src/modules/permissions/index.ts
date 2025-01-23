export type { GrantedUser } from './entities/doc-granted-users';
export type { Member } from './entities/members';
export { DocGrantedUsersService } from './services/doc-granted-users';
export { DocPermissionService } from './services/doc-permission';
export { WorkspaceMembersService } from './services/members';
export { WorkspacePermissionService } from './services/permission';

import { type Framework } from '@toeverything/infra';

import { WorkspaceServerService } from '../cloud';
import { DocScope, DocService } from '../doc';
import {
  WorkspaceScope,
  WorkspaceService,
  WorkspacesService,
} from '../workspace';
import { DocGrantedUsers } from './entities/doc-granted-users';
import { WorkspaceMembers } from './entities/members';
import { WorkspacePermission } from './entities/permission';
import { DocGrantedUsersService } from './services/doc-granted-users';
import { DocPermissionService } from './services/doc-permission';
import { WorkspaceMembersService } from './services/members';
import { WorkspacePermissionService } from './services/permission';
import { DocGrantedUsersStore } from './stores/doc-granted-users';
import { DocPermissionStore } from './stores/doc-permission';
import { WorkspaceMembersStore } from './stores/members';
import { WorkspacePermissionStore } from './stores/permission';

export function configurePermissionsModule(framework: Framework) {
  framework
    .scope(WorkspaceScope)
    .service(WorkspacePermissionService, [
      WorkspaceService,
      WorkspacesService,
      WorkspacePermissionStore,
    ])
    .store(WorkspacePermissionStore, [WorkspaceServerService])
    .entity(WorkspacePermission, [WorkspaceService, WorkspacePermissionStore])
    .service(WorkspaceMembersService, [WorkspaceMembersStore, WorkspaceService])
    .store(WorkspaceMembersStore, [WorkspaceServerService])
    .entity(WorkspaceMembers, [WorkspaceMembersStore, WorkspaceService]);

  framework
    .scope(WorkspaceScope)
    .scope(DocScope)
    .service(DocGrantedUsersService, [
      DocGrantedUsersStore,
      WorkspaceService,
      DocService,
    ])
    .store(DocGrantedUsersStore, [WorkspaceServerService])
    .entity(DocGrantedUsers, [
      DocGrantedUsersStore,
      WorkspaceService,
      DocService,
    ])
    .service(DocPermissionService, [
      WorkspaceService,
      DocService,
      DocPermissionStore,
    ])
    .store(DocPermissionStore, [WorkspaceServerService]);
}

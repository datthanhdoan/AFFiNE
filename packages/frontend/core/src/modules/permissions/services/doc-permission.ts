import { DebugLogger } from '@affine/debug';
import {
  DocRole,
  type GetCurrentUserDocPermissionQuery,
} from '@affine/graphql';
import {
  backoffRetry,
  catchErrorInto,
  effect,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
  Service,
} from '@toeverything/infra';
import { EMPTY, exhaustMap, mergeMap } from 'rxjs';

import { isBackendError, isNetworkError } from '../../cloud';
import type { DocService } from '../../doc';
import type { WorkspaceService } from '../../workspace';
import type { DocPermissionStore } from '../stores/doc-permission';

const logger = new DebugLogger('affine:doc-permission');

export type DocRolePermissionActions =
  GetCurrentUserDocPermissionQuery['workspace']['currentUserPermission']['permissions'];

export class DocPermissionService extends Service {
  isOwner$ = new LiveData<boolean | null>(null);
  canManage$ = new LiveData<boolean | null>(null);
  role$ = new LiveData<DocRole | undefined>(undefined);
  rolePermissions$ = new LiveData<DocRolePermissionActions | undefined>(
    undefined
  );

  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly docService: DocService,
    private readonly store: DocPermissionStore
  ) {
    super();
  }

  revalidate = effect(
    exhaustMap(() => {
      return fromPromise(async signal => {
        if (this.workspaceService.workspace.flavour !== 'local') {
          return await this.store.fetchCurrentUserDocPermissions(
            this.workspaceService.workspace.id,
            this.docService.doc.id,
            signal
          );
        } else {
          return null;
        }
      }).pipe(
        backoffRetry({
          when: isNetworkError,
          count: Infinity,
        }),
        backoffRetry({
          when: isBackendError,
        }),
        mergeMap(permission => {
          this.canManage$.next(
            permission?.role === DocRole.Manager ||
              permission?.role === DocRole.Owner
          );
          this.isOwner$.next(permission?.role === DocRole.Owner);
          this.role$.next(permission?.role);
          this.rolePermissions$.next(permission?.permissions);
          return EMPTY;
        }),
        catchErrorInto(this.error$, error => {
          logger.error('Failed to fetch doc permission', error);
        }),
        onStart(() => this.isLoading$.setValue(true)),
        onComplete(() => this.isLoading$.setValue(false))
      );
    })
  );

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}

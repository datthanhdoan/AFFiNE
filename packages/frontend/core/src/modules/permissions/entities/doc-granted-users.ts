import {
  DocRole,
  type GetCurrentUserDocPermissionQuery,
  type GetPageGrantedUsersListQuery,
} from '@affine/graphql';
import {
  backoffRetry,
  catchErrorInto,
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { EMPTY, map, mergeMap, switchMap } from 'rxjs';

import { isBackendError, isNetworkError } from '../../cloud';
import type { DocService } from '../../doc';
import type { WorkspaceService } from '../../workspace';
import type { DocGrantedUsersStore } from '../stores/doc-granted-users';

export type GrantedUser =
  GetPageGrantedUsersListQuery['workspace']['pageGrantedUsersList']['edges'][number]['user'];

export type UserDocPermission =
  GetCurrentUserDocPermissionQuery['workspace']['currentUserPermission'];

export class DocGrantedUsers extends Entity {
  constructor(
    private readonly store: DocGrantedUsersStore,
    private readonly workspaceService: WorkspaceService,
    private readonly docService: DocService
  ) {
    super();
  }

  pageNum$ = new LiveData(0);
  grantedUserCount$ = new LiveData<number | undefined>(undefined);
  docGrantedUsers$ = new LiveData<GrantedUser[] | undefined>(undefined);
  docOwner$ = this.docGrantedUsers$.map(users =>
    users?.find(user => user.role === DocRole.Owner)
  );

  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  readonly PAGE_SIZE = 8;

  readonly revalidate = effect(
    map(() => this.pageNum$.value),
    switchMap(pageNum => {
      return fromPromise(async signal => {
        return this.store.fetchDocGrantedUsersList(
          this.workspaceService.workspace.id,
          this.docService.doc.id,
          {
            first: pageNum * this.PAGE_SIZE,
            offset: this.PAGE_SIZE,
          },
          signal
        );
      }).pipe(
        mergeMap(data => {
          const currentUsers = this.docGrantedUsers$.value || [];
          const newUsers = data.edges.map(edge => edge.user);
          const allUsers = [...currentUsers, ...newUsers];
          this.grantedUserCount$.setValue(data.totalCount);
          this.docGrantedUsers$.setValue(allUsers);
          return EMPTY;
        }),
        backoffRetry({
          when: isNetworkError,
          count: Infinity,
        }),
        backoffRetry({
          when: isBackendError,
        }),
        catchErrorInto(this.error$),
        onStart(() => {
          this.isLoading$.setValue(true);
        }),
        onComplete(() => this.isLoading$.setValue(false))
      );
    })
  );

  setPageNum(pageNum: number) {
    this.pageNum$.setValue(pageNum);
    this.revalidate();
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}

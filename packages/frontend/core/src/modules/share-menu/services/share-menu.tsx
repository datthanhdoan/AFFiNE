import { DocRole } from '@affine/graphql';
import { LiveData, Service } from '@toeverything/infra';

import type { GrantedUser } from '../../permissions';

export enum ShareMenuTab {
  Share = 'share',
  Export = 'export',
  Invite = 'invite',
  Members = 'members',
}

export class ShareMenuService extends Service {
  readonly currentTab$ = new LiveData<ShareMenuTab>(ShareMenuTab.Share);

  constructor() {
    super();
  }

  query$ = new LiveData<string>('');
  selectedMembers$ = new LiveData<GrantedUser[]>([]);
  inviteDocRoleType$ = new LiveData<DocRole>(DocRole.Manager);

  switchTab(tab: ShareMenuTab) {
    this.currentTab$.next(tab);
  }

  setQuery(query: string) {
    this.query$.next(query);
  }

  addToSelectedMembers(member: GrantedUser) {
    // filter out duplicates
    if (!this.selectedMembers$.value.some(m => m.user.id === member.user.id)) {
      this.selectedMembers$.next([...this.selectedMembers$.value, member]);
    }
  }

  removeFromSelectedMembers(memberId: string) {
    this.selectedMembers$.next(
      this.selectedMembers$.value.filter(member => member.user.id !== memberId)
    );
  }

  setInviteDocRoleType(role: DocRole) {
    this.inviteDocRoleType$.next(role);
  }

  clear() {
    this.selectedMembers$.next([]);
    this.query$.next('');
    this.inviteDocRoleType$.next(DocRole.Manager);
  }
}

import { LiveData, Service } from '@toeverything/infra';

import type { Member } from '../../permissions';

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
  selectedMembers$ = new LiveData<Member[]>([]);

  switchTab(tab: ShareMenuTab) {
    this.currentTab$.next(tab);
  }

  setQuery(query: string) {
    this.query$.next(query);
  }

  addToSelectedMembers(member: Member) {
    // filter out duplicates
    if (!this.selectedMembers$.value.some(m => m.id === member.id)) {
      this.selectedMembers$.next([...this.selectedMembers$.value, member]);
    }
  }

  removeFromSelectedMembers(memberId: string) {
    this.selectedMembers$.next(
      this.selectedMembers$.value.filter(member => member.id !== memberId)
    );
  }

  clearSelectedMembers() {
    this.selectedMembers$.next([]);
  }
}

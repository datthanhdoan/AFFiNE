import { Scrollable } from '@affine/component';
import type { Member } from '@affine/core/modules/permissions';
import { Permission, WorkspaceMemberStatus } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { ArrowLeftBigIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { ShareMenuService, ShareMenuTab } from '../../../services/share-menu';
import { MemberItem } from './member-item';
import * as styles from './member-management.css';

const mockMembers: Member[] = [
  {
    id: '2',
    name: 'Member 1',
    avatarUrl: '',
    email: 'fakeemail@gamicl.com',
    permission: Permission.Owner,
    inviteId: '',
    emailVerified: null,
    status: WorkspaceMemberStatus.Accepted,
  },
  {
    id: '3',
    name: 'Member 2',
    avatarUrl: '',
    email: 'testloasnodknaksldnalkndlkasnd@gamil.com',
    permission: Permission.Admin,
    inviteId: '',
    emailVerified: null,
    status: WorkspaceMemberStatus.Accepted,
  },
  {
    id: '4',
    name: 'loansodinsaodjsalkjdlkasnlkdnaslkdnl kasndlkaskldaslkdnalskndlkasn',
    avatarUrl: '',
    email: null,
    permission: Permission.Read,
    inviteId: '',
    emailVerified: null,
    status: WorkspaceMemberStatus.Accepted,
  },
];

// TODO(@JimmFly): Implement the member management page
export const MemberManagement = ({
  openPaywallModal,
  hittingPaywall,
}: {
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const shareMenuService = useService(ShareMenuService);

  const switchToShareTab = useCallback(() => {
    shareMenuService.switchTab(ShareMenuTab.Share);
  }, [shareMenuService]);
  const switchToInviteTab = useCallback(() => {
    shareMenuService.switchTab(ShareMenuTab.Invite);
  }, [shareMenuService]);

  const currentPermission = 'owner';
  const t = useI18n();
  return (
    <div className={styles.containerStyle}>
      <div className={styles.headerStyle} onClick={switchToShareTab}>
        <ArrowLeftBigIcon className={styles.iconStyle} />
        {t['com.affine.share-menu.member-management.header']({
          memberCount: mockMembers.length.toString(),
        })}
      </div>
      <MemberList
        openPaywallModal={openPaywallModal}
        hittingPaywall={hittingPaywall}
      />
      {currentPermission === 'owner' ? (
        <div className={styles.footerStyle}>
          <span
            className={styles.addCollaboratorsStyle}
            onClick={switchToInviteTab}
          >
            {t['com.affine.share-menu.member-management.add-collaborators']()}
          </span>
        </div>
      ) : null}
    </div>
  );
};

const MemberList = ({
  openPaywallModal,
  hittingPaywall,
}: {
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  return (
    <Scrollable.Root className={styles.scrollableRootStyle}>
      <Scrollable.Viewport className={styles.memberListStyle}>
        {mockMembers.map(member => {
          return (
            <MemberItem
              key={member.id}
              member={member}
              openPaywallModal={openPaywallModal}
              hittingPaywall={hittingPaywall}
            />
          );
        })}
      </Scrollable.Viewport>
      <Scrollable.Scrollbar className={styles.scrollbar} />
    </Scrollable.Root>
  );
};

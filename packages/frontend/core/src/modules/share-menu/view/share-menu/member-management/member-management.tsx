import { Scrollable, Skeleton } from '@affine/component';
import {
  DocGrantedUsersService,
  DocPermissionService,
  type GrantedUser,
} from '@affine/core/modules/permissions';
import { useI18n } from '@affine/i18n';
import { ArrowLeftBigIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { ShareMenuService, ShareMenuTab } from '../../../services/share-menu';
import { MemberItem } from './member-item';
import * as styles from './member-management.css';

export const MemberManagement = ({
  openPaywallModal,
  hittingPaywall,
}: {
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const shareMenuService = useService(ShareMenuService);
  const docGrantedUsersService = useService(DocGrantedUsersService);
  const docPermissionService = useService(DocPermissionService);
  const canManage = useLiveData(docPermissionService.canManage$);

  const grantedUserList = useLiveData(
    docGrantedUsersService.docGrantedUsers.docGrantedUsers$
  );
  const grantedUserCount = useLiveData(
    docGrantedUsersService.docGrantedUsers.grantedUserCount$
  );

  const switchToShareTab = useCallback(() => {
    shareMenuService.switchTab(ShareMenuTab.Share);
  }, [shareMenuService]);
  const switchToInviteTab = useCallback(() => {
    shareMenuService.switchTab(ShareMenuTab.Invite);
  }, [shareMenuService]);

  const t = useI18n();
  return (
    <div className={styles.containerStyle}>
      <div className={styles.headerStyle} onClick={switchToShareTab}>
        <ArrowLeftBigIcon className={styles.iconStyle} />
        {t['com.affine.share-menu.member-management.header']({
          memberCount: grantedUserCount?.toString() || '??',
        })}
      </div>
      {grantedUserList ? (
        <MemberList
          openPaywallModal={openPaywallModal}
          hittingPaywall={hittingPaywall}
          grantedUserList={grantedUserList}
        />
      ) : (
        <Skeleton className={styles.scrollableRootStyle} />
      )}
      {canManage ? (
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
  grantedUserList,
}: {
  hittingPaywall: boolean;
  grantedUserList: GrantedUser[];
  openPaywallModal: () => void;
}) => {
  return (
    <Scrollable.Root className={styles.scrollableRootStyle}>
      <Scrollable.Viewport className={styles.memberListStyle}>
        {grantedUserList.map(grantedUser => {
          return (
            <MemberItem
              key={grantedUser.user.id}
              grantedUser={grantedUser}
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

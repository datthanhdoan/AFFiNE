import {
  Avatar,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import {
  DocGrantedUsersService,
  DocPermissionService,
  type GrantedUser,
} from '@affine/core/modules/permissions';
import { DocRole } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useMemo } from 'react';

import { PlanTag } from '../plan-tag';
import * as styles from './member-item.css';

export const MemberItem = ({
  openPaywallModal,
  hittingPaywall,
  grantedUser,
}: {
  grantedUser: GrantedUser;
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const docPermissionService = useService(DocPermissionService);
  const canManage = useLiveData(docPermissionService.canManage$);

  const user = grantedUser.user;

  const role = useMemo(() => {
    switch (grantedUser.role) {
      case DocRole.Owner:
        return 'Owner';
      case DocRole.Manager:
        return 'Can manage';
      case DocRole.Editor:
        return 'Can edit';
      case DocRole.Reader:
        return 'Can read';
      default:
        return '';
    }
  }, [grantedUser.role]);

  return (
    <div className={styles.memberItemStyle}>
      <div className={styles.memberContainerStyle}>
        <Avatar
          key={user.id}
          url={user.avatarUrl || ''}
          name={user.name}
          size={36}
        />
        <div className={styles.memberInfoStyle}>
          <Tooltip
            content={user.name}
            rootOptions={{ delayDuration: 1000 }}
            options={{
              className: styles.tooltipContentStyle,
            }}
          >
            <div className={styles.memberNameStyle}>{user.name}</div>
          </Tooltip>
          <Tooltip
            content={user.email}
            rootOptions={{ delayDuration: 1000 }}
            options={{
              className: styles.tooltipContentStyle,
            }}
          >
            <div className={styles.memberEmailStyle}>{user.email}</div>
          </Tooltip>
        </div>
      </div>

      {!canManage || grantedUser.role === DocRole.Owner ? (
        <div className={clsx(styles.memberRoleStyle, 'disable')}>{role}</div>
      ) : (
        <Menu
          items={
            <Options
              userId={user.id}
              memberRole={grantedUser.role}
              hittingPaywall={hittingPaywall}
              openPaywallModal={openPaywallModal}
            />
          }
          contentOptions={{
            align: 'start',
          }}
        >
          <MenuTrigger
            variant="plain"
            className={styles.menuTriggerStyle}
            contentStyle={{
              width: '100%',
            }}
          >
            {role}
          </MenuTrigger>
        </Menu>
      )}
    </div>
  );
};

const Options = ({
  openPaywallModal,
  hittingPaywall,
  memberRole,
  userId,
}: {
  userId: string;
  memberRole: DocRole;
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const t = useI18n();
  const docPermissionService = useService(DocPermissionService);
  const docGrantedUsersService = useService(DocGrantedUsersService);
  const isOwner = useLiveData(docPermissionService.isOwner$);
  const canManage = useLiveData(docPermissionService.canManage$);

  const changeToManager = useAsyncCallback(async () => {
    await docGrantedUsersService.updateUserRole(userId, DocRole.Manager);
    docGrantedUsersService.docGrantedUsers.revalidate();
  }, [docGrantedUsersService, userId]);

  const changeToEditor = useAsyncCallback(async () => {
    if (hittingPaywall) {
      openPaywallModal();
      return;
    }
    await docGrantedUsersService.updateUserRole(userId, DocRole.Editor);
    docGrantedUsersService.docGrantedUsers.revalidate();
  }, [docGrantedUsersService, hittingPaywall, openPaywallModal, userId]);

  const changeToReader = useAsyncCallback(async () => {
    if (hittingPaywall) {
      openPaywallModal();
      return;
    }
    await docGrantedUsersService.updateUserRole(userId, DocRole.Reader);
    docGrantedUsersService.docGrantedUsers.revalidate();
  }, [docGrantedUsersService, hittingPaywall, openPaywallModal, userId]);

  const changeToOwner = useAsyncCallback(async () => {
    await docGrantedUsersService.updateUserRole(userId, DocRole.Owner);
    docGrantedUsersService.docGrantedUsers.revalidate();
  }, [docGrantedUsersService, userId]);

  const removeMember = useAsyncCallback(async () => {
    await docGrantedUsersService.revokeUsersRole([userId]);
    docGrantedUsersService.docGrantedUsers.revalidate();
  }, [docGrantedUsersService, userId]);

  const operationButtonInfo = useMemo(() => {
    return [
      {
        label: t['com.affine.share-menu.option.permission.can-manage'](),
        onClick: changeToManager,
        role: DocRole.Manager,
        show: canManage,
      },
      {
        label: t['com.affine.share-menu.option.permission.can-edit'](),
        onClick: changeToEditor,
        role: DocRole.Editor,
        show: canManage,
        showPlanTag: true,
      },
      {
        label: t['com.affine.share-menu.option.permission.can-read'](),
        onClick: changeToReader,
        role: DocRole.Reader,
        show: canManage,
        showPlanTag: true,
      },
    ];
  }, [changeToEditor, changeToManager, changeToReader, canManage, t]);

  return (
    <>
      {operationButtonInfo.map(item =>
        item.show ? (
          <MenuItem
            key={item.label}
            onSelect={item.onClick}
            selected={memberRole === item.role}
          >
            <div className={styles.planTagContainer}>
              {item.label} {item.showPlanTag ? <PlanTag /> : null}
            </div>
          </MenuItem>
        ) : null
      )}
      {isOwner ? (
        <MenuItem onSelect={changeToOwner}>
          {t['com.affine.share-menu.member-management.set-as-owner']()}
        </MenuItem>
      ) : null}
      {canManage ? (
        <>
          <MenuSeparator />
          <MenuItem
            onSelect={removeMember}
            type="danger"
            className={styles.remove}
          >
            {t['com.affine.share-menu.member-management.remove']()}
          </MenuItem>
        </>
      ) : null}
    </>
  );
};

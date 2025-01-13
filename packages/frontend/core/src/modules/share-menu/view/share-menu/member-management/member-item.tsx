import {
  Avatar,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Tooltip,
} from '@affine/component';
import type { Member } from '@affine/core/modules/permissions';
import { Permission } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import clsx from 'clsx';
import { useMemo } from 'react';

import { PlanTag } from '../plan-tag';
import * as styles from './member-item.css';

export const MemberItem = ({
  openPaywallModal,
  hittingPaywall,
  member,
}: {
  member: Member;
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const isOwner = true;
  const isManager = false;

  const role = useMemo(() => {
    switch (member.permission) {
      case Permission.Owner:
        return 'Owner';
      case Permission.Admin:
        return 'Can manage';
      case Permission.Write:
        return 'Can edit';
      case Permission.Read:
        return 'Can read';
      default:
        return '';
    }
  }, [member.permission]);

  return (
    <div className={styles.memberItemStyle}>
      <div className={styles.memberContainerStyle}>
        <Avatar
          key={member.id}
          url={member.avatarUrl || ''}
          name={member.name || ''}
          size={36}
        />
        <div className={styles.memberInfoStyle}>
          <Tooltip
            content={member.name}
            rootOptions={{ delayDuration: 1000 }}
            options={{
              className: styles.tooltipContentStyle,
            }}
          >
            <div className={styles.memberNameStyle}>{member.name}</div>
          </Tooltip>
          <Tooltip
            content={member.email}
            rootOptions={{ delayDuration: 1000 }}
            options={{
              className: styles.tooltipContentStyle,
            }}
          >
            <div className={styles.memberEmailStyle}>{member.email}</div>
          </Tooltip>
        </div>
      </div>

      {(!isOwner && !isManager) || member.permission === Permission.Owner ? (
        <div className={clsx(styles.memberRoleStyle, 'disable')}>{role}</div>
      ) : (
        <Menu
          items={
            <Options
              memberPermission={member.permission}
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

// TODO(@JimmFly): impl Options component
const Options = ({
  openPaywallModal,
  hittingPaywall,
  memberPermission,
}: {
  memberPermission: Permission;
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const t = useI18n();
  const isOwner = true;
  const isManager = false;
  const isOwnerOrManager = isOwner || isManager;
  const operationButtonInfo = useMemo(() => {
    return [
      {
        label: t['com.affine.share-menu.option.permission.can-manage'](),
        onClick: () => {},
        permission: Permission.Admin,
        show: isOwnerOrManager,
      },
      {
        label: t['com.affine.share-menu.option.permission.can-edit'](),
        onClick: () => {
          if (hittingPaywall) {
            openPaywallModal();
          }
        },
        permission: Permission.Write,
        show: isOwnerOrManager,
        showPlanTag: true,
      },
      {
        label: t['com.affine.share-menu.option.permission.can-read'](),
        onClick: () => {
          if (hittingPaywall) {
            openPaywallModal();
          }
        },
        permission: Permission.Read,
        show: isOwnerOrManager,
        showPlanTag: true,
      },
    ];
  }, [hittingPaywall, isOwnerOrManager, openPaywallModal, t]);

  return (
    <>
      {operationButtonInfo.map(item =>
        item.show ? (
          <MenuItem
            key={item.label}
            onSelect={item.onClick}
            selected={memberPermission === item.permission}
          >
            <div className={styles.planTagContainer}>
              {item.label} {item.showPlanTag ? <PlanTag /> : null}
            </div>
          </MenuItem>
        ) : null
      )}
      {isOwner ? (
        <MenuItem onSelect={() => {}}>
          {t['com.affine.share-menu.member-management.set-as-owner']()}
        </MenuItem>
      ) : null}
      {isOwnerOrManager ? (
        <>
          <MenuSeparator />
          <MenuItem onSelect={() => {}} type="danger" className={styles.remove}>
            {t['com.affine.share-menu.member-management.remove']()}
          </MenuItem>
        </>
      ) : null}
    </>
  );
};

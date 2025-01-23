import { Avatar, Tooltip } from '@affine/component';
import type { GrantedUser } from '@affine/core/modules/permissions';
import { DocRole } from '@affine/graphql';
import clsx from 'clsx';
import { useMemo } from 'react';

import * as styles from './member-item.css';

export const MemberItem = ({ grantedUser }: { grantedUser: GrantedUser }) => {
  const member = grantedUser.user;
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
      <div className={clsx(styles.memberRoleStyle, 'disable')}>{role}</div>
    </div>
  );
};

import { Avatar, Tooltip } from '@affine/component';
import type { Member } from '@affine/core/modules/permissions';
import { Permission } from '@affine/graphql';
import clsx from 'clsx';
import { useMemo } from 'react';

import * as styles from './member-item.css';

export const MemberItem = ({ member }: { member: Member }) => {
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
      <div className={clsx(styles.memberRoleStyle, 'disable')}>{role}</div>
    </div>
  );
};

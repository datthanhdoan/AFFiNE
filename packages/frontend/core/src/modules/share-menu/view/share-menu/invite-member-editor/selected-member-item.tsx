import type { GrantedUser } from '@affine/core/modules/permissions';
import { CloseIcon } from '@blocksuite/icons/rc';
import { type MouseEventHandler, useCallback } from 'react';

import * as styles from './selected-member-item.css';

export interface TagItemProps {
  grantedUser: GrantedUser;
  idx?: number;
  onRemoved?: () => void;
  style?: React.CSSProperties;
}

export const SelectedMemberItem = ({
  grantedUser,
  idx,
  onRemoved,
  style,
}: TagItemProps) => {
  const member = grantedUser.user;
  const handleRemove: MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      e.stopPropagation();
      onRemoved?.();
    },
    [onRemoved]
  );
  return (
    <div
      className={styles.member}
      data-idx={idx}
      style={{
        ...style,
      }}
    >
      <div className={styles.memberInnerWrapper}>
        <div className={styles.label}>{member.name}</div>
        {onRemoved ? (
          <div className={styles.remove} onClick={handleRemove}>
            <CloseIcon />
          </div>
        ) : null}
      </div>
    </div>
  );
};

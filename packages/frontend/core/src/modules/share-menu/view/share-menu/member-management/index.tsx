import { Avatar, Tooltip } from '@affine/component';
import type { Member } from '@affine/core/modules/permissions';
import { useI18n } from '@affine/i18n';
import { ArrowRightSmallIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { cssVarV2 } from '@toeverything/theme/v2';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

import { ShareMenuService, ShareMenuTab } from '../../../services/share-menu';
import * as styles from './styles.css';

export { MemberManagement } from './member-management';

export const MembersRow = ({
  docOwner,
  members,
}: {
  docOwner: Member;
  members: Member[];
}) => {
  const t = useI18n();
  const shareMenuService = useService(ShareMenuService);
  const handleClick = useCallback(() => {
    shareMenuService.switchTab(ShareMenuTab.Members);
  }, [shareMenuService]);

  const topThreeMembers = useMemo(
    () =>
      members.slice(0, Math.min(3, members.length)).map(member => ({
        name: member.name || member.email || member.id,
        avatarUrl: member.avatarUrl,
        id: member.id,
      })),
    [members]
  );

  const description = useMemo(() => {
    if (members.length <= 1) {
      return '';
    }
    switch (members.length) {
      case 2:
        return t['com.affine.share-menu.member-management.member-count-2']({
          member1: topThreeMembers[0].name,
          member2: topThreeMembers[1].name,
        });
      case 3:
        return t['com.affine.share-menu.member-management.member-count-3']({
          member1: topThreeMembers[0].name,
          member2: topThreeMembers[1].name,
          member3: topThreeMembers[2].name,
        });
      default:
        return t['com.affine.share-menu.member-management.member-count-more']({
          member1: topThreeMembers[0].name,
          member2: topThreeMembers[1].name,
          memberCount: (members.length - 2).toString(),
        });
    }
  }, [members.length, t, topThreeMembers]);

  if (members.length > 1) {
    return (
      <Tooltip content={description}>
        <div
          className={clsx(styles.rowContainerStyle, 'clickable')}
          onClick={handleClick}
        >
          <div className={styles.memberContainerStyle}>
            <div className={styles.avatarsContainerStyle}>
              {topThreeMembers.map((member, index) => (
                <Avatar
                  key={member.id}
                  url={member.avatarUrl || ''}
                  name={member.name || ''}
                  size={24}
                  style={{
                    marginLeft: index === 0 ? 0 : -8,
                    border: `1px solid ${cssVarV2('layer/white')}`,
                  }}
                />
              ))}
            </div>
            <span className={styles.descriptionStyle}>{description}</span>
          </div>
          <div className={styles.IconButtonStyle}>
            <ArrowRightSmallIcon />
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className={styles.rowContainerStyle}>
      <div className={styles.memberContainerStyle}>
        <Avatar
          url={docOwner.avatarUrl || ''}
          name={docOwner.name || ''}
          size={24}
        />
        <span>{docOwner.name}</span>
      </div>
      <div className={styles.OwnerStyle}>{t['Owner']()}</div>
    </div>
  );
};

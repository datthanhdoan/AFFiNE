import { Input } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { SearchIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { ShareMenuService, ShareMenuTab } from '../../../services/share-menu';
import * as styles from './styles.css';

export const InviteInput = () => {
  const shareMenuService = useService(ShareMenuService);
  const t = useI18n();
  const handleFocus = useCallback(
    () => shareMenuService.switchTab(ShareMenuTab.Invite),
    [shareMenuService]
  );

  return (
    <Input
      preFix={<SearchIcon fontSize={20} />}
      className={styles.inputStyle}
      onFocus={handleFocus}
      inputStyle={{
        paddingLeft: '0',
      }}
      placeholder={t['com.affine.share-menu.invite-editor.placeholder']()}
    />
  );
};

import { useEnableCloud } from '@affine/core/components/hooks/affine/use-enable-cloud';
import type { Workspace } from '@affine/core/modules/workspace';
import { track } from '@affine/track';
import type { Store } from '@blocksuite/affine/store';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { ShareMenuService, ShareMenuTab } from '../services/share-menu';
import { ShareMenu } from './share-menu';
export { CloudSvg } from './cloud-svg';
export { ShareMenuContent } from './share-menu';

type SharePageModalProps = {
  workspace: Workspace;
  page: Store;
};

export const SharePageButton = ({ workspace, page }: SharePageModalProps) => {
  const confirmEnableCloud = useEnableCloud();
  const shareMenuService = useService(ShareMenuService);
  const handleOpenShareModal = useCallback(
    (open: boolean) => {
      if (open) {
        track.$.sharePanel.$.open();
        shareMenuService.setQuery('');
        shareMenuService.switchTab(ShareMenuTab.Share);
      }
    },
    [shareMenuService]
  );

  return (
    <ShareMenu
      workspaceMetadata={workspace.meta}
      currentPage={page}
      onEnableAffineCloud={() =>
        confirmEnableCloud(workspace, {
          openPageId: page.id,
        })
      }
      onOpenShareModal={handleOpenShareModal}
    />
  );
};

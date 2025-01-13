import { type Framework } from '@toeverything/infra';

import { WorkspaceScope } from '../workspace';
import { ShareMenuService } from './services/share-menu';

export function configureShareMenuModule(framework: Framework) {
  framework.scope(WorkspaceScope).service(ShareMenuService);
}

export { ShareMenuService, type ShareMenuTab } from './services/share-menu';
export { CloudSvg, ShareMenuContent, SharePageButton } from './view';

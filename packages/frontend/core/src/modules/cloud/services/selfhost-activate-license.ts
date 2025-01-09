import { Service } from '@toeverything/infra';

import type { SelfhostLicenseStore } from '../stores/selfhost-license';

export class SelfhostActivateLicenseService extends Service {
  constructor(private readonly store: SelfhostLicenseStore) {
    super();
  }
  async activateLicense(workspaceId: string, licenseKey: string) {
    return await this.store.activate(workspaceId, licenseKey);
  }

  async deactivateLicense(workspaceId: string) {
    return await this.store.deactivate(workspaceId);
  }
}

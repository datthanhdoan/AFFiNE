import assert from 'node:assert';

import { Injectable, Logger } from '@nestjs/common';
import semver from 'semver';

import { Runtime, UnsupportedClientVersion } from '../../base';

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);

  constructor(private readonly runtime: Runtime) {}

  async checkVersion(clientVersion?: any) {
    const minVersion = await this.runtime.fetch('version/minVersion');
    const readableMinVersion = semver.valid(semver.coerce(minVersion));
    if (!minVersion || !readableMinVersion) {
      // ignore invalid min version config
      return true;
    }

    assert(
      typeof clientVersion === 'string' && clientVersion.length > 0,
      new UnsupportedClientVersion({
        minVersion: readableMinVersion,
      })
    );

    if (semver.valid(clientVersion)) {
      if (!semver.satisfies(clientVersion, minVersion)) {
        throw new UnsupportedClientVersion({
          minVersion: readableMinVersion,
        });
      }
      return true;
    } else {
      if (clientVersion) {
        this.logger.warn(`Invalid client version: ${clientVersion}`);
      }
      throw new UnsupportedClientVersion({
        minVersion: readableMinVersion,
      });
    }
  }
}

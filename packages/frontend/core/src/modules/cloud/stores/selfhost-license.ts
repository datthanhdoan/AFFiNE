import {
  activateLicenseMutation,
  deactivateLicenseMutation,
  generateLicenseKeyMutation,
} from '@affine/graphql';
import { Store } from '@toeverything/infra';

import type { GraphQLService } from '../services/graphql';

export class SelfhostLicenseStore extends Store {
  constructor(private readonly gqlService: GraphQLService) {
    super();
  }

  async generateKey(sessionId: string, signal?: AbortSignal): Promise<string> {
    const data = await this.gqlService.gql({
      query: generateLicenseKeyMutation,
      variables: {
        sessionId: sessionId,
      },
      context: {
        signal,
      },
    });

    return data.generateLicenseKey;
  }

  async activate(workspaceId: string, license: string, signal?: AbortSignal) {
    const data = await this.gqlService.gql({
      query: activateLicenseMutation,
      variables: {
        workspaceId: workspaceId,
        license: license,
      },
      context: {
        signal,
      },
    });

    return data.activateLicense;
  }

  async deactivate(workspaceId: string, signal?: AbortSignal) {
    const data = await this.gqlService.gql({
      query: deactivateLicenseMutation,
      variables: {
        workspaceId: workspaceId,
      },
      context: {
        signal,
      },
    });

    return data.deactivateLicense;
  }
}

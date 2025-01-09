import { Button, ConfirmModal, Input, notify } from '@affine/component';
import { SettingRow } from '@affine/component/setting-components';
import { SelfhostActivateLicenseService } from '@affine/core/modules/cloud';
import { WorkspacePermissionService } from '@affine/core/modules/permissions';
import { WorkspaceQuotaService } from '@affine/core/modules/quota';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { UserFriendlyError } from '@affine/graphql';
import { Trans, useI18n } from '@affine/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SettingState } from '../../types';
import * as styles from './styles.css';

export const SelfHostTeamCard = ({
  onChangeSettingState,
}: {
  onChangeSettingState: (state: SettingState) => void;
}) => {
  const t = useI18n();

  const workspace = useService(WorkspaceService).workspace;
  const workspaceQuotaService = useService(WorkspaceQuotaService);
  const permission = useService(WorkspacePermissionService).permission;
  const isTeam = useLiveData(permission.isTeam$);
  const workspaceQuota = useLiveData(workspaceQuotaService.quota.quota$);

  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const selfhostActivateLicenseService = useService(
    SelfhostActivateLicenseService
  );

  useEffect(() => {
    permission.revalidate();
    workspaceQuotaService.quota.revalidate();
  }, [permission, workspaceQuotaService]);

  const expirationDate = useMemo(() => {
    if (isTeam) {
      return t[
        'com.affine.settings.workspace.license.self-host-team.team.description'
      ]({
        expirationDate: new Date().toLocaleDateString(),
      });
    }
    return t[
      'com.affine.settings.workspace.license.self-host-team.free.description'
    ]({
      memberCount: workspaceQuota?.humanReadable.memberLimit || '10',
    });
  }, [isTeam, t, workspaceQuota]);
  const handleClick = useCallback(() => {
    setOpenModal(true);
  }, []);

  const jumpToPricePlan = useCallback(() => {
    onChangeSettingState({
      activeTab: 'plans',
      scrollAnchor: 'TeamPricingPlan',
    });
  }, [onChangeSettingState]);

  const onActivate = useCallback(
    (license: string) => {
      setLoading(true);
      selfhostActivateLicenseService
        .activateLicense(workspace.id, license)
        .then(() => {
          setLoading(false);
          setOpenModal(false);
          permission.revalidate();
          notify.success({
            title:
              t['com.affine.settings.workspace.license.activate-success'](),
          });
        })
        .catch(e => {
          setLoading(false);

          console.error(e);
          const error = UserFriendlyError.fromAnyError(e);

          notify.error({
            title: error.name,
            message: error.message,
          });
        });
    },
    [permission, selfhostActivateLicenseService, t, workspace.id]
  );

  const onDeactivate = useCallback(() => {
    setLoading(true);
    selfhostActivateLicenseService
      .deactivateLicense(workspace.id)
      .then(() => {
        setLoading(false);
        setOpenModal(false);
        permission.revalidate();
        notify.success({
          title:
            t['com.affine.settings.workspace.license.deactivate-success'](),
        });
      })
      .catch(e => {
        setLoading(false);

        console.error(e);
        const error = UserFriendlyError.fromAnyError(e);

        notify.error({
          title: error.name,
          message: error.message,
        });
      });
  }, [permission, selfhostActivateLicenseService, t, workspace.id]);

  const handleConfirm = useCallback(
    (license: string) => {
      if (isTeam) {
        onDeactivate();
      } else {
        onActivate(license);
      }
    },
    [isTeam, onActivate, onDeactivate]
  );

  return (
    <>
      <div className={styles.planCard}>
        <div className={styles.currentPlan}>
          <SettingRow
            spreadCol={false}
            name={t['com.affine.settings.workspace.license.self-host-team']()}
            desc={expirationDate}
          />
          <Button
            variant="primary"
            className={styles.activeButton}
            onClick={handleClick}
          >
            {t[
              `com.affine.settings.workspace.license.self-host-team.${isTeam ? 'deactivate-license' : 'active-key'}`
            ]()}
          </Button>
          {isTeam ? null : (
            <Button className={styles.activeButton} onClick={jumpToPricePlan}>
              {t['com.affine.settings.workspace.license.buy-more-seat']()}
            </Button>
          )}
        </div>
        <p className={styles.planPrice}>
          {workspaceQuota?.memberCount}
          {isTeam ? '' : `/${workspaceQuota?.memberLimit}`}
          <span className={styles.seat}>
            {t['com.affine.settings.workspace.license.self-host-team.seats']()}
          </span>
        </p>
      </div>
      <ActionModal
        open={openModal}
        onOpenChange={setOpenModal}
        isTeam={!!isTeam}
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  );
};

const ActionModal = ({
  open,
  onOpenChange,
  isTeam,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTeam: boolean;
  loading: boolean;
  onConfirm: (key: string) => void;
}) => {
  const t = useI18n();
  const [key, setKey] = useState('');

  const handleConfirm = useCallback(() => {
    onConfirm(key);
  }, [key, onConfirm]);

  return (
    <ConfirmModal
      width={480}
      open={open}
      onOpenChange={onOpenChange}
      title={t[
        `com.affine.settings.workspace.license.${isTeam ? 'deactivate' : 'activate'}-modal.title`
      ]()}
      description={t[
        `com.affine.settings.workspace.license.${isTeam ? 'deactivate' : 'activate'}-modal.description`
      ]()}
      cancelText={t['Cancel']()}
      cancelButtonOptions={{
        variant: 'secondary',
      }}
      contentOptions={{
        ['data-testid' as string]: 'invite-modal',
        style: {
          padding: '20px 24px',
        },
      }}
      confirmText={t['Confirm']()}
      confirmButtonOptions={{
        loading: loading,
        variant: isTeam ? 'error' : 'primary',
        disabled: loading || (!isTeam && !key),
      }}
      onConfirm={handleConfirm}
      childrenContentClassName={styles.activateModalContent}
    >
      {isTeam ? null : (
        <>
          <Input
            value={key}
            onChange={setKey}
            placeholder="AAAA-AAAA-AAAA-AAAA-AAAA"
          />
          <span>
            <Trans i18nKey="com.affine.settings.workspace.license.activate-modal.tips">
              If you encounter any issues, please contact our
              <a
                href="mailto:support@toeverything.info"
                style={{ color: 'var(--affine-link-color)' }}
              >
                customer support
              </a>
              .
            </Trans>
          </span>
        </>
      )}
    </ConfirmModal>
  );
};

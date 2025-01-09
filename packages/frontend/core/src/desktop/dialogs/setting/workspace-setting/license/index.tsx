import { Button, Switch } from '@affine/component';
import {
  SettingHeader,
  SettingRow,
} from '@affine/component/setting-components';
import { getUpgradeQuestionnaireLink } from '@affine/core/components/hooks/affine/use-subscription-notify';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { useMutation } from '@affine/core/components/hooks/use-mutation';
import {
  AuthService,
  WorkspaceSubscriptionService,
} from '@affine/core/modules/cloud';
import { UrlService } from '@affine/core/modules/url';
import { WorkspaceService } from '@affine/core/modules/workspace';
import {
  createCustomerPortalMutation,
  SubscriptionPlan,
  SubscriptionRecurring,
} from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import type { SettingState } from '../../types';
import { SelfHostTeamCard } from './self-host-team-card';
import * as styles from './styles.css';

export const WorkspaceSettingLicense = ({
  onChangeSettingState,
}: {
  onChangeSettingState: (state: SettingState) => void;
}) => {
  const workspace = useService(WorkspaceService).workspace;

  const t = useI18n();

  const subscriptionService = workspace?.scope.get(
    WorkspaceSubscriptionService
  );
  const subscription = useLiveData(
    subscriptionService?.subscription.subscription$
  );

  // TODO(@JimmFly): add sign in check

  useEffect(() => {
    subscriptionService?.subscription.revalidate();
  }, [subscriptionService?.subscription]);

  if (workspace === null) {
    return null;
  }

  return (
    <FrameworkScope scope={workspace.scope}>
      <SettingHeader
        title={t['com.affine.settings.workspace.license']()}
        subtitle={t['com.affine.settings.workspace.license.description']()}
      />
      {workspace.flavour !== 'local' ? (
        <>
          <SelfHostTeamCard onChangeSettingState={onChangeSettingState} />
          <TypeFormLink />
          <PaymentMethodUpdater />
          <Checkout />
          {subscription?.end ? (
            <ResumeSubscription expirationDate={subscription.end} />
          ) : null}
        </>
      ) : (
        'Self-hosted Team workspace depends on cloud workspace, please sign in and enable cloud first.'
      )}
    </FrameworkScope>
  );
};

const ResumeSubscription = ({ expirationDate }: { expirationDate: string }) => {
  const t = useI18n();
  const handleClick = useCallback(() => {
    window.open('', '_blank');
  }, []);

  return (
    <SettingRow
      name={t['com.affine.payment.billing-setting.expiration-date']()}
      desc={t['com.affine.payment.billing-setting.expiration-date.description'](
        {
          expirationDate: new Date(expirationDate).toLocaleDateString(),
        }
      )}
    >
      <Button onClick={handleClick} variant="primary">
        {t['com.affine.settings.workspace.license.buy-more-seat']()}
      </Button>
    </SettingRow>
  );
};

const TypeFormLink = () => {
  const t = useI18n();
  const workspaceSubscriptionService = useService(WorkspaceSubscriptionService);
  const authService = useService(AuthService);

  const workspaceSubscription = useLiveData(
    workspaceSubscriptionService.subscription.subscription$
  );
  const account = useLiveData(authService.session.account$);

  if (!account) return null;

  const link = getUpgradeQuestionnaireLink({
    name: account.info?.name,
    id: account.id,
    email: account.email,
    recurring: workspaceSubscription?.recurring ?? SubscriptionRecurring.Yearly,
    plan: SubscriptionPlan.SelfHostedTeam,
  });

  return (
    <SettingRow
      className={styles.paymentMethod}
      name={t['com.affine.payment.billing-type-form.title']()}
      desc={t['com.affine.payment.billing-type-form.description']()}
    >
      <a target="_blank" href={link} rel="noreferrer">
        <Button>{t['com.affine.payment.billing-type-form.go']()}</Button>
      </a>
    </SettingRow>
  );
};

const PaymentMethodUpdater = () => {
  const { isMutating, trigger } = useMutation({
    mutation: createCustomerPortalMutation,
  });
  const urlService = useService(UrlService);
  const t = useI18n();

  const update = useAsyncCallback(async () => {
    await trigger(null, {
      onSuccess: data => {
        urlService.openPopupWindow(data.createCustomerPortal);
      },
    });
  }, [trigger, urlService]);

  return (
    <SettingRow
      className={styles.paymentMethod}
      name={t['com.affine.payment.billing-setting.payment-method']()}
      desc={t[
        'com.affine.payment.billing-setting.payment-method.description'
      ]()}
    >
      <Button onClick={update} loading={isMutating} disabled={isMutating}>
        {t['com.affine.payment.billing-setting.payment-method.go']()}
      </Button>
    </SettingRow>
  );
};

const Checkout = () => {
  const t = useI18n();
  const [recurring, setRecurring] = useState(SubscriptionRecurring.Monthly);
  const onCheckout = useCallback(() => {
    // https://affine.fail/
    // http://localhost:8080/
    window.open(
      `http://localhost:8080/subscribe?product=${recurring === SubscriptionRecurring.Monthly ? 'monthly' : 'yearly'}-selfhost-team`,
      '_blank'
    );
  }, [recurring]);
  const toggleSwitch = useCallback((checked: boolean) => {
    if (checked) {
      setRecurring(SubscriptionRecurring.Yearly);
      return;
    }
    setRecurring(SubscriptionRecurring.Monthly);
  }, []);
  return (
    <SettingRow
      className={styles.paymentMethod}
      name={
        <Switch
          checked={recurring === SubscriptionRecurring.Yearly}
          onChange={toggleSwitch}
        >
          {t['com.affine.payment.cloud.pricing-plan.toggle-billed-yearly']()}
        </Switch>
      }
      desc={''}
    >
      <Button onClick={onCheckout}>Checkout</Button>
    </SettingRow>
  );
};

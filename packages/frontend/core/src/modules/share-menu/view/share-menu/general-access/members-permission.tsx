import { Menu, MenuItem, MenuTrigger } from '@affine/component';
import { useI18n } from '@affine/i18n';
import { useCallback, useMemo, useState } from 'react';

import { PlanTag } from '../plan-tag';
import * as styles from './styles.css';

enum MockDocPermission {
  Edit = 'edit',
  Read = 'read',
  Manage = 'manage',
}

const getRoleName = (
  role: MockDocPermission,
  t: ReturnType<typeof useI18n>
) => {
  switch (role) {
    case MockDocPermission.Manage:
      return t['com.affine.share-menu.option.permission.can-manage']();
    case MockDocPermission.Edit:
      return t['com.affine.share-menu.option.permission.can-edit']();
    case MockDocPermission.Read:
      return t['com.affine.share-menu.option.permission.can-read']();
    default:
      return '';
  }
};
// TODO(@JimmFly): impl the real permission
export const MembersPermission = ({
  openPaywallModal,
  hittingPaywall,
}: {
  hittingPaywall: boolean;
  openPaywallModal?: () => void;
}) => {
  const t = useI18n();
  const [permission, setPermission] = useState<MockDocPermission>(
    MockDocPermission.Manage
  );
  const currentRoleName = useMemo(
    () => getRoleName(permission, t),
    [permission, t]
  );

  const changePermission = useCallback((newPermission: MockDocPermission) => {
    setPermission(newPermission);
  }, []);

  const selectManage = useCallback(() => {
    changePermission(MockDocPermission.Manage);
  }, [changePermission]);

  const selectEdit = useCallback(() => {
    if (hittingPaywall) {
      openPaywallModal?.();
      return;
    }
    changePermission(MockDocPermission.Edit);
  }, [changePermission, hittingPaywall, openPaywallModal]);

  const selectRead = useCallback(() => {
    if (hittingPaywall) {
      openPaywallModal?.();
      return;
    }
    changePermission(MockDocPermission.Read);
  }, [changePermission, hittingPaywall, openPaywallModal]);
  return (
    <div className={styles.rowContainerStyle}>
      <div className={styles.labelStyle}>
        {t['com.affine.share-menu.option.permission.label']()}
      </div>
      <Menu
        contentOptions={{
          align: 'end',
        }}
        items={
          <>
            <MenuItem
              onSelect={selectManage}
              selected={permission === MockDocPermission.Manage}
            >
              <div className={styles.publicItemRowStyle}>
                {t['com.affine.share-menu.option.permission.can-manage']()}
              </div>
            </MenuItem>
            <MenuItem
              onSelect={selectEdit}
              selected={permission === MockDocPermission.Edit}
            >
              <div className={styles.publicItemRowStyle}>
                <div className={styles.tagContainerStyle}>
                  {t['com.affine.share-menu.option.permission.can-edit']()}
                  <PlanTag />
                </div>
              </div>
            </MenuItem>
            <MenuItem
              onSelect={selectRead}
              selected={permission === MockDocPermission.Read}
            >
              <div className={styles.publicItemRowStyle}>
                <div className={styles.tagContainerStyle}>
                  {t['com.affine.share-menu.option.permission.can-read']()}
                  <PlanTag />
                </div>
              </div>
            </MenuItem>
          </>
        }
      >
        <MenuTrigger
          className={styles.menuTriggerStyle}
          data-testid="share-link-menu-trigger"
          variant="plain"
          contentStyle={{
            width: '100%',
          }}
        >
          {currentRoleName}
        </MenuTrigger>
      </Menu>
    </div>
  );
};

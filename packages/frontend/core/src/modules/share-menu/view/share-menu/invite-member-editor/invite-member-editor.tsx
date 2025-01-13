import {
  Button,
  Checkbox,
  Menu,
  MenuItem,
  MenuTrigger,
  RowInput,
  Scrollable,
} from '@affine/component';
import { WorkspaceDialogService } from '@affine/core/modules/dialogs';
import type { Member } from '@affine/core/modules/permissions';
import { Permission, WorkspaceMemberStatus } from '@affine/graphql';
import { useI18n } from '@affine/i18n';
import { ArrowLeftBigIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ShareMenuService, ShareMenuTab } from '../../../services/share-menu';
import { PlanTag } from '../plan-tag';
import * as styles from './invite-member-editor.css';
import { MemberItem } from './member-item';
import { SelectedMemberItem } from './selected-member-item';

const mockMembers: Member[] = [
  {
    id: '2',
    name: 'Member 1',
    avatarUrl: '',
    email: 'fakeemail@gamicl.com',
    permission: Permission.Owner,
    inviteId: '',
    emailVerified: null,
    status: WorkspaceMemberStatus.Accepted,
  },
  {
    id: '3',
    name: 'Member 2',
    avatarUrl: '',
    email: 'testloasnodknaksldnalkndlkasnd@gamil.com',
    permission: Permission.Admin,
    inviteId: '',
    emailVerified: null,
    status: WorkspaceMemberStatus.Accepted,
  },
  {
    id: '4',
    name: 'loansodinsaodjsalkjdlkasnlkdnaslkdnl kasndlkaskldaslkdnalskndlkasn',
    avatarUrl: '',
    email: null,
    permission: Permission.Read,
    inviteId: '',
    emailVerified: null,
    status: WorkspaceMemberStatus.Accepted,
  },
];

const getRoleName = (role: Permission, t: ReturnType<typeof useI18n>) => {
  switch (role) {
    case Permission.Admin:
      return t['com.affine.share-menu.option.permission.can-manage']();
    case Permission.Write:
      return t['com.affine.share-menu.option.permission.can-edit']();
    case Permission.Read:
      return t['com.affine.share-menu.option.permission.can-read']();
    default:
      return '';
  }
};

// TODO(@JimmFly): Implement the invite member editor
export const InviteMemberEditor = ({
  openPaywallModal,
  hittingPaywall,
}: {
  hittingPaywall: boolean;
  openPaywallModal: () => void;
}) => {
  const t = useI18n();
  const shareMenuService = useService(ShareMenuService);
  const selectedMembers = useLiveData(shareMenuService.selectedMembers$);

  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [shouldSendEmail, setShouldSendEmail] = useState(false);
  const workspaceDialogService = useService(WorkspaceDialogService);

  const onInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const onCheckboxChange = useCallback(() => {
    setShouldSendEmail(prev => !prev);
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);
  const onFocus = useCallback(() => {
    setFocused(true);
  }, []);
  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const handleRemoved = useCallback(
    (memberId: string) => {
      shareMenuService.removeFromSelectedMembers(memberId);
      focusInput();
    },
    [shareMenuService, focusInput]
  );

  const switchToShareTab = useCallback(() => {
    shareMenuService.setQuery('');
    shareMenuService.switchTab(ShareMenuTab.Share);
  }, [shareMenuService]);
  const switchToMemberManagementTab = useCallback(() => {
    shareMenuService.setQuery('');
    workspaceDialogService.open('setting', {
      activeTab: 'workspace:preference',
    });
  }, [shareMenuService, workspaceDialogService]);

  return (
    <div className={styles.containerStyle}>
      <div className={styles.headerStyle} onClick={switchToShareTab}>
        <ArrowLeftBigIcon className={styles.iconStyle} />
        {t['com.affine.share-menu.invite-editor.header']()}
      </div>
      <div className={styles.memberListStyle}>
        <div
          className={clsx(styles.InputContainer, {
            focus: focused,
          })}
        >
          <div className={styles.inlineMembersContainer}>
            {selectedMembers.map((member, idx) => {
              if (!member) {
                return null;
              }
              const onRemoved = () => handleRemoved(member.id);
              return (
                <SelectedMemberItem
                  key={member.id}
                  idx={idx}
                  onRemoved={onRemoved}
                  member={member}
                />
              );
            })}
            <RowInput
              ref={inputRef}
              value={inputValue}
              onChange={onInputChange}
              onFocus={onFocus}
              onBlur={onBlur}
              autoFocus
              className={styles.searchInput}
              placeholder={t[
                'com.affine.share-menu.invite-editor.placeholder'
              ]()}
            />
          </div>
          {!selectedMembers.length ? null : (
            <RoleSelector
              openPaywallModal={openPaywallModal}
              hittingPaywall={hittingPaywall}
            />
          )}
        </div>

        <div>
          {!inputValue && selectedMembers.length > 0 ? (
            <div className={styles.sentEmail} onClick={onCheckboxChange}>
              <Checkbox className={styles.checkbox} checked={shouldSendEmail} />
              {t['com.affine.share-menu.invite-editor.sent-email']()}
            </div>
          ) : (
            <Result result={mockMembers} />
          )}
        </div>
      </div>
      <div className={styles.footerStyle}>
        <span
          className={styles.manageMemberStyle}
          onClick={switchToMemberManagementTab}
        >
          {t['com.affine.share-menu.invite-editor.manage-members']()}
        </span>
        <div className={styles.buttonsContainer}>
          <Button className={styles.button}>{t['Cancel']()}</Button>
          <Button
            className={styles.button}
            variant="primary"
            disabled={!selectedMembers.length}
          >
            {t['com.affine.share-menu.invite-editor.invite']()}
          </Button>
        </div>
      </div>
    </div>
  );
};

// TODO(@JimmFly): handle overflow
const Result = ({ result }: { result: Member[] }) => {
  const shareMenuService = useService(ShareMenuService);
  const t = useI18n();
  if (result.length === 0) {
    return (
      <div className={styles.noFound}>
        {t['com.affine.share-menu.invite-editor.no-found']()}
      </div>
    );
  }

  return (
    <Scrollable.Root>
      <Scrollable.Viewport className={styles.result}>
        {result.map(member => {
          const handleSelect = () => {
            shareMenuService.addToSelectedMembers(member);
          };
          return (
            <div onClick={handleSelect} key={member.id}>
              <MemberItem member={member} />
            </div>
          );
        })}
      </Scrollable.Viewport>
      <Scrollable.Scrollbar className={styles.scrollbar} />
    </Scrollable.Root>
  );
};

const RoleSelector = ({
  openPaywallModal,
  hittingPaywall,
}: {
  openPaywallModal: () => void;
  hittingPaywall: boolean;
}) => {
  const t = useI18n();
  const [role, setRole] = useState(Permission.Admin);
  const onRoleChange = useCallback((role: Permission) => {
    setRole(role);
  }, []);
  const currentRoleName = useMemo(() => getRoleName(role, t), [role, t]);

  const changeToAdmin = useCallback(
    () => onRoleChange(Permission.Admin),
    [onRoleChange]
  );
  const changeToWrite = useCallback(() => {
    if (hittingPaywall) {
      openPaywallModal();
      return;
    }
    onRoleChange(Permission.Write);
  }, [hittingPaywall, onRoleChange, openPaywallModal]);
  const changeToRead = useCallback(() => {
    if (hittingPaywall) {
      openPaywallModal();
      return;
    }
    onRoleChange(Permission.Read);
  }, [hittingPaywall, onRoleChange, openPaywallModal]);
  return (
    <div className={styles.roleSelectorContainer}>
      <Menu
        contentOptions={{
          align: 'end',
        }}
        items={
          <>
            <MenuItem
              onSelect={changeToAdmin}
              selected={role === Permission.Admin}
            >
              {t['com.affine.share-menu.option.permission.can-manage']()}
            </MenuItem>
            <MenuItem
              onSelect={changeToWrite}
              selected={role === Permission.Write}
            >
              <div className={styles.planTagContainer}>
                {t['com.affine.share-menu.option.permission.can-edit']()}
                <PlanTag />
              </div>
            </MenuItem>
            <MenuItem
              onSelect={changeToRead}
              selected={role === Permission.Read}
            >
              <div className={styles.planTagContainer}>
                {t['com.affine.share-menu.option.permission.can-read']()}
                <PlanTag />
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

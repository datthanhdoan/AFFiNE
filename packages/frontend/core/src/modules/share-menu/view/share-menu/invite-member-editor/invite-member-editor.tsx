import {
  Button,
  Checkbox,
  Menu,
  MenuItem,
  MenuTrigger,
  RowInput,
  Scrollable,
} from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { WorkspaceDialogService } from '@affine/core/modules/dialogs';
import {
  DocGrantedUsersService,
  type GrantedUser,
  WorkspaceMembersService,
} from '@affine/core/modules/permissions';
import { DocRole } from '@affine/graphql';
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

const getRoleName = (role: DocRole, t: ReturnType<typeof useI18n>) => {
  switch (role) {
    case DocRole.Manager:
      return t['com.affine.share-menu.option.permission.can-manage']();
    case DocRole.Editor:
      return t['com.affine.share-menu.option.permission.can-edit']();
    case DocRole.Reader:
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
  const docGrantedUsersService = useService(DocGrantedUsersService);
  const inviteDocRoleType = useLiveData(shareMenuService.inviteDocRoleType$);

  const membersService = useService(WorkspaceMembersService);
  const pageMembers = useLiveData(membersService.members.pageMembers$);

  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [shouldSendEmail, setShouldSendEmail] = useState(false);
  const workspaceDialogService = useService(WorkspaceDialogService);

  const onInvite = useAsyncCallback(async () => {
    const selectedMemberIds = selectedMembers.map(member => member.user.id);
    await docGrantedUsersService.grantUsersRole(
      selectedMemberIds,
      inviteDocRoleType
    );
  }, [docGrantedUsersService, inviteDocRoleType, selectedMembers]);

  // TODO(@JimmFly): Implement the search logic
  const mockGrantedUsers: GrantedUser[] | undefined = useMemo(() => {
    return pageMembers?.map(member => ({
      user: {
        id: member.id,
        name: member.name || '',
        email: member.email || '',
        avatarUrl: member.avatarUrl,
      },
      role: DocRole.Editor,
    }));
  }, [pageMembers]);

  const onCancel = useCallback(() => {
    shareMenuService.clear();
    shareMenuService.switchTab(ShareMenuTab.Share);
  }, [shareMenuService]);

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
            {selectedMembers.map((grantedUser, idx) => {
              if (!grantedUser) {
                return null;
              }
              const onRemoved = () => handleRemoved(grantedUser.user.id);
              return (
                <SelectedMemberItem
                  key={grantedUser.user.id}
                  idx={idx}
                  onRemoved={onRemoved}
                  grantedUser={grantedUser}
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
            <Result result={mockGrantedUsers} />
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
          <Button className={styles.button} onClick={onCancel}>
            {t['Cancel']()}
          </Button>
          <Button
            className={styles.button}
            variant="primary"
            disabled={!selectedMembers.length}
            onClick={onInvite}
          >
            {t['com.affine.share-menu.invite-editor.invite']()}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Result = ({ result }: { result?: GrantedUser[] }) => {
  const shareMenuService = useService(ShareMenuService);
  const t = useI18n();
  if (!result || result.length === 0) {
    return (
      <div className={styles.noFound}>
        {t['com.affine.share-menu.invite-editor.no-found']()}
      </div>
    );
  }

  return (
    <Scrollable.Root>
      <Scrollable.Viewport className={styles.result}>
        {result.map(grantedUser => {
          const handleSelect = () => {
            shareMenuService.addToSelectedMembers(grantedUser);
          };
          return (
            <div onClick={handleSelect} key={grantedUser.user.id}>
              <MemberItem grantedUser={grantedUser} />
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
  const shareMenuService = useService(ShareMenuService);
  const inviteDocRoleType = useLiveData(shareMenuService.inviteDocRoleType$);
  const onRoleChange = useCallback(
    (role: DocRole) => {
      shareMenuService.setInviteDocRoleType(role);
    },
    [shareMenuService]
  );
  const currentRoleName = useMemo(
    () => getRoleName(inviteDocRoleType, t),
    [inviteDocRoleType, t]
  );

  const changeToAdmin = useCallback(
    () => onRoleChange(DocRole.Manager),
    [onRoleChange]
  );
  const changeToWrite = useCallback(() => {
    if (hittingPaywall) {
      openPaywallModal();
      return;
    }
    onRoleChange(DocRole.Editor);
  }, [hittingPaywall, onRoleChange, openPaywallModal]);
  const changeToRead = useCallback(() => {
    if (hittingPaywall) {
      openPaywallModal();
      return;
    }
    onRoleChange(DocRole.Reader);
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
              selected={inviteDocRoleType === DocRole.Manager}
            >
              {t['com.affine.share-menu.option.permission.can-manage']()}
            </MenuItem>
            <MenuItem
              onSelect={changeToWrite}
              selected={inviteDocRoleType === DocRole.Editor}
            >
              <div className={styles.planTagContainer}>
                {t['com.affine.share-menu.option.permission.can-edit']()}
                <PlanTag />
              </div>
            </MenuItem>
            <MenuItem
              onSelect={changeToRead}
              selected={inviteDocRoleType === DocRole.Reader}
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

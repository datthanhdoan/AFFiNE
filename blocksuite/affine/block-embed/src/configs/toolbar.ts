import { EmbedGithubBlockSchema } from '@blocksuite/affine-model';
import {
  ActionPlacement,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
} from '@blocksuite/affine-shared/services';
import { BlockSelection } from '@blocksuite/block-std';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  PaletteIcon,
  ResetIcon,
} from '@blocksuite/icons/lit';

// External embed blocks
export const builtinToolbarConfigForExternal = {
  actions: [
    {
      id: 'conversions',
      actions: [
        {
          id: 'inline-view',
          label: 'Inline view',
          run(_cx) {},
        },
        {
          id: 'card-view',
          label: 'Card view',
          run(_cx) {},
        },
        {
          id: 'embed-view',
          label: 'Embed view',
          run(_cx) {},
          when(_cx) {
            return false;
          },
        },
      ],
      content(_cx) {
        this.actions;
        return null;
      },
    } satisfies ToolbarActionGroup,
    {
      id: 'style',
      tooltip: 'Card style',
      icon: PaletteIcon(),
      when(cx) {
        const model = cx.getFirstBlockModelBy(
          BlockSelection,
          EmbedGithubBlockSchema
        );
        return Boolean(model);
      },
      run(_cx) {},
    },
    {
      id: 'caption',
      tooltip: 'Caption',
      icon: CaptionIcon(),
      run(_cx) {},
    },
    {
      id: 'clipboard',
      placement: ActionPlacement.More,
      actions: [
        {
          id: 'copy',
          label: 'Copy',
          icon: CopyIcon(),
          run(_cx) {},
        },
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: DuplicateIcon(),
          run(_cx) {},
        },
      ],
    },
    {
      id: 'reload',
      placement: ActionPlacement.More,
      label: 'Reload',
      icon: ResetIcon(),
      run(_cx) {},
    },
    {
      id: 'delete',
      placement: ActionPlacement.More,
      label: 'Delete',
      icon: DeleteIcon(),
      run(_cx) {},
    },
  ],
} as const satisfies ToolbarModuleConfig;

// Internal embed blocks
export const builtinToolbarConfigForInternal = {
  actions: [
    {
      id: 'conversions',
      actions: [
        {
          id: 'inline-view',
          label: 'Inline view',
          run(_cx) {},
        },
        {
          id: 'card-view',
          label: 'Card view',
          run(_cx) {},
        },
        {
          id: 'embed-view',
          label: 'Embed view',
          run(_cx) {},
          when(_cx) {
            return false;
          },
        },
      ],
      content(_cx) {
        this.actions;
        return null;
      },
    } satisfies ToolbarActionGroup,
    {
      id: 'style',
      tooltip: 'Card style',
      icon: PaletteIcon(),
      run(_cx) {},
      // linked doc: true, synced doc: false
      when(_cx) {
        return false;
      },
    },
    {
      id: 'caption',
      tooltip: 'Caption',
      icon: CaptionIcon(),
      run(_cx) {},
    },
    {
      id: 'clipboard',
      placement: ActionPlacement.More,
      actions: [
        {
          id: 'copy',
          label: 'Copy',
          icon: CopyIcon(),
          run(_cx) {},
        },
        {
          id: 'duplicate',
          label: 'Duplicate',
          icon: DuplicateIcon(),
          run(_cx) {},
        },
      ],
    },
    {
      id: 'delete',
      placement: ActionPlacement.More,
      actions: [
        {
          id: 'delete',
          label: 'Delete',
          icon: DeleteIcon(),
          run(_cx) {},
        },
      ],
    },
  ],
} as const satisfies ToolbarModuleConfig;

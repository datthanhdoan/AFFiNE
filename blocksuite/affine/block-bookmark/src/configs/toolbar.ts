import { BookmarkBlockSchema } from '@blocksuite/affine-model';
import {
  ActionPlacement,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
} from '@blocksuite/affine-shared/services';
import { getHostName } from '@blocksuite/affine-shared/utils';
import { BlockSelection } from '@blocksuite/block-std';
import {
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  PaletteIcon,
  ResetIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

export const builtinToolbarConfig = {
  actions: [
    {
      id: 'preview',
      content(cx) {
        const model = cx.getFirstBlockModelBy(
          BlockSelection,
          BookmarkBlockSchema
        );
        if (!model) return null;

        const { url } = model;

        return html`
          <a
            class="affine-link-preview"
            rel="noopener noreferrer"
            target="_blank"
            href=${url}
          >
            <span>${getHostName(url)}</span>
          </a>
        `;
      },
    },
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
      id: 'refresh',
      placement: ActionPlacement.More,
      actions: [
        {
          id: 'reload',
          label: 'Reload',
          icon: ResetIcon(),
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

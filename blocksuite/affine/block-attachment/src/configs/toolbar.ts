import {
  type AttachmentBlockModel,
  AttachmentBlockSchema,
  defaultAttachmentProps,
} from '@blocksuite/affine-model';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import {
  ActionPlacement,
  type ToolbarAction,
  type ToolbarActionGroup,
  type ToolbarModuleConfig,
} from '@blocksuite/affine-shared/services';
import { BlockSelection } from '@blocksuite/block-std';
import { Bound } from '@blocksuite/global/utils';
import {
  ArrowDownSmallIcon,
  CaptionIcon,
  CopyIcon,
  DeleteIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
  ResetIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { AttachmentEmbedProvider } from '../embed';

export const builtinToolbarConfig = {
  actions: [
    {
      id: 'rename',
      tooltip: 'Rename',
      icon: EditIcon(),
      run(_cx) {},
    },
    {
      id: 'conversions',
      actions: [
        {
          id: 'card-view',
          label: 'Card view',
          run(cx) {
            const model = cx.getFirstBlockModelBy(
              BlockSelection,
              AttachmentBlockSchema
            );
            if (!model) return;

            const style = defaultAttachmentProps.style!;
            const width = EMBED_CARD_WIDTH[style];
            const height = EMBED_CARD_HEIGHT[style];
            const bound = Bound.deserialize(model.xywh);
            bound.w = width;
            bound.h = height;

            cx.store.updateBlock(model, {
              style,
              embed: false,
              xywh: bound.serialize(),
            });
          },
        },
        {
          id: 'embed-view',
          label: 'Embed view',
          run(cx) {
            const model = cx.getFirstBlockModelBy(
              BlockSelection,
              AttachmentBlockSchema
            );
            if (!model) return;

            cx.std
              .get(AttachmentEmbedProvider)
              .convertTo(model as AttachmentBlockModel);
          },
        },
      ],
      content(cx) {
        const model = cx.getFirstBlockModelBy(
          BlockSelection,
          AttachmentBlockSchema
        );
        if (!model) return null;

        const { embed = true } = model;
        const viewType = embed ? 'embed' : 'card';
        const embeded = cx.std
          .get(AttachmentEmbedProvider)
          .embedded(model as AttachmentBlockModel);

        return html`
          <editor-menu-button
            .contentPadding="${'8px'}"
            .button=${html`
              <editor-icon-button
                aria-label="Switch view"
                .justify="${'space-between'}"
                .labelHeight="${'20px'}"
                .iconContainerWidth="${'110px'}"
              >
                <span
                  class="label"
                  style=${styleMap({ textTransform: 'capitalize' })}
                  >${viewType} view</span
                >
                ${ArrowDownSmallIcon()}
              </editor-icon-button>
            `}
          >
            <div data-size="small" data-orientation="vertical">
              ${repeat(
                this.actions,
                action => action.id,
                ({ id, label, run }) => html`
                  <editor-menu-action
                    aria-label=${label}
                    data-testid=${`link-to-${id}`}
                    ?data-selected=${id.startsWith(viewType)}
                    ?disabled="${id.startsWith('card')
                      ? !embed
                      : embed && !embeded}"
                    @click=${() => run?.(cx)}
                  >
                    ${label}
                  </editor-menu-action>
                `
              )}
            </div>
          </editor-menu-button>
        `;
      },
    } satisfies ToolbarActionGroup<ToolbarAction>,
    {
      id: 'download',
      tooltip: 'Download',
      icon: DownloadIcon(),
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

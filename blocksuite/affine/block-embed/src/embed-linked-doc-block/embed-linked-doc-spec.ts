import { EmbedLinkedDocBlockSchema } from '@blocksuite/affine-model';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import {
  BlockServiceIdentifier,
  BlockViewExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { builtinToolbarConfigForInternal } from '../configs/toolbar';
import { EmbedLinkedDocBlockAdapterExtensions } from './adapters/extension';

const flavour = EmbedLinkedDocBlockSchema.model.flavour as BlockSuite.Flavour;

export const EmbedLinkedDocBlockSpec: ExtensionType[] = [
  BlockViewExtension(flavour, model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-embed-edgeless-linked-doc-block`
      : literal`affine-embed-linked-doc-block`;
  }),
  EmbedLinkedDocBlockAdapterExtensions,
  ToolbarModuleExtension({
    id: BlockServiceIdentifier(flavour),
    config: builtinToolbarConfigForInternal,
  }),
].flat();

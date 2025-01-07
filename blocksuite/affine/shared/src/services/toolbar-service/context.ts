import { BlockSelection, type BlockStdScope } from '@blocksuite/block-std';
import type {
  Block,
  PropsGetter,
  SchemaToModel,
  SelectionConstructor,
} from '@blocksuite/store';

import { DocModeProvider } from '../doc-mode-service';

abstract class ToolbarContextBase {
  constructor(readonly std: BlockStdScope) {}

  get command() {
    return this.std.command;
  }

  get chain() {
    return this.command.chain();
  }

  get doc() {
    return this.store.doc;
  }

  get host() {
    return this.std.host;
  }

  get selection() {
    return this.std.selection;
  }

  get store() {
    return this.std.store;
  }

  get readonly() {
    return this.store.readonly;
  }

  get docModeProvider() {
    return this.std.get(DocModeProvider);
  }

  get editorMode() {
    return this.docModeProvider.getEditorMode() ?? 'page';
  }

  get isPageMode() {
    return this.editorMode === 'page';
  }

  get isEdgelessMode() {
    return this.editorMode === 'edgeless';
  }

  getFirstBlockBy<T extends SelectionConstructor>(type: T): Block | null {
    const selection = this.selection.find(type ?? BlockSelection);
    return (selection && this.store.getBlock(selection.blockId)) ?? null;
  }

  getFirstBlockModelBy<
    T extends SelectionConstructor,
    S extends {
      model: {
        props: PropsGetter<object>;
        flavour: string;
      };
    },
  >(type: T, schema: S) {
    const block = this.getFirstBlockBy<T>(type);
    return block?.model.flavour === schema.model.flavour
      ? (block.model as SchemaToModel<S>)
      : null;
  }
}

export class ToolbarContext extends ToolbarContextBase {}

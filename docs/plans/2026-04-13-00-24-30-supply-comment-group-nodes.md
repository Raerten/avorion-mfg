# Supply page: comment/group nodes

## Overview

Add a special "comment" node type to the supply chain builder. These nodes render below factory nodes (lower z-index), are resizable, and contain user-editable text. They serve as visual grouping areas and annotation labels on the canvas.

## Context

- Files involved: `app/pages/supply.vue`, `app/composables/useSupplyChain.ts`, `app/components/supply/CommentNode.vue` (new), `app/components/supply/SupplyToolbar.vue`
- Related patterns: existing `FactoryNode.vue` custom node, Vue Flow node type registration via `#node-<type>` template slots
- Dependencies: Vue Flow supports `zIndex` on nodes natively; no new packages needed

## Development Approach

- No tests in this project (no Vitest yet) -- skip test steps
- Code first approach, verify visually via dev server

## Implementation Steps

### Task 1: Extend data model for comment nodes

**Files:**
- Modify: `app/composables/useSupplyChain.ts`

- [x] Add `CommentNodeData` interface with `text: string`, `width: number`, `height: number`, `color?: string`
- [x] Add `CommentFlowNode` type alias (`Node<CommentNodeData>`)
- [x] Update `Persisted` interface: nodes array should accept both factory and comment node types
- [x] Ensure `saveSupplyChain` / `loadSupplyChain` handle comment nodes without breaking existing saves

### Task 2: Create CommentNode component

**Files:**
- Create: `app/components/supply/CommentNode.vue`

- [ ] Build a resizable container div with a `<textarea>` or `contenteditable` element for text input
- [ ] Style with semi-transparent background, dashed/subtle border, muted colors -- visually distinct from factory nodes
- [ ] Support resizing via drag handle in bottom-right corner (CSS `resize` or manual drag)
- [ ] Use `updateNode` from Vue Flow to persist text/size changes back to node data
- [ ] Use `NodeResizer` from `@vue-flow/node-resizer` package for proper resize handling (install if needed)
- [ ] Optional color selector (3-4 preset muted colors) -- keep simple, just a few clickable dots in corner

### Task 3: Register comment node type in supply page

**Files:**
- Modify: `app/pages/supply.vue`

- [ ] Import CommentNode component
- [ ] Add `#node-comment` template slot in VueFlow, rendering CommentNode
- [ ] Add `addCommentAt()` function similar to `addFactoryAt()` -- creates a comment node with `type: 'comment'`, `zIndex: -1`, default size 300x200
- [ ] Support drag-and-drop or double-click on empty canvas to create comment nodes
- [ ] Add CSS for `.vue-flow__node` comment type if needed (no connection handles, transparent background)

### Task 4: Add UI to create comment nodes

**Files:**
- Modify: `app/components/supply/SupplyToolbar.vue`

- [ ] Add a "Добавить заметку" button to the toolbar
- [ ] Emit event to supply.vue which creates a comment node at center of current viewport
- [ ] Style button consistently with existing toolbar actions

### Task 5: MiniMap and selection integration

**Files:**
- Modify: `app/pages/supply.vue`

- [ ] Update `miniMapNodeColor` to return a distinct muted color for comment nodes
- [ ] Ensure comment nodes work with existing multi-selection (shift+drag, shift+click)
- [ ] Ensure Delete key removes selected comment nodes
- [ ] Verify comment node data persists correctly to localStorage across page reloads

### Task 6: Visual verification

- [ ] Run dev server, create comment nodes, verify they render behind factory nodes
- [ ] Test text editing, resizing, color selection
- [ ] Test persistence: reload page, verify comment nodes restore correctly
- [ ] Test with shared canvas URL export/import

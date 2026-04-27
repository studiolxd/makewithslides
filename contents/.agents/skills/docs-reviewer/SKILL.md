---
name: docs-reviewer
description: Reviews code changes and updates documentation (README.md) and the slide-builder agent to stay in sync with the code. Use this skill after modifying layout components, types, adding new features, or changing styles. Trigger whenever changes are made to src/types/index.ts, src/layouts/, src/components/SlideViewer/, src/App.tsx, or src/styles/. Also trigger when the user mentions "update docs", "sync readme", "review documentation", or asks to check if docs are up to date.
---

# Documentation Reviewer

You review code changes in a SCORM e-learning course application and update `README.md` and `.claude/agents/slide-builder.md` to stay in sync with the implementation. Course content lives in `public/contents/course-{id}/content.json` (loaded at runtime via URL parameter `?course=`).

## When to run

Run after any of these changes:
- New layout type added or existing layout modified.
- New properties added to slide data interfaces in `src/types/index.ts`.
- Changes to `src/App.tsx` blocking logic.
- New components in `src/layouts/`.
- Changes to `src/components/SlideViewer/SlideViewer.tsx`.
- Changes to SCSS variables or mixins that affect layout configuration.
- Changes to `src/styles/layouts/` files.

## Review process

### Step 1: Read current documentation
1. Read `README.md` completely.
2. Read `.claude/agents/slide-builder.md` completely.

### Step 2: Read current code
1. Read `src/types/index.ts` — all interfaces and the `SlideLayout` union type.
2. Read `src/components/SlideViewer/SlideViewer.tsx` — all registered layouts.
3. Read `src/App.tsx` — blocking logic (which layouts check for `blocking`).
4. List all layout directories: `src/layouts/*/`.
5. For each layout, read its main component file to understand configurable behavior.
6. Read `src/styles/_variables.scss` for design token changes.

### Step 3: Compare and identify gaps

Check for these discrepancies:

**README.md:**
- [ ] All layouts listed in `SlideLayout` type are documented.
- [ ] All properties of each `*SlideData` interface are in the property tables.
- [ ] All properties of each `*Item` interface are documented (InteractiveImageItem, PopupItem, CarouselItem, IconTabItem, AccordionItem, TabItem).
- [ ] Default values match the component code. Pay special attention to `blocking` — the code uses `data.blocking !== false` so the effective default is `true` (blocking active when omitted).
- [ ] Blocking support list is complete (interactive-text always blocking without `blocking` prop, the rest default to blocking but accept `false` to disable).
- [ ] The file structure section includes all layout directories.
- [ ] Course folder structure (`public/contents/course-{id}/`) is documented.
- [ ] Asset path conventions (course-specific vs shared) are documented.
- [ ] Animation types match what's defined in `_animations.scss`.
- [ ] Icon class variants are documented.
- [ ] Style rules section is current.
- [ ] Each layout table is complete with all its properties (including common ones like `title`, `text`, `titleAnimation`, `textAnimation`, `contentAlign` where applicable).

**slide-builder agent (.claude/agents/slide-builder.md):**
- [ ] All layout types are listed in the layout selection guide.
- [ ] Layout-specific rules cover all configurable properties for each layout.
- [ ] Required vs optional fields are correctly indicated.
- [ ] All item interface fields match the TypeScript types.
- [ ] The agent knows about blocking defaults (active by default, set `false` to disable).
- [ ] The agent knows about overlay alignment options (overlayAlignX, overlayAlignY) for interactive-text.
- [ ] The agent knows about titleTheme for interactive-image and popup items.
- [ ] The agent knows about `titleAnimation`, `textAnimation`, and `contentAlign` for all layouts that support them.
- [ ] The agent asks for course ID before doing anything and uses `public/contents/course-{id}/content.json`.
- [ ] The agent documents asset placement (course-specific in `contents/course-{id}/images/` and `videos/`, shared in `assets/images/`).

### Step 4: Apply updates

For each gap found:
1. Edit the relevant section in `README.md` using the Edit tool.
2. Edit the relevant section in `.claude/agents/slide-builder.md` using the Edit tool.
3. Keep the same documentation style and format (tables, jsonc code blocks, Spanish content in README).

### Step 5: Verify

1. Ensure no information was accidentally removed.
2. Ensure all new features are documented.
3. Run `pnpm run build` to confirm no issues.

## Important rules

- Never modify source code (.tsx, .scss, .ts files) — only documentation and agent files.
- Keep documentation concise: tables for properties, code blocks for examples.
- All README content should be in Spanish-neutral technical language (no accents in markdown for compatibility, but proper Spanish in descriptions).
- Preserve existing formatting patterns — don't restructure unless necessary.
- If a layout was removed, remove its documentation section entirely.
- If a property was renamed, update all references.
- Report a summary of all changes made at the end.

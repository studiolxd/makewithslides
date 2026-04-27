# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SCORM e-learning course builder built with React 19 + TypeScript + Vite. Each course is defined in a `content.json` file inside `public/contents/course-{id}/` that describes the index, config, and slides. The course ID is passed via URL parameter (`?course=bloque-1`), and the app fetches the corresponding JSON at runtime. An optional `slide=` parameter (`?course=bloque-1&slide=3`) navigates directly to a specific slide. The URL is updated via `history.replaceState` as the user navigates. The app renders a slide-based course player with sidebar navigation, SCORM progress tracking, and multiple interactive layout types.

## Commands

- `pnpm run dev` — Start dev server
- `pnpm run build` — TypeScript check + Vite production build (output to `dist/`)
- `pnpm run lint` — ESLint
- `pnpm run preview` — Preview production build
- `pnpm validate:content` — Validate all courses: Zod schema + asset file existence
- `pnpm validate:content --course bloque-1` — Validate one course
- `pnpm validate:content --schema-only` — Skip asset existence check
- `pnpm build:scorm` — Build Vite + package all courses as SCORM ZIPs (output to `dist-scorm/`)
- `pnpm build:scorm -- --course bloque-1` — Package one course only
- `pnpm build:scorm -- --skip-build` — Skip Vite build, reuse existing `dist/`
- `pnpm optimize:images` — Optimize all course images + shared assets in-place (resize to max-width, re-encode JPEG with mozjpeg / PNG with max compression, overwrite only if smaller). Uses `sharp`.
- `pnpm optimize:images -- --course bloque-1` — Optimize one course only
- `pnpm optimize:images -- --max-width 1600` — Override max width (default `1920`, min `100`)
- `pnpm optimize:images -- --quality 75` — Override JPEG quality (default `82`, range 1–100)
- `pnpm optimize:images -- --dry-run` — Report savings without writing

## Architecture

**Data-driven rendering**: Each course lives in `public/contents/course-{id}/content.json` and is loaded at runtime via `fetch` based on the URL parameter `?course=`. The JSON contains `config`, `index` (sidebar navigation entries), and `slides` (array of slide objects with `layout` + `data`). `main.tsx` reads the `course` param, fetches the JSON, then renders `ScormProvider` + `App` with the content as a prop. An optional `slide=` URL param sets the initial slide (overrides SCORM resume).

**Layout system**: `SlideViewer` (`src/components/SlideViewer/SlideViewer.tsx`) reads `slide.layout` and delegates to the corresponding layout component under `src/layouts/`. Each layout folder contains a `.tsx` component and its `.scss` file. Available layouts: `cover`, `section-cover`, `image-text`, `interactive-text`, `interactive-image`, `popup`, `carousel`, `icon-tabs`, `accordion`, `tabs`, `closing`. To add a new layout: (1) add the name to `SlideLayout` union and create a data interface in `src/types/index.ts`, (2) add it to the `SlideData` discriminated union, (3) create the component + scss under `src/layouts/`, (4) add a case in `SlideViewer`'s switch statement.

**Blocking/interaction system**: Interactive layouts (`interactive-text`, `interactive-image`, `popup`, `carousel`, `icon-tabs`, `accordion`, `tabs`) block navigation until all items are interacted with. `App.tsx` precomputes required interaction counts per slide. Layouts register their required count via `SlideInteractionContext` and call `markCompleted` per item. The Navigation component disables "Next" while blocked. `interactive-text` blocking is hardcoded in `App.tsx` (it has no `blocking` property in JSON); all other interactive layouts read their `blocking` field from the slide data.

**SCORM integration**: `main.tsx` fetches the course JSON, then wraps the app in `ScormProvider` from `@studiolxd/react-scorm`. The `useScormProgress` hook manages state (current slide, visited slides, completed interactions, sidebar state) and persists it via SCORM `suspend_data` and `location`. Progress percentage = visited slides / total slides. `suspend_data` serializes `{ visitedSlides: number[], completedInteractions: Record<number, string[]>, sidebarCollapsed: boolean }`.

**Schema & types**: `src/schemas/content.schema.ts` is the single source of truth — all Zod schemas live there. `src/types/index.ts` re-exports types derived from those schemas via `z.infer<>`. Do not add types manually to `index.ts`; add the schema first, then derive.

**Styles**: SCSS with variables in `src/styles/_variables.scss`. Layout-specific styles live in `src/styles/layouts/`. Fonts: Nunito (body) and Montserrat (headings). Primary color: `#1e979f`. Slide backgrounds are always `#FFF`.

## Course Structure

Each course has its own folder under `public/contents/`:

```
public/contents/course-{id}/
  content.json          ← course definition (config, index, slides)
  images/               ← course-specific images
  videos/               ← course-specific videos
```

- **Course ID**: passed via URL parameter `?course=bloque-1` → loads `./contents/course-bloque-1/content.json`
- **Direct slide access**: `?course=bloque-1&slide=3` → loads the course and navigates to slide ID 3
- **Course-specific assets**: stored in `contents/course-{id}/images/` or `contents/course-{id}/videos/`. Referenced in JSON as `./contents/course-{id}/images/photo.jpg`
- **Shared assets**: common images like `bg_carousel.jpg` and `icon_closing.png` stay in `public/assets/images/`. Referenced as `./assets/images/bg_carousel.jpg`

## Agents

**slide-builder** (`.claude/agents/slide-builder.md`): Creates and edits slides in an existing course. Modifies `content.json` and course assets. Runs a mandatory `pnpm validate:content --course <id>` loop after every write and fixes all errors before reporting success. Cannot touch source code.

**course-creator** (`.claude/agents/course-creator.md`): Bootstraps a new course from scratch. Asks for title, course ID, SCORM metadata, and config; creates `public/contents/course-{id}/` with folder structure and a base `content.json` (cover + closing slides). Validates before reporting success. Use this before slide-builder when starting a new course.

## Guardrails — Content vs Code Separation

When working on **slide content tasks** (creating/editing slides, modifying `content.json`, adjusting course structure):

1. **Only modify files inside `public/contents/course-{id}/`** — never touch `src/`, config files, or project root files.
2. **Always delegate content tasks to the `slide-builder` agent** — do not edit `content.json` directly from the main context.
3. **If a content task seems to require a code change**, stop and confirm with the user before touching any source file. The issue is likely a JSON configuration problem, not a code bug.
4. **Never mix content edits and code edits in the same operation** — handle them as separate, explicit steps.

## Key Conventions

- UI language is Spanish
- Icons use Flaticon UIcons (prefixes: `fi fi-br-`, `fi fi-tr-`, `fi fi-rr-`)
- Slide IDs are unique integers; item IDs are unique strings within each slide
- HTML content in JSON uses `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>` tags
- Vite `base` is set to `'./'` for relative asset paths (SCORM packaging)
- The `blocking` property defaults to `true` on interactive layouts; must be explicitly set to `false` to disable
- `interactive-text` is always blocking (no `blocking` property)

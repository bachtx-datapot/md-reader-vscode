# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MD Reader is a Chrome/Firefox/Edge browser extension (Manifest V3) that renders Markdown files in the browser. It supports `.md`, `.mdx`, `.mkd`, and `.markdown` files from `file://`, `http://`, and `https://` URLs. Uses pnpm as package manager.

## Build & Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev build with watch mode and extension hot-reload
pnpm build            # Full production build (manifest → webpack → zip)
pnpm lint             # Format with prettier
```

Individual build steps: `pnpm build:manifest`, `pnpm build:extension`, `pnpm build:zip`.

Output goes to `extension/` (loadable in browser). Production zip goes to `dist/`.

## Architecture

**Three webpack entry points** compiled from TypeScript:

- **Content script** (`src/main.ts` → `js/content.js`): Detects markdown on pages, renders it with markdown-it + highlight.js, creates sidebar TOC with scroll tracking, handles theme switching, auto-refresh polling, and UI controls.
- **Background service worker** (`src/background.ts` → `js/background.js`): Message routing, Chrome storage sync, keyboard command handling, file fetching for auto-refresh.
- **Popup** (`src/popup/index.ts` → `js/popup.js`): Settings UI built with Svelte 3 + SMUI (Material UI) components. Controls: enable/disable, centered layout, auto-refresh, plugin selection, theme, language.

**Key modules in `src/core/`:**

- `ele.ts` — Chainable DOM element wrapper (supports HTML, SVG, DocumentFragment)
- `event.ts` — Event emitter for plugin/page communication
- `storage.ts` — Typed generic wrapper around Chrome storage API
- `markdown.ts` — Markdown rendering engine with 13+ markdown-it plugins, frontmatter removal, syntax highlighting, Mermaid/KaTeX support
- `plugin.ts` — Plugin registration system (`usePlugin`/`initPlugins`)

**Extension plugins** (`src/plugins/`): block-copy (code copy button), img-viewer (image zoom), alert (blockquote containers).

**Communication pattern**: Content script ↔ Background service worker via Chrome message passing. Settings stored in Chrome storage, changes propagated to all tabs.

## Code Style

- Prettier: no semicolons, single quotes, trailing commas, 2-space indent, no parens on single arrow params
- Pre-commit hook runs lint-staged (prettier) via husky
- TypeScript with `@/*` path alias mapping to `./src/*`
- Svelte components use svelte-preprocess for TypeScript

## Localization

7 locales in `src/_locales/`: en (+ en_US, en_GB), zh_CN, zh_TW, ko, uk. Uses Chrome i18n format (`messages.json`). App-level i18n in `src/config/i18n/`.

## Styling

LESS preprocessor. Global styles in `src/style/` (variables in `variable.less`). Theme package: `@md-reader/theme`.

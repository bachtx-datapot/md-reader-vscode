# MD Reader - Markdown Preview for VSCode

A beautiful markdown preview extension for VSCode that renders markdown files in the browser with live reload.

## Features

- **Browser Preview**: Open markdown files in your default browser with full rendering
- **Multiple Preview Modes**: Browser, editor tab, or side panel
- **Live Reload**: Automatically refreshes preview when you edit the file
- **Rich Syntax Support**: Emoji, KaTeX math, Mermaid diagrams, task lists, footnotes, alerts, and more
- **Themes**: Light, dark, GitHub, WeChat, and profile themes with auto-detection
- **Sidebar TOC**: Auto-generated table of contents with scroll tracking
- **Code Highlighting**: Syntax highlighting powered by highlight.js
- **Image Viewer**: Click-to-zoom image viewing

## Usage

1. Open any `.md` file in VSCode
2. Click the preview icon in the editor title bar, or run `MD Reader: Preview` from the command palette (`Ctrl+Shift+P`)
3. Choose your preferred preview mode:
   - **Browser** (default): Opens in your default browser
   - **Tab**: Opens in a VSCode editor tab
   - **Side Panel**: Opens in a side panel

## Commands

| Command                                  | Description                     |
| ---------------------------------------- | ------------------------------- |
| `MD Reader: Preview`                     | Preview with default mode       |
| `MD Reader: Preview in Browser`          | Open preview in browser         |
| `MD Reader: Preview in Tab`              | Open preview in editor tab      |
| `MD Reader: Preview in Side Panel`       | Open preview in side panel      |
| `MD Reader: Change Default Preview Mode` | Change the default preview mode |
| `MD Reader: Settings`                    | Open settings panel             |

## Settings

| Setting                 | Default     | Description                             |
| ----------------------- | ----------- | --------------------------------------- |
| `md-reader.previewMode` | `browser`   | Default preview mode (browser/tab/side) |
| `md-reader.theme`       | `auto`      | Preview theme                           |
| `md-reader.centered`    | `true`      | Centered layout for content             |
| `md-reader.plugins`     | all enabled | Enabled markdown-it plugins             |
| `md-reader.port`        | `0` (auto)  | HTTP server port                        |

## Supported Markdown Plugins

Emoji, Superscript, Subscript, Table of Contents, Insert, Mark, KaTeX (math), Mermaid (diagrams), Abbreviation, Definition List, Footnote, Task Lists, Alert (callouts)

## License

[MIT](LICENSE) - Based on [MD Reader](https://github.com/md-reader/md-reader) by [Bener](https://github.com/Heroor)

import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { mdRender } from '@/core/markdown'
import { toTheme, type Theme } from '@/shared'
import type { MdReaderConfig, ThemeOption } from '@/types'

/** Resolve theme, handling "follow-vscode" by reading VSCode's active theme */
function resolveConfigTheme(theme: ThemeOption): Exclude<Theme, 'auto'> {
  if (theme === 'follow-vscode') {
    const kind = vscode.window.activeColorTheme.kind
    return kind === vscode.ColorThemeKind.Dark ||
      kind === vscode.ColorThemeKind.HighContrastDark
      ? 'dark'
      : 'light'
  }
  return toTheme(theme as Theme)
}

let templateCache: string = null

function loadTemplate(extensionPath: string): string {
  if (!templateCache) {
    const templatePath = path.join(
      extensionPath,
      'extension',
      'template',
      'preview.html',
    )
    templateCache = fs.readFileSync(templatePath, 'utf-8')
  }
  return templateCache
}

interface TocEntry {
  level: number
  id: string
  text: string
  children: TocEntry[]
}

function buildTocTree(html: string): TocEntry[] {
  const headingRegex = /<(h[1-6])[^>]*id="([^"]*)"[^>]*>.*?<\/\1>/gi
  const flat: { level: number; id: string; text: string }[] = []
  let match: RegExpExecArray
  while ((match = headingRegex.exec(html)) !== null) {
    flat.push({
      level: parseInt(match[1][1]),
      id: match[2],
      text: match[0].replace(/<[^>]+>/g, '').trim(),
    })
  }

  // Build nested tree: group children under parent headings
  const root: TocEntry[] = []
  const stack: TocEntry[] = []
  for (const item of flat) {
    const entry: TocEntry = { ...item, children: [] }
    // Pop stack until we find a parent with smaller level
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop()
    }
    if (stack.length === 0) {
      root.push(entry)
    } else {
      stack[stack.length - 1].children.push(entry)
    }
    stack.push(entry)
  }
  return root
}

// Chevron SVG used as expand/collapse toggle (matches original extension)
const chevronSvg =
  '<svg viewBox="0 0 24 24" width="1.2em" height="1.2em"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0z"></path><path fill="currentColor" d="M15.707 11.293a1 1 0 0 1 0 1.414l-5.657 5.657a1 1 0 1 1-1.414-1.414l4.95-4.95l-4.95-4.95a1 1 0 0 1 1.414-1.414z"></path></g></svg>'

function renderTocEntries(entries: TocEntry[], counter: { i: number }): string {
  return entries
    .map(e => {
      const hasChildren = e.children.length > 0
      const leafClass = hasChildren ? '' : ' leaf'
      const toggle = hasChildren
        ? `<span class="tree-node-toggle-icon rotate-90">${chevronSvg}</span>`
        : ''
      const id = counter.i++
      const link =
        `<a class="tree-node-item" data-tree-node-id="${id}" href="#${e.id}">` +
        `${toggle}<span class="tree-node-content">${e.text}</span></a>`
      const childHtml = hasChildren
        ? `<ul class="m0 list-none p0">${renderTocEntries(
            e.children,
            counter,
          )}</ul>`
        : ''
      return `<li class="expandable${leafClass} level-${e.level}">${link}${childHtml}</li>`
    })
    .join('\n')
}

export function generateToc(html: string): string {
  const tree = buildTocTree(html)
  return renderTocEntries(tree, { i: 0 })
}

function rewriteAssetPaths(html: string, fileUri: vscode.Uri): string {
  const dir = path.dirname(fileUri.fsPath)
  // Rewrite relative src/href to /file/ proxy path
  return html.replace(
    /(src|href)="(?!https?:\/\/|data:|#|\/)(.*?)"/g,
    (_, attr, relPath) => {
      const absPath = path.resolve(dir, relPath)
      return `${attr}="/file/${encodeURIComponent(absPath)}"`
    },
  )
}

export async function renderMarkdown(
  fileUri: vscode.Uri,
  config: MdReaderConfig,
): Promise<{ html: string; tocHtml: string }> {
  const content = await vscode.workspace.fs.readFile(fileUri)
  const markdown = Buffer.from(content).toString('utf-8')
  const theme = resolveConfigTheme(config.theme)
  const rendered = mdRender(markdown, {
    theme,
    plugins: config.plugins,
  })
  const rewritten = rewriteAssetPaths(rendered, fileUri)
  const tocHtml = generateToc(rewritten)
  return { html: rewritten, tocHtml }
}

export async function renderPreview(
  fileUri: vscode.Uri,
  config: MdReaderConfig,
  extensionPath: string,
  serverPort: number,
): Promise<string> {
  const { html, tocHtml } = await renderMarkdown(fileUri, config)
  const template = loadTemplate(extensionPath)
  const fileName = path.basename(fileUri.fsPath)

  const resolvedTheme = resolveConfigTheme(config.theme)

  return template
    .replace('{{title}}', fileName)
    .replace('{{content}}', html)
    .replace('{{toc}}', tocHtml)
    .replace('{{theme}}', resolvedTheme)
    .replace('{{centered}}', config.centered ? 'centered' : '')
    .replace(
      '{{config}}',
      JSON.stringify({
        serverPort,
        fileUri: fileUri.toString(),
        theme: resolvedTheme,
        themeOption: config.theme,
        centered: config.centered,
        plugins: config.plugins,
        previewMode: config.previewMode,
        wsUrl: `ws://127.0.0.1:${serverPort}/ws?file=${encodeURIComponent(
          fileUri.toString(),
        )}`,
      }),
    )
}

export function clearTemplateCache() {
  templateCache = null
}

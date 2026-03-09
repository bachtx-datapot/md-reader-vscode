import * as vscode from 'vscode'
import { PreviewServer } from '@/server/http-server'
import { renderMarkdown } from '@/renderer'
import { PreviewManager } from '@/preview-manager'
import { getConfig } from '@/config-manager'
import { createFileWatcher } from '@/file-watcher'
import { openSettingsPanel } from '@/settings-panel'

let server: PreviewServer | null = null
let previewManager: PreviewManager

/** Resolve "follow-vscode" to light/dark based on VSCode's active color theme */
function resolveTheme(theme: string): string {
  if (theme === 'follow-vscode') {
    const kind = vscode.window.activeColorTheme.kind
    return kind === vscode.ColorThemeKind.Dark ||
      kind === vscode.ColorThemeKind.HighContrastDark
      ? 'dark'
      : 'light'
  }
  return theme
}

/** Broadcast current theme config to all connected browser clients */
function broadcastThemeConfig(srv: PreviewServer) {
  const config = getConfig()
  const theme = resolveTheme(config.theme)
  // Broadcast to all files (empty string = all clients)
  srv.wsServer.broadcastConfigAll({ theme, centered: config.centered })
}

async function ensureServer(context: vscode.ExtensionContext): Promise<number> {
  if (server) return server.getPort()

  const config = getConfig()
  server = new PreviewServer(context.extensionPath, getConfig)
  const port = await server.start(config.port)

  // Handle commands from browser preview (e.g. Settings button in VSCode webview)
  server.wsServer.onCommand(cmd => {
    if (cmd === 'settings') {
      vscode.commands.executeCommand('md-reader.settings')
    }
  })

  // Handle setting changes from browser settings modal → sync to VSCode config
  server.wsServer.onSetting(async (key, value) => {
    const cfg = vscode.workspace.getConfiguration('md-reader')
    await cfg.update(key, value, vscode.ConfigurationTarget.Global)
  })

  vscode.window.setStatusBarMessage(`MD Reader: :${port}`, 5000)
  return port
}

export async function activate(context: vscode.ExtensionContext) {
  previewManager = new PreviewManager()

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('md-reader.preview', () =>
      openPreview(context, getConfig().previewMode),
    ),
    vscode.commands.registerCommand('md-reader.previewBrowser', () =>
      openPreview(context, 'browser'),
    ),
    vscode.commands.registerCommand('md-reader.previewSidePanel', () =>
      openPreview(context, 'side'),
    ),
    vscode.commands.registerCommand('md-reader.settings', () =>
      openSettingsPanel(context, getConfig),
    ),
  )

  // File watcher → hot reload via WebSocket
  context.subscriptions.push(
    ...createFileWatcher(async uri => {
      if (!server) return
      try {
        const config = getConfig()
        const { html, tocHtml } = await renderMarkdown(uri, config)
        server.wsServer.broadcastUpdate(uri.toString(), html, tocHtml)
      } catch (err) {
        console.error('Hot reload error:', err)
      }
    }),
  )

  // Config change → re-render all previews
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('md-reader')) {
        previewManager.refreshAll()
        // Push theme change via WebSocket if server is running
        if (server) broadcastThemeConfig(server)
      }
    }),
  )

  // VSCode theme change → push to browser when "follow-vscode" is active
  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      const config = getConfig()
      if (config.theme === 'follow-vscode' && server) {
        broadcastThemeConfig(server)
      }
    }),
  )
}

async function openPreview(context: vscode.ExtensionContext, mode: string) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    vscode.window.showInformationMessage('Open a markdown file first')
    return
  }
  if (editor.document.languageId !== 'markdown') {
    vscode.window.showInformationMessage('Not a markdown file')
    return
  }

  try {
    const port = await ensureServer(context)
    await previewManager.open(editor.document.uri, port, mode)
  } catch (err) {
    vscode.window.showErrorMessage(
      `MD Reader: Failed to start preview - ${err}`,
    )
  }
}

export function deactivate() {
  server?.stop()
  server = null
  previewManager?.disposeAll()
}

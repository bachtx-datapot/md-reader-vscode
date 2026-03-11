import * as vscode from 'vscode'

export class PreviewManager {
  private panels: Map<string, vscode.WebviewPanel> = new Map()

  async open(fileUri: vscode.Uri, port: number, mode: string) {
    const previewUrl = `http://127.0.0.1:${port}/preview?file=${encodeURIComponent(
      fileUri.toString(),
    )}`

    switch (mode) {
      case 'browser':
        await vscode.env.openExternal(vscode.Uri.parse(previewUrl))
        break
      case 'tab':
        this.openWebviewPanel(fileUri, port, vscode.ViewColumn.Active)
        break
      case 'side':
        this.openWebviewPanel(fileUri, port, vscode.ViewColumn.Beside)
        break
      default:
        await vscode.env.openExternal(vscode.Uri.parse(previewUrl))
    }
  }

  private openWebviewPanel(
    fileUri: vscode.Uri,
    port: number,
    column: vscode.ViewColumn,
  ) {
    const key = fileUri.toString()
    const existing = this.panels.get(key)
    if (existing) {
      existing.reveal(column)
      return
    }

    const fileName = fileUri.path.split('/').pop() || 'Preview'
    const panel = vscode.window.createWebviewPanel(
      'mdReaderPreview',
      `MD: ${fileName}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    )

    const previewUrl = `http://127.0.0.1:${port}/preview?file=${encodeURIComponent(
      fileUri.toString(),
    )}`
    panel.webview.html = this.getIframeHtml(previewUrl)

    panel.onDidDispose(() => {
      this.panels.delete(key)
    })

    this.panels.set(key, panel)
  }

  private getIframeHtml(url: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src http://127.0.0.1:*; style-src 'unsafe-inline';">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="${url}"></iframe>
</body>
</html>`
  }

  refreshAll() {
    this.panels.forEach((panel, key) => {
      // Reload iframe by resetting HTML
      const src = this.extractIframeSrc(panel.webview.html)
      if (src) panel.webview.html = this.getIframeHtml(src)
    })
  }

  private extractIframeSrc(html: string): string | null {
    const match = html.match(/src="([^"]+)"/)
    return match?.[1] || null
  }

  disposeAll() {
    this.panels.forEach(panel => panel.dispose())
    this.panels.clear()
  }
}

import * as http from 'http'
import * as path from 'path'
import * as fs from 'fs'
import * as vscode from 'vscode'
import { getMimeType } from './mime-types'
import { PreviewWsServer } from './ws-server'
import { renderPreview } from '@/renderer'
import type { MdReaderConfig } from '@/types'

export class PreviewServer {
  private server: http.Server
  private port = 0
  readonly wsServer = new PreviewWsServer()
  private extensionPath: string
  private getConfig: () => MdReaderConfig

  constructor(extensionPath: string, getConfig: () => MdReaderConfig) {
    this.extensionPath = extensionPath
    this.getConfig = getConfig
  }

  async start(preferredPort: number = 0): Promise<number> {
    this.server = http.createServer(this.handleRequest.bind(this))
    this.wsServer.attach(this.server)

    return new Promise((resolve, reject) => {
      this.server.on('error', reject)
      this.server.listen(preferredPort, '127.0.0.1', () => {
        this.port = (this.server.address() as any).port
        resolve(this.port)
      })
    })
  }

  stop() {
    this.wsServer.dispose()
    this.server?.close()
  }

  getPort(): number {
    return this.port
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${this.port}`)

      if (url.pathname === '/preview') {
        return await this.handlePreview(url, res)
      }
      if (url.pathname.startsWith('/static/')) {
        return this.handleStatic(url, res)
      }
      if (url.pathname.startsWith('/file/')) {
        return await this.handleFileProxy(url, res)
      }
      if (url.pathname === '/favicon.ico') {
        return this.handleFavicon(res)
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
    } catch (err) {
      console.error('Server error:', err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal server error')
    }
  }

  private async handlePreview(url: URL, res: http.ServerResponse) {
    const fileParam = url.searchParams.get('file')
    if (!fileParam) {
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Missing file parameter')
      return
    }

    const fileUri = vscode.Uri.parse(fileParam)
    const config = this.getConfig()
    const html = await renderPreview(
      fileUri,
      config,
      this.extensionPath,
      this.port,
    )

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    })
    res.end(html)
  }

  private handleStatic(url: URL, res: http.ServerResponse) {
    const relativePath = url.pathname.slice('/static/'.length)
    const filePath = path.join(this.extensionPath, 'extension', relativePath)

    // Prevent path traversal
    const resolved = path.resolve(filePath)
    const base = path.resolve(this.extensionPath, 'extension')
    if (!resolved.startsWith(base)) {
      res.writeHead(403).end('Forbidden')
      return
    }

    if (!fs.existsSync(resolved)) {
      res.writeHead(404).end('Not found')
      return
    }

    const ext = path.extname(resolved)
    res.writeHead(200, {
      'Content-Type': getMimeType(ext),
      'Cache-Control': 'public, max-age=3600',
    })
    fs.createReadStream(resolved).pipe(res)
  }

  private async handleFileProxy(url: URL, res: http.ServerResponse) {
    const encodedPath = url.pathname.slice('/file/'.length)
    const filePath = decodeURIComponent(encodedPath)

    // Validate path is within workspace
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      const inWorkspace = workspaceFolders.some(f =>
        filePath.startsWith(f.uri.fsPath),
      )
      if (!inWorkspace) {
        res.writeHead(403).end('Forbidden')
        return
      }
    }

    try {
      const fileUri = vscode.Uri.file(filePath)
      const data = await vscode.workspace.fs.readFile(fileUri)
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': getMimeType(ext) })
      res.end(Buffer.from(data))
    } catch {
      res.writeHead(404).end('File not found')
    }
  }

  private handleFavicon(res: http.ServerResponse) {
    const iconPath = path.join(
      this.extensionPath,
      'extension',
      'images',
      'logo.svg',
    )
    if (fs.existsSync(iconPath)) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml' })
      fs.createReadStream(iconPath).pipe(res)
    } else {
      res.writeHead(204).end()
    }
  }
}

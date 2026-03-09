import * as http from 'http'
import { WebSocketServer, WebSocket } from 'ws'

type CommandHandler = (command: string) => void
type SettingHandler = (key: string, value: any) => void

export class PreviewWsServer {
  private wss: WebSocketServer
  private clients: Map<string, Set<WebSocket>> = new Map()
  private commandHandler: CommandHandler | null = null
  private settingHandler: SettingHandler | null = null

  /** Register a handler for commands sent from the browser client */
  onCommand(handler: CommandHandler) {
    this.commandHandler = handler
  }

  /** Register a handler for setting changes from the browser client */
  onSetting(handler: SettingHandler) {
    this.settingHandler = handler
  }

  attach(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' })
    this.wss.on('connection', (ws, req) => {
      const fileUri =
        new URL(req.url, 'http://localhost').searchParams.get('file') || ''
      this.addClient(fileUri, ws)
      ws.on('close', () => this.removeClient(fileUri, ws))
      ws.on('message', data => this.handleMessage(fileUri, ws, data))
    })
  }

  broadcastUpdate(fileUri: string, html: string, tocHtml: string) {
    this.broadcast(fileUri, { type: 'update', html, tocHtml })
  }

  broadcastConfig(fileUri: string, config: Record<string, any>) {
    this.broadcast(fileUri, { type: 'config', ...config })
  }

  /** Broadcast config to all connected clients regardless of file */
  broadcastConfigAll(config: Record<string, any>) {
    const msg = JSON.stringify({ type: 'config', ...config })
    this.clients.forEach(clients => {
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg)
      })
    })
  }

  dispose() {
    this.clients.forEach(clients => clients.forEach(ws => ws.close()))
    this.clients.clear()
    this.wss?.close()
  }

  private addClient(fileUri: string, ws: WebSocket) {
    if (!this.clients.has(fileUri)) {
      this.clients.set(fileUri, new Set())
    }
    this.clients.get(fileUri).add(ws)
  }

  private removeClient(fileUri: string, ws: WebSocket) {
    const clients = this.clients.get(fileUri)
    if (clients) {
      clients.delete(ws)
      if (clients.size === 0) this.clients.delete(fileUri)
    }
  }

  private handleMessage(fileUri: string, sender: WebSocket, data: any) {
    try {
      const msg = JSON.parse(data.toString())
      if (msg.type === 'scroll') {
        this.broadcast(fileUri, msg, sender)
      } else if (msg.type === 'command' && msg.command) {
        this.commandHandler?.(msg.command)
      } else if (msg.type === 'setting' && msg.key) {
        this.settingHandler?.(msg.key, msg.value)
      }
    } catch {}
  }

  private broadcast(
    fileUri: string,
    data: Record<string, any>,
    exclude?: WebSocket,
  ) {
    const clients = this.clients.get(fileUri)
    if (!clients) return
    const msg = JSON.stringify(data)
    clients.forEach(ws => {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(msg)
    })
  }
}

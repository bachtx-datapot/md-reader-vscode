type MessageHandler = (msg: any) => void

export class WsClient {
  private ws: WebSocket
  private url: string
  private reconnectDelay = 1000
  private handlers: Map<string, MessageHandler[]> = new Map()

  connect(url: string) {
    this.url = url
    this.ws = new WebSocket(url)

    this.ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        this.handlers.get(msg.type)?.forEach(h => h(msg))
      } catch {}
    }

    this.ws.onclose = () => {
      setTimeout(() => this.connect(this.url), this.reconnectDelay)
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 8000)
    }

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type).push(handler)
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

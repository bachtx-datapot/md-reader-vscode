import '@/style/index.less'
import Event from '@/core/event'
import { initPlugins } from './plugins'
import { WsClient } from './ws-client'
import { ScrollTracker } from './scroll-tracker'
import { initUiControls } from './ui-controls'
import { initSidebar } from './sidebar'
import { setTheme } from './utils'
import { openSettingsModal, updateSettingsModal } from './settings-modal'

function init() {
  // Read config injected by server
  const configEl = document.getElementById('md-reader-config')
  if (!configEl) return
  const config = JSON.parse(configEl.textContent)

  // DOM references
  const article = document.querySelector(
    '.md-reader__markdown-content',
  ) as HTMLElement
  const mdBody = document.querySelector('.md-reader__body') as HTMLElement
  const mdSide = document.querySelector('.mdr-side') as HTMLElement
  const sideExpandBtn = document.querySelector(
    '.md-reader__btn--side-expand',
  ) as HTMLElement
  const goTopBtn = document.querySelector(
    '.md-reader__btn--go-top',
  ) as HTMLElement

  // Set initial theme
  setTheme(config.theme)

  // Init event system + plugins
  const globalEvent = new Event()
  initPlugins({ event: globalEvent })

  // Delegate click events to plugin system
  article.addEventListener(
    'click',
    e => globalEvent.emit('click', e.target),
    true,
  )

  // TOC tree element (inside the sidebar)
  const sideTree = mdSide.querySelector('.mdr-side__tree') as HTMLElement

  // Scroll tracking
  const scrollTracker = new ScrollTracker(article, sideTree, goTopBtn)
  scrollTracker.update()

  // Sidebar toolbar (filter + collapse/expand)
  initSidebar(mdSide)

  // WebSocket client for hot reload
  const ws = new WsClient()

  // Detect if running in VSCode webview (iframe) or standalone browser
  const isInIframe = window.self !== window.top

  // UI controls — Settings behavior differs by context
  initUiControls(sideExpandBtn, goTopBtn, mdBody, mdSide, {
    onCommand: cmd => {
      if (cmd === 'settings') {
        if (isInIframe) {
          // VSCode webview: ask extension to open native settings
          ws.send({ type: 'command', command: 'settings' })
        } else {
          // Browser: open in-page settings modal
          openSettingsModal(
            {
              themeOption: config.themeOption || config.theme,
              centered: config.centered,
              plugins: config.plugins || [],
            },
            ws,
          )
        }
      } else {
        ws.send({ type: 'command', command: cmd })
      }
    },
  })
  ws.on('update', msg => {
    const scrollTop = document.documentElement.scrollTop
    article.innerHTML = msg.html
    sideTree.innerHTML = msg.tocHtml
    document.documentElement.scrollTop = scrollTop
    scrollTracker.update()

    // Re-init mermaid if available
    if (typeof (window as any).mermaid !== 'undefined') {
      try {
        ;(window as any).mermaid.run({
          nodes: article.querySelectorAll('.mermaid'),
        })
      } catch {}
    }
  })

  ws.on('config', msg => {
    if (msg.theme) {
      setTheme(msg.theme)
      config.theme = msg.theme
    }
    if (typeof msg.centered === 'boolean') {
      article.classList.toggle('centered', msg.centered)
      config.centered = msg.centered
    }
    if (msg.themeOption) config.themeOption = msg.themeOption
    if (msg.plugins) config.plugins = msg.plugins

    // Keep browser settings modal in sync
    updateSettingsModal({
      themeOption: config.themeOption || config.theme,
      centered: config.centered,
      plugins: config.plugins || [],
    })
  })

  ws.connect(config.wsUrl)

  // Handle hash anchors
  if (window.location.hash) {
    setTimeout(() => {
      const hash = window.location.hash.slice(1)
      const target = document.getElementById(hash)
      if (target) window.scrollTo(0, target.offsetTop)
    })
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

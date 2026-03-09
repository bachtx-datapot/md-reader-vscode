/**
 * Browser-side settings modal.
 * Renders an overlay with Appearance + Plugins settings.
 * Sends changes to extension via WebSocket.
 */

import type { WsClient } from './ws-client'

const THEME_OPTIONS = [
  { value: 'auto', label: 'Auto (Browser)' },
  { value: 'follow-vscode', label: 'Follow VSCode' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'github', label: 'GitHub' },
  { value: 'wechat', label: 'WeChat' },
  { value: 'profile', label: 'Profile' },
]

const PLUGIN_LIST = [
  'Emoji',
  'Sup',
  'Sub',
  'TOC',
  'Ins',
  'Mark',
  'Katex',
  'Mermaid',
  'Abbr',
  'Deflist',
  'Footnote',
  'TaskLists',
  'Alert',
]

let overlay: HTMLElement | null = null

interface SettingsConfig {
  themeOption: string
  centered: boolean
  plugins: string[]
}

export function openSettingsModal(config: SettingsConfig, ws: WsClient) {
  if (overlay) {
    overlay.style.display = ''
    return
  }

  overlay = document.createElement('div')
  overlay.className = 'mdr-settings-overlay'
  overlay.innerHTML = buildHtml(config)
  document.body.appendChild(overlay)

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal()
  })

  // Close button
  overlay
    .querySelector('.mdr-settings__close')
    ?.addEventListener('click', closeModal)

  // Tab switching
  overlay.querySelectorAll('.mdr-settings__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay
        .querySelectorAll('.mdr-settings__tab')
        .forEach(t => t.classList.remove('active'))
      overlay
        .querySelectorAll('.mdr-settings__panel')
        .forEach(p => p.classList.remove('active'))
      ;(tab as HTMLElement).classList.add('active')
      overlay
        .querySelector(`#mdr-sp-${(tab as HTMLElement).dataset.tab}`)
        ?.classList.add('active')
    })
  })

  // Theme select
  overlay.querySelector('#mdr-set-theme')?.addEventListener('change', e => {
    ws.send({
      type: 'setting',
      key: 'theme',
      value: (e.target as HTMLSelectElement).value,
    })
  })

  // Centered toggle
  overlay.querySelector('#mdr-set-centered')?.addEventListener('change', e => {
    ws.send({
      type: 'setting',
      key: 'centered',
      value: (e.target as HTMLInputElement).checked,
    })
  })

  // Plugin checkboxes
  overlay.querySelectorAll('.mdr-settings__plugin-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const checked = Array.from(
        overlay.querySelectorAll('.mdr-settings__plugin-cb:checked'),
      ).map((el: HTMLInputElement) => el.value)
      ws.send({ type: 'setting', key: 'plugins', value: checked })
    })
  })
}

export function updateSettingsModal(config: SettingsConfig) {
  if (!overlay) return
  const themeEl = overlay.querySelector('#mdr-set-theme') as HTMLSelectElement
  if (themeEl) themeEl.value = config.themeOption

  const centeredEl = overlay.querySelector(
    '#mdr-set-centered',
  ) as HTMLInputElement
  if (centeredEl) centeredEl.checked = config.centered

  overlay
    .querySelectorAll('.mdr-settings__plugin-cb')
    .forEach((cb: HTMLInputElement) => {
      cb.checked = config.plugins.includes(cb.value)
    })
}

function closeModal() {
  if (overlay) overlay.style.display = 'none'
}

function buildHtml(config: SettingsConfig): string {
  const themeOpts = THEME_OPTIONS.map(
    o =>
      `<option value="${o.value}" ${
        config.themeOption === o.value ? 'selected' : ''
      }>${o.label}</option>`,
  ).join('')

  const pluginItems = PLUGIN_LIST.map(p => {
    const checked = config.plugins.includes(p) ? 'checked' : ''
    return `<label class="mdr-settings__plugin-item">
      <input type="checkbox" class="mdr-settings__plugin-cb" value="${p}" ${checked} />
      <span>${p}</span>
    </label>`
  }).join('')

  return `<div class="mdr-settings">
  <div class="mdr-settings__header">
    <div class="mdr-settings__tabs">
      <button class="mdr-settings__tab active" data-tab="appearance">Appearance</button>
      <button class="mdr-settings__tab" data-tab="plugins">Plugins</button>
    </div>
    <button class="mdr-settings__close" title="Close">&times;</button>
  </div>
  <div id="mdr-sp-appearance" class="mdr-settings__panel active">
    <div class="mdr-settings__row">
      <div class="mdr-settings__label">Theme</div>
      <select id="mdr-set-theme">${themeOpts}</select>
    </div>
    <div class="mdr-settings__row">
      <div class="mdr-settings__label">Centered Layout</div>
      <label class="mdr-settings__toggle">
        <input type="checkbox" id="mdr-set-centered" ${
          config.centered ? 'checked' : ''
        } />
        <span class="mdr-settings__slider"></span>
      </label>
    </div>
  </div>
  <div id="mdr-sp-plugins" class="mdr-settings__panel">
    <div class="mdr-settings__plugins-grid">${pluginItems}</div>
  </div>
</div>`
}

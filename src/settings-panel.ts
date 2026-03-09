import * as vscode from 'vscode'
import type { MdReaderConfig, ThemeOption } from './types'

let panel: vscode.WebviewPanel | null = null

export function openSettingsPanel(
  context: vscode.ExtensionContext,
  getConfig: () => MdReaderConfig,
) {
  if (panel) {
    panel.reveal()
    return
  }

  panel = vscode.window.createWebviewPanel(
    'mdReaderSettings',
    'MD Reader Settings',
    vscode.ViewColumn.Active,
    { enableScripts: true, retainContextWhenHidden: true },
  )

  panel.webview.html = getSettingsHtml(getConfig())

  // Handle messages from webview
  panel.webview.onDidReceiveMessage(
    async msg => {
      if (msg.type === 'update') {
        const config = vscode.workspace.getConfiguration('md-reader')
        await config.update(
          msg.key,
          msg.value,
          vscode.ConfigurationTarget.Global,
        )
      }
    },
    undefined,
    context.subscriptions,
  )

  // Push config updates to webview when settings change externally
  const configListener = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('md-reader') && panel) {
      panel.webview.postMessage({
        type: 'configChanged',
        config: getConfig(),
      })
    }
  })

  panel.onDidDispose(() => {
    panel = null
    configListener.dispose()
  })
}

const THEME_OPTIONS: { value: ThemeOption; label: string }[] = [
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

function getSettingsHtml(config: MdReaderConfig): string {
  const themeOptions = THEME_OPTIONS.map(
    o =>
      `<option value="${o.value}" ${
        config.theme === o.value ? 'selected' : ''
      }>${o.label}</option>`,
  ).join('')

  const pluginCheckboxes = PLUGIN_LIST.map(p => {
    const checked = config.plugins.includes(p) ? 'checked' : ''
    return `<label class="plugin-item"><input type="checkbox" value="${p}" ${checked} /><span>${p}</span></label>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --input-bg: var(--vscode-input-background);
      --input-border: var(--vscode-input-border, #444);
      --input-fg: var(--vscode-input-foreground);
      --accent: var(--vscode-focusBorder);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --separator: var(--vscode-panel-border, #333);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: 13px;
      color: var(--fg);
      background: var(--bg);
      padding: 0;
    }

    /* Tabs */
    .tabs {
      display: flex;
      border-bottom: 1px solid var(--separator);
      background: var(--vscode-editorGroupHeader-tabsBackground, var(--bg));
    }
    .tab {
      padding: 10px 20px;
      cursor: pointer;
      border: none;
      background: none;
      color: var(--fg);
      opacity: 0.6;
      font-size: 13px;
      border-bottom: 2px solid transparent;
      transition: opacity 0.15s, border-color 0.15s;
    }
    .tab:hover { opacity: 0.85; }
    .tab.active {
      opacity: 1;
      border-bottom-color: var(--accent);
    }

    /* Panels */
    .panel { display: none; padding: 20px 24px; }
    .panel.active { display: block; }

    /* Form elements */
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--separator);
    }
    .setting-row:last-child { border-bottom: none; }
    .setting-label {
      font-weight: 500;
    }
    .setting-desc {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 2px;
    }

    select, input[type="number"] {
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 13px;
      outline: none;
    }
    select:focus, input:focus {
      border-color: var(--accent);
    }

    /* Toggle switch */
    .toggle {
      position: relative;
      width: 36px;
      height: 20px;
      cursor: pointer;
    }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle .slider {
      position: absolute;
      inset: 0;
      background: var(--input-border);
      border-radius: 10px;
      transition: background 0.2s;
    }
    .toggle .slider::before {
      content: '';
      position: absolute;
      width: 14px;
      height: 14px;
      left: 3px;
      top: 3px;
      background: var(--fg);
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle input:checked + .slider {
      background: var(--accent);
    }
    .toggle input:checked + .slider::before {
      transform: translateX(16px);
    }

    /* Plugins grid */
    .plugins-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
      padding-top: 12px;
    }
    .plugin-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid var(--separator);
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .plugin-item:hover {
      border-color: var(--accent);
    }
    .plugin-item input[type="checkbox"] {
      accent-color: var(--accent);
    }

    /* Section title */
    h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--separator);
    }
  </style>
</head>
<body>
  <div class="tabs">
    <button class="tab active" data-tab="appearance">Appearance</button>
    <button class="tab" data-tab="plugins">Plugins</button>
  </div>

  <div id="appearance" class="panel active">
    <div class="setting-row">
      <div>
        <div class="setting-label">Theme</div>
        <div class="setting-desc">Preview color theme (independent from VSCode)</div>
      </div>
      <select id="theme">${themeOptions}</select>
    </div>

    <div class="setting-row">
      <div>
        <div class="setting-label">Centered Layout</div>
        <div class="setting-desc">Limit content width for readability</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="centered" ${
          config.centered ? 'checked' : ''
        } />
        <span class="slider"></span>
      </label>
    </div>

    <div class="setting-row">
      <div>
        <div class="setting-label">Preview Mode</div>
        <div class="setting-desc">Where to open the preview</div>
      </div>
      <select id="previewMode">
        <option value="browser" ${
          config.previewMode === 'browser' ? 'selected' : ''
        }>Browser</option>
        <option value="tab" ${
          config.previewMode === 'tab' ? 'selected' : ''
        }>Tab</option>
        <option value="side" ${
          config.previewMode === 'side' ? 'selected' : ''
        }>Side Panel</option>
      </select>
    </div>
  </div>

  <div id="plugins" class="panel">
    <h3>Markdown Plugins</h3>
    <div class="plugins-grid">${pluginCheckboxes}</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi()

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))
        tab.classList.add('active')
        document.getElementById(tab.dataset.tab).classList.add('active')
      })
    })

    // Setting change handlers
    function send(key, value) {
      vscode.postMessage({ type: 'update', key, value })
    }

    document.getElementById('theme').addEventListener('change', e => {
      send('theme', e.target.value)
    })

    document.getElementById('centered').addEventListener('change', e => {
      send('centered', e.target.checked)
    })

    document.getElementById('previewMode').addEventListener('change', e => {
      send('previewMode', e.target.value)
    })

    // Plugin checkboxes
    document.querySelectorAll('.plugin-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(
          document.querySelectorAll('.plugin-item input[type="checkbox"]:checked')
        ).map(el => el.value)
        send('plugins', checked)
      })
    })

    // Receive config updates from extension
    window.addEventListener('message', e => {
      const msg = e.data
      if (msg.type === 'configChanged') {
        const c = msg.config
        document.getElementById('theme').value = c.theme
        document.getElementById('centered').checked = c.centered
        document.getElementById('previewMode').value = c.previewMode
        document.querySelectorAll('.plugin-item input[type="checkbox"]').forEach(cb => {
          cb.checked = c.plugins.includes(cb.value)
        })
      }
    })
  </script>
</body>
</html>`
}

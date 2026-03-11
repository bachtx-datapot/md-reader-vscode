import * as vscode from 'vscode'
import type { MdReaderConfig } from './types'

export function getConfig(): MdReaderConfig {
  const config = vscode.workspace.getConfiguration('md-reader')
  return {
    previewMode: config.get(
      'previewMode',
      'browser',
    ) as MdReaderConfig['previewMode'],
    theme: config.get('theme', 'auto') as MdReaderConfig['theme'],
    centered: config.get('centered', true),
    plugins: config.get('plugins', [
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
    ]),
    port: config.get('port', 0),
  }
}

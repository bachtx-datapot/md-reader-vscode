export type ThemeOption =
  | 'auto'
  | 'follow-vscode'
  | 'light'
  | 'dark'
  | 'github'
  | 'wechat'
  | 'profile'

export interface MdReaderConfig {
  previewMode: 'browser' | 'tab' | 'side'
  theme: ThemeOption
  centered: boolean
  plugins: string[]
  port: number
}

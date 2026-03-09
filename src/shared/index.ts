// Server-safe shared utilities (no DOM, no Chrome APIs)
export const HEADERS = 'h1, h2, h3, h4, h5, h6'
export const CONTENT_TYPES = ['text/plain', 'text/markdown', 'text/x-markdown']

export type Theme = 'light' | 'dark' | 'auto' | 'github' | 'wechat' | 'profile'

// Resolve theme for rendering (server-side).
// 'auto' defers to client (browser prefers-color-scheme).
export const toTheme = (theme: string): Exclude<Theme, 'auto'> =>
  theme === 'auto' || theme === 'follow-vscode'
    ? 'light'
    : (theme as Exclude<Theme, 'auto'>)

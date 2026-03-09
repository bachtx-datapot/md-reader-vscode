import { rootThemePrefix, type Theme } from '@/config/page-themes'

export const HTML = document.documentElement
export const BODY = document.body
export const HEADERS = 'h1, h2, h3, h4, h5, h6'

export const darkMediaQuery: MediaQueryList = window.matchMedia(
  '(prefers-color-scheme: dark)',
)

export const getMediaQueryTheme = (): Exclude<Theme, 'auto'> =>
  darkMediaQuery.matches ? 'dark' : 'light'

export const toTheme = (theme: Theme): Exclude<Theme, 'auto'> =>
  theme === 'auto' ? getMediaQueryTheme() : theme

export function getHeads(
  container: HTMLElement,
  selector: string = HEADERS,
): Array<HTMLElement> {
  return Array.from(container.querySelectorAll(selector))
}

export function setTheme(themeType: Theme) {
  HTML.dataset[rootThemePrefix] = themeType
}

export function writeText(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

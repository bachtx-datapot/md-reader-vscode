import localeJson from './locale.json'

const DEFAULT_LOCALE: string = 'en'

interface Localize {
  (field: string): string
  locale: string
}

interface I18n {
  (locale?: string): Localize
  locales: string[]
}

const i18n: I18n = (locale: string = DEFAULT_LOCALE): Localize => {
  const defaultLocalizeMap: Object = localeJson[DEFAULT_LOCALE]
  const localizeMap: Object = localeJson[locale] || defaultLocalizeMap

  const localize: Localize = (field: string): string => {
    /* Also includes fields (default 'en') */
    return localizeMap[field] || defaultLocalizeMap[field] || field
  }
  localize.locale = locale

  return localize
}

i18n.locales = Object.keys(localeJson)

export default i18n

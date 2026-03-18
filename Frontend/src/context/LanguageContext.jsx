import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import el from '../locales/el.json'
import en from '../locales/en.json'

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof val === 'object' && val !== null) {
      Object.assign(acc, flatten(val, path))
    } else {
      acc[path] = val
    }
    return acc
  }, {})
}

const translations = {
  el: flatten(el),
  en: flatten(en),
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('lang') || 'el'
  })

  useEffect(() => {
    localStorage.setItem('lang', locale)
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback((key, params) => {
    let str = translations[locale]?.[key] ?? key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replaceAll(`{{${k}}}`, v)
      })
    }
    return str
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider')
  return ctx
}

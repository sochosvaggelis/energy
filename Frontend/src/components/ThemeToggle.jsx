import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../context/LanguageContext'
import './styles/ThemeToggle.css'

function ThemeToggle({ darkMode, onToggle }) {
  const { t, locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [open])

  return (
    <div className="settings-widget" ref={panelRef}>
      {open && (
        <div className="settings-panel">
          <div className="settings-row">
            <span className="settings-label">{darkMode ? t('theme.lightMode') : t('theme.darkMode')}</span>
            <button className="settings-btn settings-btn-theme" onClick={onToggle}>
              {darkMode
                ? <svg width="16" height="16" viewBox="137 1 320 320" fill="currentColor"><path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L388 68l54.9 16.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L416 160l37.1 50.4c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L388 252l-16.8 54.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L296 280l-50.4 37.1c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L204 252l-54.9-16.8c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L176 160l-37.1-50.4c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L204 68l16.8-54.9c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L296 40l50.4-37.1c4.5-3.1 10.2-3.7 15.2-1.6zM296 224a64 64 0 1 0 0-128 64 64 0 1 0 0 128z"/></svg>
                : <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor"><path d="M223.5 32C100 32 0 132.3 0 256s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>}
            </button>
          </div>
          <div className="settings-row">
            <span className="settings-label">{locale === 'el' ? 'English' : 'Ελληνικά'}</span>
            <button className="settings-btn" onClick={() => setLocale(locale === 'el' ? 'en' : 'el')}>
              {locale === 'el' ? 'EN' : 'ΕΛ'}
            </button>
          </div>
        </div>
      )}
      <button
        className="settings-toggle"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Settings"
      >
        <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor"><path d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1-64 0zm192-160a32 32 0 1 1 64 0 32 32 0 1 1-64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z"/></svg>
      </button>
    </div>
  )
}

export default ThemeToggle

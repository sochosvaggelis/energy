import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon, faSliders } from '@fortawesome/free-solid-svg-icons'
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
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
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
        <FontAwesomeIcon icon={faSliders} />
      </button>
    </div>
  )
}

export default ThemeToggle

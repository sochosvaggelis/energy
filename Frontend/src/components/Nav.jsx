import { useTranslation } from '../context/LanguageContext'

import './styles/Nav.css'

function Nav({ onCtaClick, sidebarOpen, onSidebarToggle }) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('nav.ariaLabel')}>
      <div className="nav-content">
        <a href="#" className="logo">
          <div className="logo-icon">⚡</div>
          EnergyCompare
        </a>
        <div className="nav-actions">
          <button className="nav-cta" onClick={onCtaClick}>
            {t('nav.requestOffer')}
          </button>
          <button className="nav-sidebar-toggle" onClick={onSidebarToggle}>
            {t('nav.comparePrices')}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Nav

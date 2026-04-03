import { memo } from 'react'
import { useTranslation } from '../context/LanguageContext'
import './styles/Footer.css'

const Footer = memo(function Footer() {
  const { t } = useTranslation()

  return (
    <footer aria-label={t('footer.ariaLabel')}>
      <div className="footer-content">
        <a href="#" className="logo">
          <div className="logo-icon">⚡</div>
          EnergyCompare
        </a>
        <div className="footer-links">
          <a href="/swthrhs/terms" target="_blank" rel="noopener noreferrer">{t('footer.terms')}</a>
          <a href="/swthrhs/privacy" target="_blank" rel="noopener noreferrer">{t('footer.privacy')}</a>
          <a href="mailto:info@energycompare.gr">{t('footer.contact')}</a>
        </div>
        <p className="footer-copy">{t('footer.copyright')}</p>
      </div>
    </footer>
  )
})

export default Footer

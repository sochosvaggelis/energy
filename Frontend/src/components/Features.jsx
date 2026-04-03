import { useEffect, useRef } from 'react'
import { useTranslation } from '../context/LanguageContext'
import './styles/Features.css'

const ChartBarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
    <path d="M160 80c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48h-32c-26.5 0-48-21.5-48-48V80zM0 272c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48v160c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V272zM320 144c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48v288c0 26.5-21.5 48-48 48h-32c-26.5 0-48-21.5-48-48V144z"/>
  </svg>
)

const HandHoldingDollarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
    <path d="M312 24V34.5c6.4 1.2 12.6 2.7 18.2 4.2c12.8 3.4 20.4 16.6 17 29.4s-16.6 20.4-29.4 17c-10.9-2.9-21.1-4.9-30.2-5c-7.3-.1-14.7 1.7-19.4 4.4c-2.1 1.3-3.1 2.4-3.5 3c-.3 .5-.7 1.2-.7 2.8c0 .3 0 .5 0 .6c.2 .2 .9 1.2 3.3 2.6c5.8 3.5 14.4 6.2 27.4 10.1l.9 .3c11.1 3.3 25.9 7.8 37.9 15.3c13.7 8.6 26.1 22.9 26.4 44.9c.3 22.5-11.4 38.9-26.7 48.5c-6.7 4.1-13.9 7-21.3 8.8V232c0 13.3-10.7 24-24 24s-24-10.7-24-24V220.6c-9.5-2.3-18.2-5.3-25.6-7.8c-2.1-.7-4.1-1.4-6-2c-12.6-4.2-19.4-17.8-15.2-30.4s17.8-19.4 30.4-15.2c2.6 .9 5 1.7 7.3 2.5c13.6 4.6 23.4 7.9 33.9 8.3c8 .3 15.1-1.6 19.2-4.1c1.9-1.2 2.8-2.2 3.2-2.9c.4-.6 .9-1.8 .8-4.1l0-.2c0-1 0-2.1-4-4.6c-5.7-3.6-14.3-6.4-27.1-10.3l-1.9-.6c-10.8-3.2-25-7.5-36.4-14.4c-13.5-8.1-26.5-22-26.6-44.1c-.1-22.9 12.9-38.6 27.7-47.4c6.4-3.8 13.3-6.4 20.2-8.2V24c0-13.3 10.7-24 24-24s24 10.7 24 24zM568.2 336.3c13.1 17.8 9.3 42.8-8.5 55.9L433.1 485.5c-23.4 17.2-51.6 26.5-80.7 26.5H192 32c-17.7 0-32-14.3-32-32V416c0-17.7 14.3-32 32-32H68.8l44.9-36c22.7-18.2 50.9-28 80-28H272h16 64c17.7 0 32 14.3 32 32s-14.3 32-32 32H288 272c-8.8 0-16 7.2-16 16s7.2 16 16 16h56.4c18.4 0 36.4-6.1 51-17.2l85.3-64.5c17.8-13.1 42.8-9.3 55.9 8.5z"/>
  </svg>
)

const BullseyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
    <path d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
  </svg>
)

const FEATURES = [
  { Icon: ChartBarIcon, titleKey: 'features.compareTitle', descKey: 'features.compareDesc', accent: 'blue' },
  { Icon: HandHoldingDollarIcon, titleKey: 'features.noFeesTitle', descKey: 'features.noFeesDesc', accent: 'gold' },
  { Icon: BullseyeIcon, titleKey: 'features.personalizedTitle', descKey: 'features.personalizedDesc', accent: 'green' },
]

function Features() {
  const { t } = useTranslation()
  const gridRef = useRef(null)

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.feature-card')
    if (!cards?.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="features" id="features" aria-label={t('features.ariaLabel')}>
      <div className="section-header">
        <h2>{t('features.heading')}</h2>
        <p>{t('features.description')}</p>
      </div>

      <div className="features-grid" ref={gridRef}>
        {FEATURES.map((f, i) => (
          <div key={i} className={`feature-card feature-accent-${f.accent}`} style={{ transitionDelay: `${i * 120}ms` }}>
            <div className="feature-icon-wrapper">
              <div className="feature-icon">
                <f.Icon />
              </div>
            </div>
            <h3>{t(f.titleKey)}</h3>
            <p>{t(f.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Features

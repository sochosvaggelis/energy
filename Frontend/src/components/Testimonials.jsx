import { useEffect, useRef } from 'react'
import { useTranslation } from '../context/LanguageContext'
import './styles/Testimonials.css'

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329l-24.6 145.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3L288.1 439.8 416.2 508.3c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.3 329 542.4 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L380.9 150.3 316.9 18z"/>
  </svg>
)

const QuoteLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
    <path d="M0 216C0 149.7 53.7 96 120 96h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V216zm256 0c0-66.3 53.7-120 120-120h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H320c-35.3 0-64-28.7-64-64V216z"/>
  </svg>
)

const TESTIMONIALS = [
  { quoteKey: 'testimonials.t1Quote', nameKey: 'testimonials.t1Name', initialsKey: 'testimonials.t1Initials', locationKey: 'testimonials.t1Location', accent: 'blue' },
  { quoteKey: 'testimonials.t2Quote', nameKey: 'testimonials.t2Name', initialsKey: 'testimonials.t2Initials', locationKey: 'testimonials.t2Location', accent: 'gold' },
  { quoteKey: 'testimonials.t3Quote', nameKey: 'testimonials.t3Name', initialsKey: 'testimonials.t3Initials', locationKey: 'testimonials.t3Location', accent: 'green' },
]

function Testimonials() {
  const { t } = useTranslation()
  const gridRef = useRef(null)

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.testimonial-card')
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
    <section className="testimonials" id="testimonials" aria-label={t('testimonials.ariaLabel')}>
      <div className="section-header">
        <h2>{t('testimonials.heading')}</h2>
        <p>{t('testimonials.description')}</p>
      </div>

      <div className="testimonials-grid" ref={gridRef}>
        {TESTIMONIALS.map((item, i) => (
          <div key={i} className={`testimonial-card testimonial-accent-${item.accent}`} style={{ transitionDelay: `${i * 120}ms` }}>
            <div className="testimonial-quote-icon">
              <QuoteLeftIcon />
            </div>
            <div className="stars">
              {[...Array(5)].map((_, j) => (
                <StarIcon key={j} />
              ))}
            </div>
            <blockquote>{t(item.quoteKey)}</blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">{t(item.initialsKey)}</div>
              <div className="author-info">
                <strong>{t(item.nameKey)}</strong>
                <span>{t(item.locationKey)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Testimonials

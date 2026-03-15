import './styles/CTA.css'

function CTA({ onCtaClick }) {
  return (
    <section className="cta-section" id="cta" aria-label="Αίτηση προσφοράς">
      <div className="cta-box">
        <h2>Έτοιμος να εξοικονομήσεις;</h2>
        <p>Συμπλήρωσε τη φόρμα τώρα και ένας σύμβουλός μας θα σε καλέσει σύντομα</p>
        <button className="cta-btn" onClick={onCtaClick}>
          Ζήτα Δωρεάν Προσφορά
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </section>
  )
}

export default CTA

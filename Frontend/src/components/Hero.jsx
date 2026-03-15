import ContactForm from './ContactForm'
import './styles/Hero.css'

function Hero({ formData, setFormData, onFormSubmit, providersData }) {
  return (
      <section className="hero" id="hero" aria-label="Σύγκριση τιμών ενέργειας">
        <div className="hero-content">
          <div className="hero-text-top">
            <div className="badge">Δωρεάν Σύγκριση Τιμών</div>
            <h1>Εξοικονόμησε έως <span>40%</span> στους λογαριασμούς ενέργειας</h1>
          </div>

          <div className="hero-text-bottom">
            <p className="hero-description">
              Συγκρίνουμε όλους τους παρόχους ρεύματος και φυσικού αερίου στην Ελλάδα για να βρούμε την καλύτερη
              τιμή για σένα. Χωρίς κρυφές χρεώσεις.
            </p>
            <div className="trust-badges">
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                100% Δωρεάν
              </div>
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                5.000+ Πελάτες
              </div>
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Όλοι οι Πάροχοι
              </div>
            </div>
          </div>

          <ContactForm formData={formData} setFormData={setFormData} onFormSubmit={onFormSubmit} providersData={providersData} />
        </div>
      </section >
  )
}

export default Hero

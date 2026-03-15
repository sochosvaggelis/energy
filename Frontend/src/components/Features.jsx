import './styles/Features.css'

function Features() {
  return (
    <section className="features" id="features" aria-label="Πλεονεκτήματα">
      <div className="section-header">
        <h2>Γιατί να μας επιλέξεις;</h2>
        <p>Σου εξοικονομούμε χρόνο και χρήμα με την εξειδικευμένη μας γνώση της αγοράς ενέργειας</p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Σύγκριση Όλων των Παρόχων</h3>
          <p>Συνεργαζόμαστε με όλους τους παρόχους ενέργειας στην Ελλάδα για να βρούμε την καλύτερη τιμή.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Χωρίς Κρυφές Χρεώσεις</h3>
          <p>Η υπηρεσία μας είναι 100% δωρεάν. Πληρωνόμαστε από τους παρόχους, όχι από εσένα.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Εξατομικευμένη Πρόταση</h3>
          <p>Λαμβάνουμε υπόψη τις ανάγκες σου για να σου προτείνουμε το ιδανικό πακέτο.</p>
        </div>
      </div>
    </section>
  )
}

export default Features

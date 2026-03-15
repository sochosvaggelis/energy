import './styles/Testimonials.css'

function Testimonials() {
  return (
    <section className="testimonials" id="testimonials" aria-label="Κριτικές πελατών">
      <div className="section-header">
        <h2>Τι λένε οι πελάτες μας</h2>
        <p>Χιλιάδες Έλληνες εμπιστεύτηκαν την EnergyCompare</p>
      </div>

      <div className="testimonials-grid">
        <div className="testimonial-card">
          <div className="stars">★★★★★</div>
          <blockquote>"Εξοικονόμησα 35€ τον μήνα στο ρεύμα χωρίς να κάνω τίποτα. Με πήραν τηλέφωνο, μου εξήγησαν
            τις επιλογές και ανέλαβαν τα πάντα."</blockquote>
          <div className="testimonial-author">
            <div className="author-avatar">ΜΚ</div>
            <div className="author-info">
              <strong>Μαρία Κ.</strong>
              <span>Αθήνα</span>
            </div>
          </div>
        </div>

        <div className="testimonial-card">
          <div className="stars">★★★★★</div>
          <blockquote>"Πολύ επαγγελματική εξυπηρέτηση. Με βοήθησαν να καταλάβω τις χρεώσεις και βρήκαμε πάροχο που
            ταιριάζει στις ανάγκες μου."</blockquote>
          <div className="testimonial-author">
            <div className="author-avatar">ΓΠ</div>
            <div className="author-info">
              <strong>Γιώργος Π.</strong>
              <span>Θεσσαλονίκη</span>
            </div>
          </div>
        </div>

        <div className="testimonial-card">
          <div className="stars">★★★★★</div>
          <blockquote>"Άλλαξα και ρεύμα και φυσικό αέριο. Η διαφορά στον λογαριασμό είναι εμφανής από τον πρώτο
            μήνα!"</blockquote>
          <div className="testimonial-author">
            <div className="author-avatar">ΕΣ</div>
            <div className="author-info">
              <strong>Ελένη Σ.</strong>
              <span>Πάτρα</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials

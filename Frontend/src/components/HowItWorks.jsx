import './styles/HowItWorks.css'

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works" aria-label="Πώς λειτουργεί">
      <div className="section-header">
        <h2>Πώς λειτουργεί;</h2>
        <p>3 απλά βήματα για να μειώσεις τον λογαριασμό σου</p>
      </div>

      <div className="steps">
        <div className="step">
          <div className="step-number">1</div>
          <h3>Συμπλήρωσε τη Φόρμα</h3>
          <p>Πες μας το τηλέφωνό σου και τι υπηρεσία σε ενδιαφέρει</p>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <h3>Σε Καλούμε Εμείς</h3>
          <p>Ένας σύμβουλός μας θα επικοινωνήσει μαζί σου</p>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <h3>Εξοικονομείς</h3>
          <p>Αναλαμβάνουμε όλη τη διαδικασία αλλαγής παρόχου</p>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks

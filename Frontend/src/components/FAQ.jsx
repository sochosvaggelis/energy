import { useState } from 'react'
import './styles/FAQ.css'

function FAQ() {
  const [activeFaq, setActiveFaq] = useState(null)

  const handleFaqClick = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const faqData = [
    {
      question: 'Είναι πραγματικά δωρεάν η υπηρεσία;',
      answer: 'Ναι, η υπηρεσία μας είναι 100% δωρεάν για τους καταναλωτές. Πληρωνόμαστε από τους παρόχους ενέργειας ως προμήθεια για κάθε νέο πελάτη που τους φέρνουμε.'
    },
    {
      question: 'Πόσο χρόνο παίρνει η αλλαγή παρόχου;',
      answer: 'Η διαδικασία αλλαγής παρόχου ολοκληρώνεται συνήθως σε 2-4 εβδομάδες. Εμείς αναλαμβάνουμε όλη τη γραφειοκρατία για εσάς.'
    },
    {
      question: 'Θα μείνω χωρίς ρεύμα κατά την αλλαγή;',
      answer: 'Όχι, σε καμία περίπτωση. Η αλλαγή παρόχου γίνεται απρόσκοπτα και δεν επηρεάζει καθόλου την παροχή ρεύματος ή φυσικού αερίου.'
    },
    {
      question: 'Ποιους παρόχους συγκρίνετε;',
      answer: 'Συνεργαζόμαστε με όλους τους μεγάλους παρόχους της ελληνικής αγοράς: ΔΕΗ, Protergia, Elpedison, Zenith, NRG, Volterra, Watt+Volt και πολλούς ακόμα.'
    }
  ]

  return (
    <section className="faq" id="faq" aria-label="Συχνές ερωτήσεις">
      <div className="section-header">
        <h2>Συχνές Ερωτήσεις</h2>
      </div>

      <div className="faq-list">
        {faqData.map((faq, index) => (
          <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
            <button className="faq-question" onClick={() => handleFaqClick(index)}>
              <span>{faq.question}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-answer">
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default FAQ

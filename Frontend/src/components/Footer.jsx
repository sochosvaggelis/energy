import './styles/Footer.css'

function Footer() {
  return (
    <footer aria-label="Υποσέλιδο">
      <div className="footer-content">
        <a href="#" className="logo">
          <div className="logo-icon">⚡</div>
          EnergyCompare
        </a>
        <div className="footer-links">
          <a href="#">Όροι Χρήσης</a>
          <a href="#">Πολιτική Απορρήτου</a>
          <a href="#">Επικοινωνία</a>
        </div>
        <p className="footer-copy">© 2025 EnergyCompare. Με επιφύλαξη παντός δικαιώματος.</p>
      </div>
    </footer>
  )
}

export default Footer

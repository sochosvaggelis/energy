import './styles/Nav.css'

function Nav({ onCtaClick, sidebarOpen, onSidebarToggle }) {
  return (
    <nav aria-label="Κύρια πλοήγηση">
      <div className="nav-content">
        <a href="#" className="logo">
          <div className="logo-icon">⚡</div>
          EnergyCompare
        </a>
        <div className="nav-actions">
          <button className="nav-cta" onClick={onCtaClick}>
            Ζήτα Προσφορά
          </button>
          <button className="nav-sidebar-toggle" onClick={onSidebarToggle}>
            {sidebarOpen ? 'Σύγκρινε τιμές' : 'Σύγκρινε τιμές'}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Nav

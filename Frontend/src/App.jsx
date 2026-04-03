import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import ErrorBoundary from './components/ErrorBoundary'
import './components/styles/ErrorBoundary.css'

// Lazy-loaded below-the-fold sections
const Features = lazy(() => import('./components/Features'))
const HowItWorks = lazy(() => import('./components/HowItWorks'))
const Testimonials = lazy(() => import('./components/Testimonials'))
const FAQ = lazy(() => import('./components/FAQ'))
const CTA = lazy(() => import('./components/CTA'))

// Lazy-loaded sidebars (only shown after user interaction)
const PriceSidebar = lazy(() => import('./components/PriceSidebar'))
const PlanDetailSidebar = lazy(() => import('./components/PlanDetailSidebar'))

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved !== null ? JSON.parse(saved) : true
  })

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    region: '',
    contact_time: 'anytime',
    customerType: 'residential',
    businessTariff: '',
    nightTariff: '',
    socialTariff: '',
    provider: '',
    kwhConsumption: 140,
    nightKwhConsumption: 0
  })

  const [activeService, setActiveService] = useState('electricity')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pricesData, setPricesData] = useState([])
  const [providersData, setProvidersData] = useState([])
  const [settingsVars, setSettingsVars] = useState({})
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    async function loadPrices() {
      try {
        const { supabase } = await import('./lib/supabase')
        const [plansRes, settingsRes, providersRes] = await Promise.all([
          supabase.from('plans').select('*, providers(name, adjustment_factor, logo_url, info_text)'),
          supabase.from('settings').select('key, value'),
          supabase.from('providers').select('id, name, logo_url').order('name')
        ])

        if (plansRes.error) {
          if (import.meta.env.DEV) console.error('Failed to load plans:', plansRes.error)
          setFetchError('Failed to load plan data. Please reload the page.')
          return
        }
        if (providersRes.error) {
          if (import.meta.env.DEV) console.error('Failed to load providers:', providersRes.error)
          setFetchError('Failed to load provider data. Please reload the page.')
          return
        }

        setFetchError(null)

        const vars = {}
        if (settingsRes.data) {
          settingsRes.data.forEach(s => { vars[s.key] = Number(s.value) })
        }
        setSettingsVars(vars)

        const flat = plansRes.data.map(plan => ({
          id: plan.id,
          provider: plan.providers.name,
          adjustment_factor: plan.providers.adjustment_factor,
          provider_logo: plan.providers.logo_url,
          provider_info: plan.providers.info_text || '',
          service_type: plan.service_type,
          plan: plan.plan_name,
          tariff_type: plan.tariff_type,
          price_per_kwh: plan.price_per_kwh,
          night_price_per_kwh: plan.night_price_per_kwh,
          monthly_fee_eur: plan.monthly_fee_eur,
          social_tariff: plan.social_tariff,
          price_formula: plan.price_formula,
          night_price_formula: plan.night_price_formula,
          tv: plan.tv,
          ll: plan.ll,
          lu: plan.lu,
          alpha: plan.alpha,
        }))
        setPricesData(flat)
        if (providersRes.data) setProvidersData(providersRes.data)
      } catch (err) {
        if (import.meta.env.DEV) console.error('Unexpected error loading data:', err)
        setFetchError('An unexpected error occurred. Please reload the page.')
      }
    }
    loadPrices()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))

    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]')
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (colorSchemeMeta) colorSchemeMeta.content = darkMode ? 'dark' : 'light'
    if (themeColorMeta) themeColorMeta.content = darkMode ? '#0a1628' : '#f1f5f9'
  }, [darkMode])

  const scrollToForm = () => {
    requestAnimationFrame(() => {
      document.querySelector('.form-card')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    })
  }

  const detailWasOpen = useRef(false)
  const closingRef = useRef(false)

  const handleSidebarClose = () => {
    if (detailSidebarOpen && !closingRef.current) {
      closingRef.current = true
      detailWasOpen.current = true
      setDetailSidebarOpen(false)
      setTimeout(() => {
        setSidebarOpen(false)
        closingRef.current = false
      }, 400)
    } else if (!closingRef.current) {
      setSidebarOpen(false)
    }
  }

  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      handleSidebarClose()
    } else {
      setSidebarOpen(true)
    }
  }

  useEffect(() => {
    if (sidebarOpen && detailWasOpen.current) {
      setTimeout(() => {
        setDetailSidebarOpen(true)
      }, 400)
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (sidebarOpen || detailSidebarOpen) {
      if (sidebarOpen) scrollToForm()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen, detailSidebarOpen])

  const handleFormSubmit = async () => {
    setFormSubmitted(true)
    setSidebarOpen(true)

    const { upsertSubmission } = await import('./lib/submissions')
    const { id, error } = await upsertSubmission(formData, providersData, activeService)
    if (!error && id) {
      setSubmissionId(id)
    }
  }

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan)
    setDetailSidebarOpen(true)
  }

  const handleCtaClick = () => {
    scrollToForm()
  }

  return (
    <ErrorBoundary>
      <div className="bg-pattern"></div>
      <div className="grid-overlay"></div>

      {fetchError && (
        <div className="error-banner" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{fetchError}</span>
          <button className="error-banner-dismiss" type="button" onClick={() => setFetchError(null)} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <Nav onCtaClick={handleCtaClick} sidebarOpen={sidebarOpen} onSidebarToggle={handleSidebarToggle} />
      <main>
        <Hero formData={formData} setFormData={setFormData} onFormSubmit={handleFormSubmit} providersData={providersData} pricesData={pricesData} activeService={activeService} setActiveService={setActiveService} />
        <Suspense fallback={null}>
          <Features />
          <HowItWorks />
          <Testimonials />
          <FAQ />
          <CTA onCtaClick={scrollToForm} />
        </Suspense>
      </main>
      <Footer />
      <Suspense fallback={null}>
        <PriceSidebar
          formData={formData}
          setFormData={setFormData}
          pricesData={pricesData}
          settingsVars={settingsVars}
          isOpen={sidebarOpen}
          onToggle={handleSidebarToggle}
          formSubmitted={formSubmitted}
          onGoToForm={scrollToForm}
          onPlanSelect={handlePlanSelect}
          selectedPlan={selectedPlan}
          providersData={providersData}
          activeService={activeService}
        />
        <PlanDetailSidebar
          isOpen={detailSidebarOpen}
          onClose={() => setDetailSidebarOpen(false)}
          selectedPlan={selectedPlan}
          formData={formData}
          submissionId={submissionId}
          providersData={providersData}
        />
      </Suspense>
      <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(prev => !prev)} />
    </ErrorBoundary>
  )
}

export default App

import { useState, useEffect, useRef } from 'react'
import './App.css'
import { supabase } from './lib/supabase'
import { upsertSubmission } from './lib/submissions'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'
import ThemeToggle from './components/ThemeToggle'
import PriceSidebar from './components/PriceSidebar'
import PlanDetailSidebar from './components/PlanDetailSidebar'

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

  const [formSubmitted, setFormSubmitted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pricesData, setPricesData] = useState([])
  const [settingsVars, setSettingsVars] = useState({})
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false)
  const [submissionId, setSubmissionId] = useState(null)

  useEffect(() => {
    async function loadPrices() {
      const [plansRes, settingsRes] = await Promise.all([
        supabase.from('plans').select('*, providers(name, adjustment_factor)'),
        supabase.from('settings').select('key, value')
      ])

      if (plansRes.error) {
        console.error('Failed to load prices:', plansRes.error)
        return
      }

      const vars = {}
      if (settingsRes.data) {
        settingsRes.data.forEach(s => { vars[s.key] = Number(s.value) })
      }
      setSettingsVars(vars)

      const flat = plansRes.data.map(plan => ({
        provider: plan.providers.name,
        adjustment_factor: plan.providers.adjustment_factor,
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
    document.querySelector('.form-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
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

    const { id, error } = await upsertSubmission(formData)
    if (!error && id) {
      setSubmissionId(id)
    } else if (error) {
      console.error('Failed to upsert submission:', error)
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
    <>
      <div className="bg-pattern"></div>
      <div className="grid-overlay"></div>

      <Nav onCtaClick={handleCtaClick} sidebarOpen={sidebarOpen} onSidebarToggle={handleSidebarToggle} />
      <Hero formData={formData} setFormData={setFormData} onFormSubmit={handleFormSubmit} />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA onCtaClick={scrollToForm} />
      <Footer />
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
      />
      <PlanDetailSidebar
        isOpen={detailSidebarOpen}
        onClose={() => setDetailSidebarOpen(false)}
        selectedPlan={selectedPlan}
        formData={formData}
        submissionId={submissionId}
      />
      <ThemeToggle darkMode={darkMode} onToggle={() => setDarkMode(prev => !prev)} />
    </>
  )
}

export default App

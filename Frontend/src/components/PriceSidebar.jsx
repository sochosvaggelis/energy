import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { resolvePlanPrice, resolvePlanNightPrice } from '../lib/formula'
import './styles/PriceSidebar.css'

// Non-linear slider: 0-500 kWh takes the first half, 500-5000 scales quadratically
const SLIDER_MAX = 1000
const SLIDER_BREAK = 500   // slider position where linear zone ends (50% of bar)
const KWH_BREAK = 500      // kWh value at that break point
const KWH_MAX = 5000

function sliderToKwh(sliderVal) {
  if (sliderVal <= SLIDER_BREAK) {
    return Math.round(sliderVal * (KWH_BREAK / SLIDER_BREAK))
  }
  const t = (sliderVal - SLIDER_BREAK) / (SLIDER_MAX - SLIDER_BREAK)
  return Math.round(KWH_BREAK + (KWH_MAX - KWH_BREAK) * t * t)
}

function kwhToSlider(kwh) {
  if (kwh <= KWH_BREAK) {
    return kwh * (SLIDER_BREAK / KWH_BREAK)
  }
  const t = Math.sqrt((kwh - KWH_BREAK) / (KWH_MAX - KWH_BREAK))
  return SLIDER_BREAK + t * (SLIDER_MAX - SLIDER_BREAK)
}

const TARIFF_FILTERS = [
  { key: 'Σταθερό Τιμολόγιο', label: 'Σταθερό', color: 'blue' },
  { key: 'Κυμαινόμενο Τιμολόγιο', label: 'Κυμαινόμενο', color: 'yellow' },
  { key: 'Ειδικό Τιμολόγιο', label: 'Ειδικό', color: 'green' },
  { key: 'Δυναμικό Τιμολόγιο', label: 'Δυναμικό', color: 'orange' },
]

const TARIFF_COLOR_MAP = Object.fromEntries(
  TARIFF_FILTERS.map(f => [f.key, { label: f.label, color: f.color }])
)

export default function PriceSidebar({ formData, setFormData, pricesData, settingsVars = {}, isOpen, onToggle, formSubmitted, onGoToForm, onPlanSelect, providersData }) {
  const [localKwh, setLocalKwh] = useState(null)
  const [localNightKwh, setLocalNightKwh] = useState(null)
  const isDragging = useRef(false)
  const isNightDragging = useRef(false)
  const [showDaySlider, setShowDaySlider] = useState(false)
  const [showNightSlider, setShowNightSlider] = useState(false)
  const dayControlRef = useRef(null)
  const nightControlRef = useRef(null)

  useEffect(() => {
    if (!showDaySlider && !showNightSlider) return
    const handleClickOutside = (e) => {
      if (showDaySlider && dayControlRef.current && !dayControlRef.current.contains(e.target)) {
        setShowDaySlider(false)
      }
      if (showNightSlider && nightControlRef.current && !nightControlRef.current.contains(e.target)) {
        setShowNightSlider(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [showDaySlider, showNightSlider])

  const kWh = localKwh !== null ? localKwh : formData.kwhConsumption
  const nightKwh = localNightKwh !== null ? localNightKwh : formData.nightKwhConsumption
  const currentProviderName = useMemo(() => {
    if (!formData.provider || formData.provider === 'unknown' || !providersData?.length) return null
    return providersData.find(p => p.id === formData.provider)?.name || null
  }, [formData.provider, providersData])

  const [activeFilters, setActiveFilters] = useState(new Set())
  const [expandedCard, setExpandedCard] = useState(null)
  const [activeTab, setActiveTab] = useState('charges')

  const handleSliderChange = useCallback((e) => {
    const val = sliderToKwh(Number(e.target.value))
    isDragging.current = true
    setLocalKwh(val)
  }, [])

  const handleSliderEnd = useCallback(() => {
    if (isDragging.current && localKwh !== null) {
      setFormData(prev => ({ ...prev, kwhConsumption: localKwh }))
      setLocalKwh(null)
      isDragging.current = false
    }
  }, [localKwh, setFormData])

  const handleNightSliderChange = useCallback((e) => {
    const val = sliderToKwh(Number(e.target.value))
    isNightDragging.current = true
    setLocalNightKwh(val)
  }, [])

  const handleNightSliderEnd = useCallback(() => {
    if (isNightDragging.current && localNightKwh !== null) {
      setFormData(prev => ({ ...prev, nightKwhConsumption: localNightKwh }))
      setLocalNightKwh(null)
      isNightDragging.current = false
    }
  }, [localNightKwh, setFormData])


  const toggleFilter = (key) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const sortedPlans = useMemo(() => {
    if (!pricesData.length || kWh === 0) return []

    return pricesData
      .filter(plan => activeFilters.size === 0 || activeFilters.has(plan.tariff_type))
      .map(plan => {
        // Merge provider adjustment_factor into variables
        const vars = { ...settingsVars }
        if (plan.adjustment_factor != null) vars.adjustment_factor = Number(plan.adjustment_factor)

        const resolvedPrice = resolvePlanPrice(plan, vars)
        const resolvedNightPrice = resolvePlanNightPrice(plan, vars)

        if (resolvedPrice == null || resolvedPrice <= 0) return null

        const nightRate = resolvedNightPrice ?? resolvedPrice
        const dayCost = resolvedPrice * kWh
        const nightCost = nightRate * nightKwh

        return {
          ...plan,
          resolved_price: resolvedPrice,
          resolved_night_price: resolvedNightPrice,
          monthlyCost: dayCost + nightCost + (plan.monthly_fee_eur ?? 0)
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.monthlyCost - b.monthlyCost)
  }, [pricesData, settingsVars, kWh, nightKwh, activeFilters])

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="sidebar-backdrop" onClick={onToggle} />}

      {/* Sidebar panel */}
      <aside className={`price-sidebar ${isOpen ? 'open' : ''}`}>
        {isOpen && <button className="sidebar-close-btn" type="button" onClick={onToggle} aria-label="Κλείσιμο sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>}
        <div className="sidebar-header">
          <h3>Σύγκριση Τιμών</h3>
          {formSubmitted && (
            <>
              <div className="sidebar-controls-row">
                <div className="sidebar-controls-left" ref={dayControlRef}>
                  <label className="sidebar-slider-label">Ημερήσια κατανάλωση:</label>
                  <div className="sidebar-kwh-input-row">
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      value={kWh}
                      onFocus={() => setShowDaySlider(true)}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(5000, Number(e.target.value) || 0))
                        setFormData(prev => ({ ...prev, kwhConsumption: val }))
                      }}
                      className="sidebar-kwh-input"
                    />
                    <span className="sidebar-kwh-unit">kWh</span>
                  </div>
                  <div className={`kwh-slider-wrapper ${showDaySlider ? 'visible' : ''}`}>
                    <input
                      type="range"
                      min="0"
                      max={SLIDER_MAX}
                      step="1"
                      value={kwhToSlider(kWh)}
                      onChange={handleSliderChange}
                      onMouseUp={handleSliderEnd}
                      onTouchEnd={handleSliderEnd}
                      className="kwh-slider"
                    />
                    <div className="slider-labels">
                      <span>0</span>
                      <span>500</span>
                      <span>5000 kWh</span>
                    </div>
                  </div>
                </div>
                <div className="sidebar-controls-left" ref={nightControlRef}>
                  <label className="sidebar-slider-label">Νυχτερινή κατανάλωση:</label>
                  <div className="sidebar-kwh-input-row">
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      value={nightKwh}
                      onFocus={() => setShowNightSlider(true)}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(5000, Number(e.target.value) || 0))
                        setFormData(prev => ({ ...prev, nightKwhConsumption: val }))
                      }}
                      className="sidebar-kwh-input"
                    />
                    <span className="sidebar-kwh-unit">kWh</span>
                  </div>
                  <div className={`kwh-slider-wrapper ${showNightSlider ? 'visible' : ''}`}>
                    <input
                      type="range"
                      min="0"
                      max={SLIDER_MAX}
                      step="1"
                      value={kwhToSlider(nightKwh)}
                      onChange={handleNightSliderChange}
                      onMouseUp={handleNightSliderEnd}
                      onTouchEnd={handleNightSliderEnd}
                      className="kwh-slider"
                    />
                    <div className="slider-labels">
                      <span>0</span>
                      <span>500</span>
                      <span>5000 kWh</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tariff-filters">
                <span className="tariff-filters-label">Φίλτρα:</span>
                {TARIFF_FILTERS.map(f => (
                  <button
                    key={f.key}
                    className={`tariff-filter-btn tariff-${f.color} ${activeFilters.has(f.key) ? 'active' : ''}`}
                    onClick={() => toggleFilter(f.key)}
                  >
                    {activeFilters.has(f.key) && <span className="tariff-filter-check">✓</span>}
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sidebar-content">
          {!formSubmitted ? (
            <div className="sidebar-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p>Συμπλήρωσε τη φόρμα για να συγκρίνεις τιμές παρόχων</p>
              <button className="sidebar-goto-form-btn" type="button" onClick={() => { onGoToForm?.(); onToggle() }}>
                Πήγαινε στη φόρμα
              </button>
            </div>
          ) : kWh === 0 ? (
            <div className="sidebar-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <p>Μετακίνησε το slider παραπάνω για να δεις τιμές</p>
            </div>
          ) : (
            <div className="plans-list">
              {sortedPlans.map((plan, index) => {
                const tariff = TARIFF_COLOR_MAP[plan.tariff_type]
                const cardKey = `${plan.provider}-${plan.plan}-${index}`
                const isExpanded = expandedCard === cardKey
                return (
                  <div
                    key={cardKey}
                    className={`plan-card ${index < 3 ? 'top-plan' : ''} ${isExpanded ? 'expanded' : ''}`}
                  >
                    <div className="plan-card-inner">
                      <div className="plan-card-content">
                        <div
                          className="plan-card-top"
                          onClick={() => {
                            setExpandedCard(isExpanded ? null : cardKey)
                            setActiveTab('charges')
                          }}
                        >
                          <div className="plan-rank">#{index + 1}</div>
                          <div className="plan-info">
                            <span className="plan-provider">{plan.provider}</span>
                            <span className="plan-name">{plan.plan}</span>
                            {tariff && (
                              <span className={`plan-tariff-badge tariff-badge-${tariff.color}`}>
                                {tariff.label}
                              </span>
                            )}
                          </div>
                          <div className="plan-cost">
                            <span className="cost-value">{plan.monthlyCost.toFixed(2)}&euro; <span className="cost-label">/μήνα</span></span>
                          </div>
                        </div>
                        <div className="plan-card-bottom">
                          <div className="plan-details">
                            <span>{plan.resolved_price.toFixed(4)} €/kWh</span>
                            <span className="plan-detail-sep">·</span>
                            <span>Πάγιο: {(plan.monthly_fee_eur ?? 0).toFixed(2)}€</span>
                          </div>
                          <button className="plan-select-btn" type="button" onClick={() => onPlanSelect?.(plan)}>Με ενδιαφέρει</button>
                        </div>
                      </div>
                      <div className="plan-chevron-col" onClick={() => { setExpandedCard(isExpanded ? null : cardKey); setActiveTab('charges') }}>
                        <svg className={`plan-chevron ${isExpanded ? 'open' : ''}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                    <div className={`plan-expanded-wrapper ${isExpanded ? 'open' : ''}`}>
                      <div className="plan-expanded">
                        <div className="plan-expanded-tabs">
                          <button
                            type="button"
                            className={`plan-tab-btn ${activeTab === 'charges' ? 'active' : ''}`}
                            onClick={() => setActiveTab('charges')}
                          >
                            Αναλυτική Χρέωση
                          </button>
                          <button
                            type="button"
                            className={`plan-tab-btn ${activeTab === 'provider' ? 'active' : ''}`}
                            onClick={() => setActiveTab('provider')}
                          >
                            Πληροφορίες Προμηθευτή
                          </button>
                        </div>
                        <div className="plan-expanded-content">
                          {activeTab === 'charges' ? (
                            <ul className="plan-charges-list">
                              <li>
                                <span className="charge-label">Ημερήσια χρέωση</span>
                                <span className="charge-value">{plan.resolved_price.toFixed(4)} €/kWh</span>
                              </li>
                              {plan.resolved_night_price != null && (
                                <li>
                                  <span className="charge-label">Νυχτερινή χρέωση</span>
                                  <span className="charge-value">{plan.resolved_night_price.toFixed(4)} €/kWh</span>
                                </li>
                              )}
                              <li>
                                <span className="charge-label">Πάγιο</span>
                                <span className="charge-value">{(plan.monthly_fee_eur ?? 0).toFixed(2)} €/μήνα</span>
                              </li>
                            </ul>
                          ) : (
                            <p className="plan-expanded-placeholder">Πληροφορίες προμηθευτή...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

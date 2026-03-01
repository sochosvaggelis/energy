import { useState } from 'react'
import './styles/PlanDetailSidebar.css'

import idFront from '../assets/idFront.svg'
import idBack from '../assets/idBack.svg'
import powerMeter from '../assets/powerMeter.svg'
import deiLogo from '../assets/deiLogo.svg'
import enerwaveLogo from '../assets/enerwaveLogo.svg'
import eyniceLogo from '../assets/eyniceLogo.svg'
import hrwnLogo from '../assets/hrwnLogo.svg'
import protergiaLogo from '../assets/protergiaLogo.svg'
import zenithLogo from '../assets/zenithLogo.svg'

const PROVIDER_LOGOS = {
  'ΔΕΗ': deiLogo,
  'ENERWAVE': enerwaveLogo,
  'EUNICE': eyniceLogo,
  'ΗΡΩΝ': hrwnLogo,
  'PROTERGIA': protergiaLogo,
  'ΖΕΝΙΘ': zenithLogo,
}

function getProviderLogo(name) {
  if (!name) return null
  const upper = name.toUpperCase()
  for (const [key, logo] of Object.entries(PROVIDER_LOGOS)) {
    if (upper.includes(key) || key.includes(upper)) return logo
  }
  return null
}

const SECTIONS = [
  { title: 'Στοιχεία Προγράμματος', step: 0 },
  { title: 'Καταχώρηση Στοιχείων', step: 1 },
  { title: 'Επισύναψη Αρχείων', step: 2 },
  { title: 'Υποβολή', step: 3 },
]

export default function PlanDetailSidebar({ isOpen, onClose, selectedPlan }) {
  const [activeStep, setActiveStep] = useState(0)
  const [detailForm, setDetailForm] = useState({
    afm: '',
    doy: '',
    pagiaEntoli: false,
    allagiOnomatos: false,
    idpiothsia: '',
  })
  const [files, setFiles] = useState({
    tautotitaPiso: null,
    tautotitaMprosta: null,
    metritis: null,
    logariasmosPiso: null,
    logariasmosMprosta: null,
    misthotirio: null,
  })

  const isStep1Valid = detailForm.afm.trim() !== '' &&
    detailForm.doy.trim() !== '' &&
    detailForm.idpiothsia !== ''

  const isStep2Valid = files.tautotitaPiso !== null &&
    files.tautotitaMprosta !== null &&
    files.metritis !== null &&
    files.logariasmosPiso !== null &&
    files.logariasmosMprosta !== null &&
    files.misthotirio !== null

  const handleFileChange = (field) => (e) => {
    const file = e.target.files?.[0] || null
    setFiles(prev => ({ ...prev, [field]: file }))
  }

  const handleNext = () => {
    if (activeStep === 1 && !isStep1Valid) return
    if (activeStep === 2 && !isStep2Valid) return
    if (activeStep < SECTIONS.length - 1) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1)
    }
  }

  const handleClose = () => {
    setActiveStep(0)
    onClose()
  }

  return (
    <>
      {isOpen && <div className="detail-sidebar-backdrop" onClick={handleClose} />}

      <aside className={`detail-sidebar ${isOpen ? 'open' : ''}`}>
        {isOpen && (
          <button className="detail-sidebar-close-btn" type="button" onClick={handleClose} aria-label="Κλείσιμο">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div className="detail-sidebar-inner">
        <div className="detail-sidebar-header">
          <h3>Επισύναψη Εγγράφων</h3>
        </div>

        <div className="detail-sidebar-content">
          {SECTIONS.map(({ title, step }) => {
            const isActive = step === activeStep
            const isCompleted = step < activeStep
            const isLocked = step > activeStep

            return (
              <div
                key={step}
                className={`detail-section ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}`}
              >
                <div className="detail-section-header">
                  <div className="detail-section-step">
                    {isCompleted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      step + 1
                    )}
                  </div>
                  <h4 className="detail-section-title">{title}</h4>
                </div>

                <div className="detail-section-body">
                  {step === 0 && selectedPlan && (
                    <div className="detail-plan-summary">
                      <div className="detail-plan-info">
                        <div className="detail-plan-row">
                          <span className="detail-plan-label">Υπηρεσία:</span>
                          <span className="detail-plan-value">{selectedPlan.tariff_type}</span>
                        </div>
                        <div className="detail-plan-row">
                          <span className="detail-plan-label">Όνομα πακέτου:</span>
                          <span className="detail-plan-value">{selectedPlan.plan}</span>
                        </div>
                        <div className="detail-plan-row">
                          <span className="detail-plan-label">Όνομα παρόχου:</span>
                          <span className="detail-plan-value">{selectedPlan.provider}</span>
                        </div>
                      </div>
                      <div className="detail-plan-logo">
                        {getProviderLogo(selectedPlan.provider) ? (
                          <img src={getProviderLogo(selectedPlan.provider)} alt={selectedPlan.provider} />
                        ) : (
                          <span className="detail-plan-logo-fallback">{selectedPlan.provider.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="detail-form">
                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Προσωπικά Στοιχεία</h5>
                        <div className="detail-form-group">
                          <label>ΑΦΜ <span className="detail-required">*</span></label>
                          <input
                            type="text"
                            value={detailForm.afm}
                            onChange={(e) => setDetailForm(prev => ({ ...prev, afm: e.target.value }))}
                            placeholder="Εισάγετε ΑΦΜ"
                            required
                          />
                        </div>
                        <div className="detail-form-group">
                          <label>ΔΟΥ <span className="detail-required">*</span></label>
                          <input
                            type="text"
                            value={detailForm.doy}
                            onChange={(e) => setDetailForm(prev => ({ ...prev, doy: e.target.value }))}
                            placeholder="Εισάγετε ΔΟΥ"
                            required
                          />
                        </div>
                        <div className="detail-form-group detail-form-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              checked={detailForm.pagiaEntoli}
                              onChange={(e) => setDetailForm(prev => ({ ...prev, pagiaEntoli: e.target.checked }))}
                            />
                            Πληρωμή με πάγια εντολή
                          </label>
                        </div>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Στοιχεία Παροχής Ρεύματος</h5>
                        <div className="detail-form-group detail-form-checkbox">
                          <label>
                            <input
                              type="checkbox"
                              checked={detailForm.allagiOnomatos}
                              onChange={(e) => setDetailForm(prev => ({ ...prev, allagiOnomatos: e.target.checked }))}
                            />
                            Αλλαγή στο όνομα έκδοσης λογαριασμού
                          </label>
                        </div>
                        <div className="detail-form-group">
                          <label>Ιδιότητα <span className="detail-required">*</span></label>
                          <div className="detail-form-options">
                            {['Ιδιοκτήτης', 'Διαχειριστής', 'Ενοικιαστής'].map(option => (
                              <button
                                key={option}
                                type="button"
                                className={`detail-form-option-btn ${detailForm.idpiothsia === option ? 'active' : ''}`}
                                onClick={() => setDetailForm(prev => ({ ...prev, idpiothsia: option }))}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="detail-form">
                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Ταυτότητα / Διαβατήριο</h5>
                        <div className="detail-upload-row">
                          <label className={`detail-upload-card ${files.tautotitaMprosta ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf" onChange={handleFileChange('tautotitaMprosta')} />
                            <img src={idFront} alt="Μπροστά όψη" className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label">
                              {files.tautotitaMprosta ? files.tautotitaMprosta.name : 'Μπροστά όψη'}
                            </span>
                          </label>
                          <label className={`detail-upload-card ${files.tautotitaPiso ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf" onChange={handleFileChange('tautotitaPiso')} />
                            <img src={idBack} alt="Πίσω όψη" className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label">
                              {files.tautotitaPiso ? files.tautotitaPiso.name : 'Πίσω όψη'}
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Μετρητής</h5>
                        <label className={`detail-upload-card ${files.metritis ? 'has-file' : ''}`}>
                          <input type="file" accept="image/*" onChange={handleFileChange('metritis')} />
                          <img src={powerMeter} alt="Μετρητής" className="detail-upload-card-icon" />
                          <span className="detail-upload-card-label">
                            {files.metritis ? files.metritis.name : 'Φωτογραφία μετρητή & ενδείξεων'}
                          </span>
                        </label>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Τελευταίος Λογαριασμός</h5>
                        <div className="detail-upload-row">
                          <div className="detail-upload-field">
                            <label>Μπροστά όψη <span className="detail-required">*</span></label>
                            <label className={`detail-upload-btn ${files.logariasmosMprosta ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf" onChange={handleFileChange('logariasmosMprosta')} />
                              {files.logariasmosMprosta ? files.logariasmosMprosta.name : 'Επιλογή αρχείου'}
                            </label>
                          </div>
                          <div className="detail-upload-field">
                            <label>Πίσω όψη <span className="detail-required">*</span></label>
                            <label className={`detail-upload-btn ${files.logariasmosPiso ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf" onChange={handleFileChange('logariasmosPiso')} />
                              {files.logariasmosPiso ? files.logariasmosPiso.name : 'Επιλογή αρχείου'}
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">
                          {detailForm.idpiothsia === 'Ιδιοκτήτης' ? 'Ε9' : 'Μισθωτήριο'}
                        </h5>
                        <div className="detail-upload-field">
                          <label>
                            {detailForm.idpiothsia === 'Ιδιοκτήτης' ? 'Αρχείο Ε9' : 'Αρχείο μισθωτηρίου'} <span className="detail-required">*</span>
                          </label>
                          <label className={`detail-upload-btn ${files.misthotirio ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf" onChange={handleFileChange('misthotirio')} />
                            {files.misthotirio ? files.misthotirio.name : 'Επιλογή αρχείου'}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <p className="detail-section-placeholder">Επιβεβαίωση & υποβολή...</p>
                  )}

                  {!isLocked && (
                    <div className="detail-section-actions">
                      {step > 0 && (
                        <button
                          className="detail-back-btn"
                          type="button"
                          onClick={handleBack}
                          disabled={!isActive}
                        >
                          Πίσω
                        </button>
                      )}
                      {step < SECTIONS.length - 1 && (
                        <div className="detail-next-wrapper">
                          <button
                            className="detail-next-btn"
                            type="button"
                            onClick={handleNext}
                            disabled={!isActive || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                          >
                            Επόμενο
                          </button>
                          {isActive && ((step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)) && (
                            <span className="detail-next-tooltip">
                              {step === 1
                                ? 'Συμπλήρωσε όλα τα υποχρεωτικά πεδία (*)'
                                : 'Ανέβασε όλα τα απαιτούμενα αρχεία (*)'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </aside>
    </>
  )
}

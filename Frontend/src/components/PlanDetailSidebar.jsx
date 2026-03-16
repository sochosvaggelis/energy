import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { findSubmissionByContact } from '../lib/submissions'
import './styles/PlanDetailSidebar.css'

import idFront from '../assets/idFront.svg'
import idBack from '../assets/idBack.svg'
import powerMeter from '../assets/powerMeter.svg'
import billFront from '../assets/billFront.svg'

const UploadIcon = () => (
  <svg className="upload-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

function isImageFile(file) {
  if (file.type.startsWith('image/')) return true
  const ext = file.name.split('.').pop().toLowerCase()
  return ['png', 'jpg', 'jpeg'].includes(ext)
}

function FilePreviewItem({ file, onRemove }) {
  const url = useMemo(() => {
    if (!file || !isImageFile(file)) return null
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [url])

  return (
    <div className="file-preview">
      {url && <img src={url} alt={file.name} className="file-preview-thumb" />}
      <span className="file-preview-name">{file.name}</span>
      <button type="button" className="file-preview-remove" onClick={onRemove} aria-label="Αφαίρεση">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function FilePreviewList({ files, field, onRemove }) {
  if (!files.length) return null
  return (
    <div className="file-preview-list">
      {files.map((file, i) => (
        <FilePreviewItem key={`${file.name}-${i}`} file={file} onRemove={() => onRemove(field, i)} />
      ))}
    </div>
  )
}

function YesNoToggle({ label, value, onChange, options }) {
  const opts = options || [
    { label: 'Ναι', value: true },
    { label: 'Όχι', value: false },
  ]
  return (
    <div className="detail-form-group detail-form-inline">
      <label>{label}</label>
      <div className="detail-yesno-row">
        {opts.map(opt => (
          <button
            key={String(opt.value)}
            type="button"
            className={`detail-yesno-btn ${value === opt.value ? 'active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const SECTIONS = [
  { title: 'Στοιχεία Προγράμματος', step: 0 },
  { title: 'Καταχώρηση Στοιχείων', step: 1 },
  { title: 'Επισύναψη Αρχείων', step: 2 },
  { title: 'Υποβολή', step: 3 },
]

export default function PlanDetailSidebar({ isOpen, onClose, selectedPlan, formData, submissionId, providersData }) {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRefs = useRef([])

  useEffect(() => {
    const el = sectionRefs.current[activeStep]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeStep])
  const [detailForm, setDetailForm] = useState({
    afm: '',
    doy: '',
    pagiaEntoli: false,
    idiotita: '',
    iban: '',
    onomaDikaiouhou: '',
    onomaTrapezas: '',
    ibanTritosProsopo: false,
    protiSyndesi: false,
    allagiOnomatos: false,
    paraxorisiTrito: false,
    energoYde: true,
    ilektrodoteitai: true,
    ofeilesPalioParoxou: false,
    tiposEpixeirisis: '',
    afmIdioktiti: '',
    onomaIdioktiti: '',
    kinitoIdioktiti: '',
    emailIdioktiti: '',
  })
  const [files, setFiles] = useState({
    logariasmos: [],
    tautotitaMprosta: [],
    tautotitaPiso: [],
    metritis: [],
    diakanonismos: [],
    pliromiTeleftaiasDosis: [],
    symvasiDeddie: [],
    ypeuthiniDilosiIban: [],
    e9: [],
    ypeuthiniDilosiParaxorisis: [],
    enarxiDrastiriotitas: [],
    katastatiko: [],
    tautotitaNomimouEkprosopou: [],
    metritisAeriou: [],
  })

  const isStep1Valid = detailForm.afm.trim() !== '' &&
    detailForm.doy.trim() !== ''

  const currentProviderName = useMemo(() => {
    if (!formData?.provider || formData.provider === 'unknown' || !providersData?.length) return null
    return providersData.find(p => p.id === formData.provider)?.name || null
  }, [formData?.provider, providersData])

  const isProfessional = formData?.customerType === 'professional' && selectedPlan?.service_type !== 'gas'

  const isProviderChange = currentProviderName &&
    selectedPlan?.provider &&
    currentProviderName.toUpperCase() !== selectedPlan.provider.toUpperCase()

  const isGas = selectedPlan?.service_type === 'gas'

  const isZenithPagia = detailForm.pagiaEntoli && selectedPlan?.provider?.toUpperCase() === 'ΖΕΝΙΘ'

  const isIdioktitisE9 = detailForm.allagiOnomatos && (!isProviderChange || isGas) && detailForm.idiotita === 'Ιδιοκτήτης'

  const isParaxorisi = isIdioktitisE9 && detailForm.paraxorisiTrito

  const isGasMetritis = selectedPlan?.service_type === 'gas' &&
    (formData?.region === 'thessaloniki' || formData?.region === 'larisa')

  const isGasEnikiasti = isGas &&
    formData?.region === 'attiki' &&
    detailForm.allagiOnomatos &&
    detailForm.idiotita === 'Ενοικιαστής'

  const hasStep2Content = isProviderChange || detailForm.protiSyndesi || isZenithPagia || isIdioktitisE9 || isParaxorisi || isGasMetritis

  const isStep2Valid = true

  const handleFileChange = (field) => (e) => {
    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length === 0) return
    setFiles(prev => ({ ...prev, [field]: [...prev[field], ...newFiles] }))
    e.target.value = ''
  }

  const removeFile = (field, index) => {
    setFiles(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
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

  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  const uploadFiles = useCallback(async (fieldFiles, folder) => {
    const results = await Promise.all(fieldFiles.map(async (file) => {
      const ext = file.name.split('.').pop()
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('uploads').upload(path, file)
      if (error) return null
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path)
      return urlData.publicUrl
    }))
    return results.filter(Boolean)
  }, [])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const folder = submissionId || `${Date.now()}_${Math.random().toString(36).slice(2)}`

      const [
        logariasmosUrls,
        tautotitaMprostaUrls, tautotitaPisoUrls,
        metritisUrls,
        diakanonismosUrls, pliromiTeleftaiasDosisUrls,
        symvasiDeddieUrls,
        ypeuthiniDilosiIbanUrls,
        e9Urls,
        ypeuthiniDilosiParaxorisisUrls,
        enarxiDrastiriotirasUrls,
        katastatikoUrls,
        tautotitaNomimouEkprosopouUrls,
        metritisAeriouUrls
      ] = await Promise.all([
        uploadFiles(files.logariasmos, `${folder}/logariasmos`),
        uploadFiles(files.tautotitaMprosta, `${folder}/tautotita_mprosta`),
        uploadFiles(files.tautotitaPiso, `${folder}/tautotita_piso`),
        uploadFiles(files.metritis, `${folder}/metritis`),
        uploadFiles(files.diakanonismos, `${folder}/diakanonismos`),
        uploadFiles(files.pliromiTeleftaiasDosis, `${folder}/pliromi_teleftaias_dosis`),
        uploadFiles(files.symvasiDeddie, `${folder}/symvasi_deddie`),
        uploadFiles(files.ypeuthiniDilosiIban, `${folder}/ypeuthini_dilosi_iban`),
        uploadFiles(files.e9, `${folder}/e9`),
        uploadFiles(files.ypeuthiniDilosiParaxorisis, `${folder}/ypeuthini_dilosi_paraxorisis`),
        uploadFiles(files.enarxiDrastiriotitas, `${folder}/enarxi_drastiriotitas`),
        uploadFiles(files.katastatiko, `${folder}/katastatiko`),
        uploadFiles(files.tautotitaNomimouEkprosopou, `${folder}/tautotita_nomimou_ekprosopou`),
        uploadFiles(files.metritisAeriou, `${folder}/metritis_aeriou`),
      ])

      const updateData = {
        selected_plan: selectedPlan ? {
          provider: selectedPlan.provider,
          plan: selectedPlan.plan,
          tariff_type: selectedPlan.tariff_type,
          price_per_kwh: selectedPlan.price_per_kwh,
          night_price_per_kwh: selectedPlan.night_price_per_kwh,
          monthly_fee_eur: selectedPlan.monthly_fee_eur,
        } : null,
        detail_form: {
          afm: detailForm.afm,
          doy: detailForm.doy,
          pagia_entoli: detailForm.pagiaEntoli,
          allagi_onomatos: detailForm.allagiOnomatos,
          idiotita: (detailForm.allagiOnomatos && (!isProviderChange || isGas)) ? detailForm.idiotita : null,
          paraxorisi_trito: isIdioktitisE9 ? detailForm.paraxorisiTrito : null,
          energo_yde: isParaxorisi ? detailForm.energoYde : null,
          ilektrodoteitai: (isParaxorisi && detailForm.energoYde === false) ? detailForm.ilektrodoteitai : null,
          iban: detailForm.pagiaEntoli ? detailForm.iban : null,
          onoma_dikaiouhou: detailForm.pagiaEntoli ? detailForm.onomaDikaiouhou : null,
          onoma_trapezas: detailForm.pagiaEntoli ? detailForm.onomaTrapezas : null,
          iban_tritos_prosopo: detailForm.pagiaEntoli ? detailForm.ibanTritosProsopo : null,
          proti_syndesi: detailForm.protiSyndesi,
          ofeiles_palio_paroxou: isProviderChange ? detailForm.ofeilesPalioParoxou : null,
          tipos_epixeirisis: isProfessional ? detailForm.tiposEpixeirisis : null,
          afm_idioktiti: isGasEnikiasti ? detailForm.afmIdioktiti : null,
          onoma_idioktiti: isGasEnikiasti ? detailForm.onomaIdioktiti : null,
          kinito_idioktiti: isGasEnikiasti ? detailForm.kinitoIdioktiti : null,
          email_idioktiti: isGasEnikiasti ? detailForm.emailIdioktiti : null,
        },
        uploaded_files: {
          logariasmos: logariasmosUrls,
          tautotita_mprosta: tautotitaMprostaUrls,
          tautotita_piso: tautotitaPisoUrls,
          metritis: metritisUrls,
          diakanonismos: diakanonismosUrls,
          pliromi_teleftaias_dosis: pliromiTeleftaiasDosisUrls,
          symvasi_deddie: symvasiDeddieUrls,
          ypeuthini_dilosi_iban: ypeuthiniDilosiIbanUrls,
          e9: e9Urls,
          ypeuthini_dilosi_paraxorisis: ypeuthiniDilosiParaxorisisUrls,
          enarxi_drastiriotitas: enarxiDrastiriotirasUrls,
          katastatiko: katastatikoUrls,
          tautotita_nomimou_ekprosopou: tautotitaNomimouEkprosopouUrls,
          metritis_aeriou: metritisAeriouUrls,
        },
      }

      let error
      if (submissionId) {
        ({ error } = await supabase
          .from('submissions')
          .update(updateData)
          .eq('id', submissionId))
      } else {
        const phone = formData.phone
        const email = formData.email || null
        const existingId = await findSubmissionByContact(phone, email)

        if (existingId) {
          ({ error } = await supabase
            .from('submissions')
            .update(updateData)
            .eq('id', existingId))
        } else {
          ({ error } = await supabase
            .from('submissions')
            .insert([{
              ...updateData,
              lead_info: {
                name: formData.name,
                phone,
                email,
                region: formData.region,
                contact_time: formData.contact_time,
              },
              electricity_info: {
                customer_type: formData.customerType,
                night_tariff: formData.nightTariff,
                social_tariff: formData.socialTariff,
                current_provider: formData.provider,
                kwh_consumption: formData.kwhConsumption,
                night_kwh_consumption: formData.nightKwhConsumption,
              },
              submitted_at: new Date().toISOString(),
            }]))
        }
      }

      if (error) throw error
      setSubmitResult('success')
    } catch (err) {
      console.error('Submit error:', err)
      setSubmitResult('error')
    } finally {
      setSubmitting(false)
    }
  }, [files, formData, selectedPlan, detailForm, submissionId, uploadFiles])

  const handleClose = () => {
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

        <div className="detail-sidebar-header">
          <h3>Επισύναψη Εγγράφων</h3>
        </div>

        <div className="detail-sidebar-inner">
        <div className="detail-sidebar-content">
          {SECTIONS.map(({ title, step }) => {
            const isActive = step === activeStep
            const isCompleted = step < activeStep
            const isLocked = step > activeStep

            return (
              <div
                key={step}
                ref={el => sectionRefs.current[step] = el}
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
                  {step === 1 && <span className="detail-accepted-formats">Αποδεκτοί όλοι οι τύποι αρχείων</span>}
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
                        {selectedPlan.provider_logo ? (
                          <img src={selectedPlan.provider_logo} alt={selectedPlan.provider} />
                        ) : (
                          <span className="detail-plan-logo-fallback">{selectedPlan.provider.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 1 && isProfessional && (
                    <div className="detail-form">
                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Προσωπικά Στοιχεία</h5>

                        <div className="detail-form-group">
                          <label>Ταυτότητα / Διαβατήριο <span className="detail-required">*</span></label>
                          <div className="detail-upload-row">
                            <div className="detail-upload-col">
                              <label className={`detail-upload-card ${files.tautotitaMprosta.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotitaMprosta')} />
                                <img src={idFront} alt="Μπροστά όψη" className="detail-upload-card-icon" />
                                <span className="detail-upload-card-label"><UploadIcon />Μπροστά όψη</span>
                              </label>
                              <FilePreviewList files={files.tautotitaMprosta} field="tautotitaMprosta" onRemove={removeFile} />
                            </div>
                            <div className="detail-upload-col">
                              <label className={`detail-upload-card ${files.tautotitaPiso.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotitaPiso')} />
                                <img src={idBack} alt="Πίσω όψη" className="detail-upload-card-icon" />
                                <span className="detail-upload-card-label"><UploadIcon />Πίσω όψη</span>
                              </label>
                              <FilePreviewList files={files.tautotitaPiso} field="tautotitaPiso" onRemove={removeFile} />
                            </div>
                          </div>
                        </div>

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
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Στοιχεία Παροχής Ρεύματος</h5>

                        {isProviderChange && (
                          <p className="detail-provider-change-note">
                            Πρόκειται για αλλαγή παρόχου.
                          </p>
                        )}

                        <div className="detail-toggle-list">
                          <YesNoToggle
                            label="Πάγια εντολή;"
                            value={detailForm.pagiaEntoli}
                            onChange={v => setDetailForm(prev => ({ ...prev, pagiaEntoli: v }))}
                          />
                          <YesNoToggle
                            label="Πρώτη σύνδεση;"
                            value={detailForm.protiSyndesi}
                            onChange={v => setDetailForm(prev => ({ ...prev, protiSyndesi: v }))}
                          />
                          {isZenithPagia && (
                            <YesNoToggle
                              label="Το IBAN ανήκει σε 3ο πρόσωπο;"
                              value={detailForm.ibanTritosProsopo}
                              onChange={v => setDetailForm(prev => ({ ...prev, ibanTritosProsopo: v }))}
                            />
                          )}
                          {isProviderChange && (
                            <YesNoToggle
                              label="Υπάρχουν οφειλές στον προηγούμενο πάροχο;"
                              value={detailForm.ofeilesPalioParoxou}
                              onChange={v => setDetailForm(prev => ({ ...prev, ofeilesPalioParoxou: v }))}
                            />
                          )}
                          <YesNoToggle
                            label="Αλλαγή ονόματος;"
                            value={detailForm.allagiOnomatos}
                            onChange={v => setDetailForm(prev => ({ ...prev, allagiOnomatos: v }))}
                          />
                        </div>
                        {detailForm.allagiOnomatos && (!isProviderChange || isGas) && (
                          <div className="detail-form-group">
                            <label>Ιδιότητα <span className="detail-required">*</span></label>
                            <div className="detail-form-options">
                              {['Ενοικιαστής', 'Ιδιοκτήτης'].map(option => (
                                <button
                                  key={option}
                                  type="button"
                                  className={`detail-form-option-btn ${detailForm.idiotita === option ? 'active' : ''}`}
                                  onClick={() => setDetailForm(prev => ({ ...prev, idiotita: option }))}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {isIdioktitisE9 && (
                          <div className="detail-toggle-list">
                            <YesNoToggle
                              label="Παραχώρηση σε 3ο άτομο;"
                              value={detailForm.paraxorisiTrito}
                              onChange={v => setDetailForm(prev => ({ ...prev, paraxorisiTrito: v }))}
                            />
                            {isParaxorisi && (
                              <YesNoToggle
                                label="Ενεργό ΥΔΕ;"
                                value={detailForm.energoYde}
                                onChange={v => setDetailForm(prev => ({ ...prev, energoYde: v }))}
                              />
                            )}
                            {isParaxorisi && detailForm.energoYde === false && (
                              <YesNoToggle
                                label="Ηλεκτροδοτείται;"
                                value={detailForm.ilektrodoteitai}
                                onChange={v => setDetailForm(prev => ({ ...prev, ilektrodoteitai: v }))}
                              />
                            )}
                          </div>
                        )}
                        <div className="detail-form-group">
                          <label>Τύπος επιχείρησης <span className="detail-required">*</span></label>
                          <div className="detail-form-options">
                            {['Ατομική', 'Εταιρία'].map(option => (
                              <button
                                key={option}
                                type="button"
                                className={`detail-form-option-btn ${detailForm.tiposEpixeirisis === option ? 'active' : ''}`}
                                onClick={() => setDetailForm(prev => ({ ...prev, tiposEpixeirisis: option }))}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && !isProfessional && (
                    <div className="detail-form">
                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Προσωπικά Στοιχεία</h5>

                        <div className="detail-form-group">
                          <label>Ταυτότητα / Διαβατήριο <span className="detail-required">*</span></label>
                          <div className="detail-upload-row">
                            <div className="detail-upload-col">
                              <label className={`detail-upload-card ${files.tautotitaMprosta.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotitaMprosta')} />
                                <img src={idFront} alt="Μπροστά όψη" className="detail-upload-card-icon" />
                                <span className="detail-upload-card-label"><UploadIcon />Μπροστά όψη</span>
                              </label>
                              <FilePreviewList files={files.tautotitaMprosta} field="tautotitaMprosta" onRemove={removeFile} />
                            </div>
                            <div className="detail-upload-col">
                              <label className={`detail-upload-card ${files.tautotitaPiso.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotitaPiso')} />
                                <img src={idBack} alt="Πίσω όψη" className="detail-upload-card-icon" />
                                <span className="detail-upload-card-label"><UploadIcon />Πίσω όψη</span>
                              </label>
                              <FilePreviewList files={files.tautotitaPiso} field="tautotitaPiso" onRemove={removeFile} />
                            </div>
                          </div>
                        </div>

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

                        <div className="detail-form-group">
                          <label>Φωτογραφία λογαριασμού</label>
                          <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                            <img src={billFront} alt="Λογαριασμός" className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />Όλες οι σελίδες</span>
                          </label>
                          <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} />
                        </div>

                        <div className="detail-form-group">
                          <label>Φωτογραφία μετρητή</label>
                          <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritis')} />
                            <img src={powerMeter} alt="Μετρητής" className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />Φωτογραφία μετρητή & ενδείξεων</span>
                          </label>
                          <FilePreviewList files={files.metritis} field="metritis" onRemove={removeFile} />
                        </div>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Στοιχεία Παροχής Ρεύματος</h5>

                        <div className="detail-toggle-list">
                          <YesNoToggle
                            label="Πρώτη σύνδεση;"
                            value={detailForm.protiSyndesi}
                            onChange={v => setDetailForm(prev => ({ ...prev, protiSyndesi: v }))}
                          />
                          <YesNoToggle
                            label="Πάγια εντολή;"
                            value={detailForm.pagiaEntoli}
                            onChange={v => setDetailForm(prev => ({ ...prev, pagiaEntoli: v }))}
                          />
                          {isZenithPagia && (
                            <YesNoToggle
                              label="Το IBAN ανήκει σε 3ο πρόσωπο;"
                              value={detailForm.ibanTritosProsopo}
                              onChange={v => setDetailForm(prev => ({ ...prev, ibanTritosProsopo: v }))}
                            />
                          )}
                          <YesNoToggle
                            label="Αλλαγή ονόματος;"
                            value={detailForm.allagiOnomatos}
                            onChange={v => setDetailForm(prev => ({ ...prev, allagiOnomatos: v }))}
                          />
                          {isProviderChange && (
                            <YesNoToggle
                              label="Υπάρχουν οφειλές στον προηγούμενο πάροχο;"
                              value={detailForm.ofeilesPalioParoxou}
                              onChange={v => setDetailForm(prev => ({ ...prev, ofeilesPalioParoxou: v }))}
                            />
                          )}
                        </div>
                      </div>

                      {detailForm.allagiOnomatos && (!isProviderChange || isGas) && (
                        <div className="detail-form-subsection">
                          <div className="detail-form-group">
                            <label>Ιδιότητα <span className="detail-required">*</span></label>
                            <div className="detail-form-options">
                              {['Ενοικιαστής', 'Ιδιοκτήτης'].map(option => (
                                <button
                                  key={option}
                                  type="button"
                                  className={`detail-form-option-btn ${detailForm.idiotita === option ? 'active' : ''}`}
                                  onClick={() => setDetailForm(prev => ({ ...prev, idiotita: option }))}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                          {isIdioktitisE9 && (
                            <div className="detail-toggle-list">
                              <YesNoToggle
                                label="Παραχώρηση σε 3ο άτομο;"
                                value={detailForm.paraxorisiTrito}
                                onChange={v => setDetailForm(prev => ({ ...prev, paraxorisiTrito: v }))}
                              />
                              {isParaxorisi && (
                                <YesNoToggle
                                  label="Ενεργό ΥΔΕ;"
                                  value={detailForm.energoYde}
                                  onChange={v => setDetailForm(prev => ({ ...prev, energoYde: v }))}
                                />
                              )}
                              {isParaxorisi && detailForm.energoYde === false && (
                                <YesNoToggle
                                  label="Ηλεκτροδοτείται;"
                                  value={detailForm.ilektrodoteitai}
                                  onChange={v => setDetailForm(prev => ({ ...prev, ilektrodoteitai: v }))}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && isProfessional && (
                    <div className="detail-form">
                      {isProviderChange && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Φωτογραφία λογαριασμού <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                              <img src={billFront} alt="Λογαριασμός" className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />Όλες οι σελίδες</span>
                            </label>
                            <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Φωτογραφία μετρητή <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritis')} />
                              <img src={powerMeter} alt="Μετρητής" className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />Φωτογραφία μετρητή & ενδείξεων</span>
                            </label>
                            <FilePreviewList files={files.metritis} field="metritis" onRemove={removeFile} />
                          </div>
                        </>
                      )}
                      {isProviderChange && detailForm.ofeilesPalioParoxou && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Διακανονισμός <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.diakanonismos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('diakanonismos')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.diakanonismos} field="diakanonismos" onRemove={removeFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Πληρωμή τελευταίας δόσης <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.pliromiTeleftaiasDosis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('pliromiTeleftaiasDosis')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.pliromiTeleftaiasDosis} field="pliromiTeleftaiasDosis" onRemove={removeFile} />
                          </div>
                        </>
                      )}
                      {detailForm.tiposEpixeirisis === 'Ατομική' && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Έναρξη δραστηριότητας <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.enarxiDrastiriotitas.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('enarxiDrastiriotitas')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.enarxiDrastiriotitas} field="enarxiDrastiriotitas" onRemove={removeFile} />
                        </div>
                      )}
                      {detailForm.tiposEpixeirisis === 'Εταιρία' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Καταστατικό <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.katastatiko.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('katastatiko')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.katastatiko} field="katastatiko" onRemove={removeFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ταυτότητα νόμιμου εκπροσώπου <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.tautotitaNomimouEkprosopou.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotitaNomimouEkprosopou')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.tautotitaNomimouEkprosopou} field="tautotitaNomimouEkprosopou" onRemove={removeFile} />
                          </div>
                        </>
                      )}
                      {detailForm.protiSyndesi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Σύμβαση με ΔΕΔΔΗΕ <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.symvasiDeddie.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('symvasiDeddie')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.symvasiDeddie} field="symvasiDeddie" onRemove={removeFile} />
                        </div>
                      )}
                      {isZenithPagia && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Στοιχεία Πάγιας Εντολής</h5>
                          <div className="detail-form-group">
                            <label>IBAN <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.iban}
                              onChange={e => setDetailForm(prev => ({ ...prev, iban: e.target.value }))}
                              placeholder="GR00 0000 0000 0000 0000 0000 000"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Όνομα δικαιούχου <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaDikaiouhou}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaDikaiouhou: e.target.value }))}
                              placeholder="Εισάγετε όνομα δικαιούχου"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Όνομα τράπεζας <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaTrapezas}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaTrapezas: e.target.value }))}
                              placeholder="Εισάγετε όνομα τράπεζας"
                            />
                          </div>
                          {detailForm.ibanTritosProsopo && (
                            <div className="detail-form-group">
                              <label>Υπεύθυνη δήλωση IBAN <span className="detail-required">*</span></label>
                              <label className={`detail-upload-card ${files.ypeuthiniDilosiIban.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiIban')} />
                                <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                              </label>
                              <FilePreviewList files={files.ypeuthiniDilosiIban} field="ypeuthiniDilosiIban" onRemove={removeFile} />
                            </div>
                          )}
                        </div>
                      )}
                      {isIdioktitisE9 && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Ε9 <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.e9.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('e9')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.e9} field="e9" onRemove={removeFile} />
                        </div>
                      )}
                      {isParaxorisi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Υπεύθυνη δήλωση παραχώρησης <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.ypeuthiniDilosiParaxorisis.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiParaxorisis')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.ypeuthiniDilosiParaxorisis} field="ypeuthiniDilosiParaxorisis" onRemove={removeFile} />
                        </div>
                      )}
                      {!detailForm.tiposEpixeirisis && (
                        <p className="detail-step2-empty">
                          Επίλεξε τύπο επιχείρησης στο προηγούμενο βήμα.
                        </p>
                      )}
                    </div>
                  )}

                  {step === 2 && !isProfessional && (
                    <div className="detail-form">
                      {!hasStep2Content && (
                        <p className="detail-step2-empty">
                          Δεν απαιτούνται επιπλέον έγγραφα. Προχώρα στην υποβολή για να επικοινωνήσει μαζί σου ένας εκπρόσωπός μας.
                        </p>
                      )}

                      {/* Αλλαγή Παρόχου → λογαριασμός + μετρητής */}
                      {isProviderChange && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Φωτογραφία λογαριασμού <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                              <img src={billFront} alt="Λογαριασμός" className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />Όλες οι σελίδες</span>
                            </label>
                            <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Φωτογραφία μετρητή <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritis')} />
                              <img src={powerMeter} alt="Μετρητής" className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />Φωτογραφία μετρητή & ενδείξεων</span>
                            </label>
                            <FilePreviewList files={files.metritis} field="metritis" onRemove={removeFile} />
                          </div>
                        </>
                      )}

                      {/* Αλλαγή Παρόχου + Οφειλές → διακανονισμός + πληρωμή τελευταίας δόσης */}
                      {isProviderChange && detailForm.ofeilesPalioParoxou && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Διακανονισμός <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.diakanonismos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('diakanonismos')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.diakanonismos} field="diakanonismos" onRemove={removeFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Πληρωμή τελευταίας δόσης <span className="detail-required">*</span></h5>
                            <label className={`detail-upload-card ${files.pliromiTeleftaiasDosis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('pliromiTeleftaiasDosis')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.pliromiTeleftaiasDosis} field="pliromiTeleftaiasDosis" onRemove={removeFile} />
                          </div>
                        </>
                      )}

                      {/* Πάγια εντολή + ΖΕΝΙΘ → IBAN, δικαιούχος, τράπεζα */}
                      {isZenithPagia && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Στοιχεία Πάγιας Εντολής</h5>
                          <div className="detail-form-group">
                            <label>IBAN <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.iban}
                              onChange={e => setDetailForm(prev => ({ ...prev, iban: e.target.value }))}
                              placeholder="GR00 0000 0000 0000 0000 0000 000"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Όνομα δικαιούχου <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaDikaiouhou}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaDikaiouhou: e.target.value }))}
                              placeholder="Εισάγετε όνομα δικαιούχου"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Όνομα τράπεζας <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaTrapezas}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaTrapezas: e.target.value }))}
                              placeholder="Εισάγετε όνομα τράπεζας"
                            />
                          </div>
                          {detailForm.ibanTritosProsopo && (
                            <div className="detail-form-group">
                              <label>Υπεύθυνη δήλωση IBAN <span className="detail-required">*</span></label>
                              <label className={`detail-upload-card ${files.ypeuthiniDilosiIban.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiIban')} />
                                <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                              </label>
                              <FilePreviewList files={files.ypeuthiniDilosiIban} field="ypeuthiniDilosiIban" onRemove={removeFile} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Πρώτη σύνδεση → σύμβαση με ΔΕΔΔΗΕ */}
                      {detailForm.protiSyndesi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Σύμβαση με ΔΕΔΔΗΕ <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.symvasiDeddie.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('symvasiDeddie')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.symvasiDeddie} field="symvasiDeddie" onRemove={removeFile} />
                        </div>
                      )}

                      {/* Ιδιοκτήτης (αλλαγή ονόματος, όχι αλλαγή παρόχου) → Ε9 */}
                      {isIdioktitisE9 && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Ε9 <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.e9.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('e9')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.e9} field="e9" onRemove={removeFile} />
                        </div>
                      )}

                      {/* Παραχώρηση σε 3ο άτομο → υπεύθυνη δήλωση παραχώρησης */}
                      {isParaxorisi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Υπεύθυνη δήλωση παραχώρησης <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.ypeuthiniDilosiParaxorisis.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiParaxorisis')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.ypeuthiniDilosiParaxorisis} field="ypeuthiniDilosiParaxorisis" onRemove={removeFile} />
                        </div>
                      )}

                      {/* Αέριο + Θεσσαλονίκη/Θεσσαλία → μετρητής αερίου */}
                      {isGasMetritis && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Φωτογραφία μετρητή αερίου <span className="detail-required">*</span></h5>
                          <label className={`detail-upload-card ${files.metritisAeriou.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritisAeriou')} />
                            <img src={powerMeter} alt="Μετρητής αερίου" className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />Φωτογραφία μετρητή αερίου</span>
                          </label>
                          <FilePreviewList files={files.metritisAeriou} field="metritisAeriou" onRemove={removeFile} />
                        </div>
                      )}

                      {/* Αέριο + Ενοικιαστής + Αττική → στοιχεία ιδιοκτήτη */}
                      {isGasEnikiasti && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Στοιχεία Ιδιοκτήτη</h5>
                          <div className="detail-form-group">
                            <label>ΑΦΜ ιδιοκτήτη <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.afmIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, afmIdioktiti: e.target.value }))}
                              placeholder="Εισάγετε ΑΦΜ ιδιοκτήτη"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Ονοματεπώνυμο ιδιοκτήτη <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaIdioktiti: e.target.value }))}
                              placeholder="Εισάγετε ονοματεπώνυμο ιδιοκτήτη"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Κινητό ιδιοκτήτη <span className="detail-required">*</span></label>
                            <input
                              type="tel"
                              value={detailForm.kinitoIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, kinitoIdioktiti: e.target.value }))}
                              placeholder="69xxxxxxxx"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>Email ιδιοκτήτη <span className="detail-required">*</span></label>
                            <input
                              type="email"
                              value={detailForm.emailIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, emailIdioktiti: e.target.value }))}
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {step === 3 && (
                    <div className="detail-submit-section">
                      {submitResult === 'success' ? (
                        <div className="detail-submit-success">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          <p>Η αίτησή σου υποβλήθηκε επιτυχώς!</p>
                        </div>
                      ) : submitResult === 'error' ? (
                        <div className="detail-submit-error">
                          <p>Κάτι πήγε στραβά. Δοκίμασε ξανά.</p>
                          <button type="button" className="detail-next-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Υποβολή...' : 'Δοκίμασε ξανά'}
                          </button>
                        </div>
                      ) : (
                        <div className="detail-submit-ready">
                          <p className="detail-submit-text">Είσαι έτοιμος! Πάτα υποβολή για να ολοκληρώσεις την αίτησή σου.</p>
                          <button type="button" className="detail-next-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Υποβολή...' : 'Υποβολή Αίτησης'}
                          </button>
                        </div>
                      )}
                    </div>
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

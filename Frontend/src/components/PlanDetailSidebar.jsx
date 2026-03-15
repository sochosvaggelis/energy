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

export default function PlanDetailSidebar({ isOpen, onClose, selectedPlan, formData, submissionId }) {
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
    yparxeiMetritis: false,
    eisaiIdioktitis: false,
    paroxiStatus: 'energi',
    idpiothsia: '',
    yparxounOfeiles: false,
    idiosOfeiletis: false,
    eidikoTimologio: false,
    nyxterino: false,
    ligmeniYde: false,
    allagiIsxyos: false,
    pagiaEntoli: false,
    afmIdioktiti: '',
  })
  const [files, setFiles] = useState({
    logariasmos: [],
    tautotitaMprosta: [],
    tautotitaPiso: [],
    metritis: [],
    titlosIdioktisias: [],
    oikodomikiAdeia: [],
    dilosiTetragonikon: [],
    ilektrologikoMisthotirio: [],
    lixiarxikiPraxiThanatou: [],
    pistopoiitikoEgyteronSygenon: [],
    pistopoiitikoMiApopoiisis: [],
    e9: [],
    epiveveiosiArithmouParoxis: [],
    yde: [],
    ilektrologikoSxedio: [],
    apodeixiPliromisSyndesis: [],
    e2e9: [],
    ypeuthiniDilosiIdioktiti: [],
    tautotitaIdioktiti: [],
    apodeixiPliromis: [],
    misthotirioTitlos: [],
    ypeuthiniDilosiMiSxesis: [],
  })

  const isStep1Valid = detailForm.afm.trim() !== '' &&
    detailForm.doy.trim() !== '' &&
    detailForm.idpiothsia !== ''

  const PROVIDER_KEY_TO_NAME = {
    'dei': 'ΔΕΗ',
    'enerwave': 'ENERWAVE',
    'eynice': 'EUNICE',
    'hron': 'ΗΡΩΝ',
    'protergia': 'PROTERGIA',
    'zenith': 'ΖΕΝΙΘ',
  }

  const isProviderChange = formData?.provider &&
    formData.provider !== 'unknown' &&
    selectedPlan?.provider &&
    PROVIDER_KEY_TO_NAME[formData.provider]?.toUpperCase() !== selectedPlan.provider.toUpperCase()

  const hasStep2Content =
    detailForm.paroxiStatus === 'anenregi' ||
    detailForm.idpiothsia === 'Ενοικιαστής' ||
    detailForm.idpiothsia === 'Κληρονόμος' ||
    detailForm.idpiothsia === 'Ιδιοκτήτης' ||
    detailForm.idpiothsia === 'Δωρεάν Παραχώρηση' ||
    detailForm.yparxounOfeiles

  const isStep2Valid = true

  const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']

  const handleFileChange = (field) => (e) => {
    const newFiles = Array.from(e.target.files || []).filter(f => ALLOWED_TYPES.includes(f.type))
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
        ilektrologikoMisthotirioUrls,
        lixiarxikiPraxiThanatouUrls, pistopoiitikoEgyteronSygenonUrls,
        pistopoiitikoMiApopoiisisUrls, e9Urls,
        epiveveiosiArithmouParoxisUrls,
        titlosIdioktisiasUrls, oikodomikiAdeiaUrls,
        dilosiTetragonikonUrls, ydeUrls,
        ilektrologikoSxedioUrls, apodeixiPliromisSyndesisUrls
      ] = await Promise.all([
        uploadFiles(files.logariasmos, `${folder}/logariasmos`),
        uploadFiles(files.tautotitaMprosta, `${folder}/tautotita_mprosta`),
        uploadFiles(files.tautotitaPiso, `${folder}/tautotita_piso`),
        uploadFiles(files.metritis, `${folder}/metritis`),
        uploadFiles(files.ilektrologikoMisthotirio, `${folder}/ilektrologiko_misthotirio`),
        uploadFiles(files.lixiarxikiPraxiThanatou, `${folder}/lixiarxiki_praxi_thanatou`),
        uploadFiles(files.pistopoiitikoEgyteronSygenon, `${folder}/pistopoiitiko_egyteron_sygenon`),
        uploadFiles(files.pistopoiitikoMiApopoiisis, `${folder}/pistopoiitiko_mi_apopoiisis`),
        uploadFiles(files.e9, `${folder}/e9`),
        uploadFiles(files.epiveveiosiArithmouParoxis, `${folder}/epiveveiosi_arithmou_paroxis`),
        uploadFiles(files.titlosIdioktisias, `${folder}/titlos_idioktisias`),
        uploadFiles(files.oikodomikiAdeia, `${folder}/oikodomiki_adeia`),
        uploadFiles(files.dilosiTetragonikon, `${folder}/dilosi_tetragonikon`),
        uploadFiles(files.yde, `${folder}/yde`),
        uploadFiles(files.ilektrologikoSxedio, `${folder}/ilektrologiko_sxedio`),
        uploadFiles(files.apodeixiPliromisSyndesis, `${folder}/apodeixi_pliromis_syndesis`),
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
          yparxei_metritis: detailForm.yparxeiMetritis,
          eisai_idioktitis: !detailForm.yparxeiMetritis ? detailForm.eisaiIdioktitis : null,
          paroxi_status: detailForm.paroxiStatus,
          idpiothsia: detailForm.idpiothsia,
          yparxoun_ofeiles: detailForm.yparxounOfeiles,
          idios_ofeiletis: detailForm.yparxounOfeiles ? detailForm.idiosOfeiletis : null,
          eidiko_timologio: detailForm.eidikoTimologio,
          nyxterino: detailForm.nyxterino,
          ligmeni_yde: detailForm.idpiothsia === 'Ενοικιαστής' ? detailForm.ligmeniYde : null,
          allagi_isxyos: detailForm.allagiIsxyos,
          pagia_entoli: detailForm.pagiaEntoli,
        },
        uploaded_files: {
          logariasmos: logariasmosUrls,
          tautotita_mprosta: tautotitaMprostaUrls,
          tautotita_piso: tautotitaPisoUrls,
          metritis: metritisUrls,
          ilektrologiko_misthotirio: ilektrologikoMisthotirioUrls,
          lixiarxiki_praxi_thanatou: lixiarxikiPraxiThanatouUrls,
          pistopoiitiko_egyteron_sygenon: pistopoiitikoEgyteronSygenonUrls,
          pistopoiitiko_mi_apopoiisis: pistopoiitikoMiApopoiisisUrls,
          e9: e9Urls,
          epiveveiosi_arithmou_paroxis: epiveveiosiArithmouParoxisUrls,
          titlos_idioktisias: titlosIdioktisiasUrls,
          oikodomiki_adeia: oikodomikiAdeiaUrls,
          dilosi_tetragonikon: dilosiTetragonikonUrls,
          yde: ydeUrls,
          ilektrologiko_sxedio: ilektrologikoSxedioUrls,
          apodeixi_pliromis_syndesis: apodeixiPliromisSyndesisUrls,
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
                  {step === 2 && (
                    <span className="detail-section-hint">
                      Τα παρακάτω πεδία είναι προαιρετικά. Επισυνάψτε ό,τι έχετε διαθέσιμο — για τα υπόλοιπα θα επικοινωνήσει μαζί σας ο εκπρόσωπός μας.
                    </span>
                  )}
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

                  {step === 1 && (
                    <div className="detail-form">
                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">Προσωπικά Στοιχεία</h5>

                        <div className="detail-form-group">
                          <label>Ταυτότητα / Διαβατήριο <span className="detail-required">*</span></label>
                          <div className="detail-upload-row">
                            <div className="detail-upload-col">
                              <label className={`detail-upload-card ${files.tautotitaMprosta.length ? 'has-file' : ''}`}>
                                <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('tautotitaMprosta')} />
                                <img src={idFront} alt="Μπροστά όψη" className="detail-upload-card-icon" />
                                <span className="detail-upload-card-label"><UploadIcon />Μπροστά όψη</span>
                              </label>
                              <FilePreviewList files={files.tautotitaMprosta} field="tautotitaMprosta" onRemove={removeFile} />
                            </div>
                            <div className="detail-upload-col">
                              <label className={`detail-upload-card ${files.tautotitaPiso.length ? 'has-file' : ''}`}>
                                <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('tautotitaPiso')} />
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
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('logariasmos')} />
                            <img src={billFront} alt="Λογαριασμός" className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />Όλες οι σελίδες</span>
                          </label>
                          <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} />
                        </div>

                        <div className="detail-form-group">
                          <label>Φωτογραφία μετρητή</label>
                          <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('metritis')} />
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
                            label="Υπάρχει μετρητής;"
                            value={detailForm.yparxeiMetritis}
                            onChange={v => setDetailForm(prev => ({ ...prev, yparxeiMetritis: v }))}
                          />
                          <YesNoToggle
                            label="Ενεργή Παροχή:"
                            value={detailForm.paroxiStatus}
                            onChange={v => setDetailForm(prev => ({ ...prev, paroxiStatus: v }))}
                            options={[
                              { label: 'Ναι', value: 'energi' },
                              { label: 'Όχι', value: 'anenregi' },
                            ]}
                          />
                          <YesNoToggle
                            label="Υπάρχουν οφειλές;"
                            value={detailForm.yparxounOfeiles}
                            onChange={v => setDetailForm(prev => ({ ...prev, yparxounOfeiles: v }))}
                          />
                          {detailForm.yparxounOfeiles === true && (
                            <YesNoToggle
                              label="Ίδιος οφειλέτης;"
                              value={detailForm.idiosOfeiletis}
                              onChange={v => setDetailForm(prev => ({ ...prev, idiosOfeiletis: v }))}
                            />
                          )}
                          <YesNoToggle
                            label="Ειδικό τιμολόγιο;"
                            value={detailForm.eidikoTimologio}
                            onChange={v => setDetailForm(prev => ({ ...prev, eidikoTimologio: v }))}
                          />
                          <YesNoToggle
                            label="Νυχτερινό;"
                            value={detailForm.nyxterino}
                            onChange={v => setDetailForm(prev => ({ ...prev, nyxterino: v }))}
                          />
                          <YesNoToggle
                            label="Αλλαγή ισχύος;"
                            value={detailForm.allagiIsxyos}
                            onChange={v => setDetailForm(prev => ({ ...prev, allagiIsxyos: v }))}
                          />
                          <YesNoToggle
                            label="Πάγια εντολή;"
                            value={detailForm.pagiaEntoli}
                            onChange={v => setDetailForm(prev => ({ ...prev, pagiaEntoli: v }))}
                          />
                        </div>

                        <div className="detail-form-group">
                          <label>Ιδιότητα <span className="detail-required">*</span></label>
                          <div className="detail-form-options">
                            {['Ενοικιαστής', 'Κληρονόμος', 'Ιδιοκτήτης', 'Δωρεάν Παραχώρηση'].map(option => (
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
                      {!hasStep2Content && (
                        <p className="detail-step2-empty">
                          Δεν απαιτούνται επιπλέον έγγραφα. Προχώρα στην υποβολή για να επικοινωνήσει μαζί σου ένας εκπρόσωπός μας.
                        </p>
                      )}

                      {/* Ανενεργή παροχή → επιβεβαίωση αριθμού παροχής + ΥΔΕ */}
                      {detailForm.paroxiStatus === 'anenregi' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Επιβεβαίωση αριθμού παροχής</h5>
                            <label className={`detail-upload-card ${files.epiveveiosiArithmouParoxis.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('epiveveiosiArithmouParoxis')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.epiveveiosiArithmouParoxis} field="epiveveiosiArithmouParoxis" onRemove={removeFile} />
                          </div>

                          {detailForm.idpiothsia !== 'Ενοικιαστής' && detailForm.idpiothsia !== 'Ιδιοκτήτης' && (
                            <div className="detail-form-subsection">
                              <h5 className="detail-form-subtitle">ΥΔΕ</h5>
                              <label className={`detail-upload-card ${files.yde.length ? 'has-file' : ''}`}>
                                <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('yde')} />
                                <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                              </label>
                              <FilePreviewList files={files.yde} field="yde" onRemove={removeFile} />
                            </div>
                          )}
                        </>
                      )}

                      {/* Ενοικιαστής → μισθωτήριο, ληγμένη ΥΔΕ */}
                      {detailForm.idpiothsia === 'Ενοικιαστής' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ηλεκτρολογικό μισθωτήριο σε ισχύ</h5>
                            <label className={`detail-upload-card ${files.ilektrologikoMisthotirio.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('ilektrologikoMisthotirio')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.ilektrologikoMisthotirio} field="ilektrologikoMisthotirio" onRemove={removeFile} />
                          </div>

                          <YesNoToggle
                            label="Ληγμένη ΥΔΕ;"
                            value={detailForm.ligmeniYde}
                            onChange={v => setDetailForm(prev => ({ ...prev, ligmeniYde: v }))}
                          />

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{detailForm.ligmeniYde ? 'Νέα ΥΔΕ (με συναίνεση ιδιοκτήτη)' : 'ΥΔΕ'}</h5>
                            <label className={`detail-upload-card ${files.yde.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('yde')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.yde} field="yde" onRemove={removeFile} />
                          </div>
                        </>
                      )}

                      {/* Κληρονόμος */}
                      {detailForm.idpiothsia === 'Κληρονόμος' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ληξιαρχική πράξη θανάτου</h5>
                            <label className={`detail-upload-card ${files.lixiarxikiPraxiThanatou.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('lixiarxikiPraxiThanatou')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.lixiarxikiPraxiThanatou} field="lixiarxikiPraxiThanatou" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Πιστοποιητικό εγγυτέρων συγγενών</h5>
                            <label className={`detail-upload-card ${files.pistopoiitikoEgyteronSygenon.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('pistopoiitikoEgyteronSygenon')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.pistopoiitikoEgyteronSygenon} field="pistopoiitikoEgyteronSygenon" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Πιστοποιητικό μη αποποίησης</h5>
                            <label className={`detail-upload-card ${files.pistopoiitikoMiApopoiisis.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('pistopoiitikoMiApopoiisis')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.pistopoiitikoMiApopoiisis} field="pistopoiitikoMiApopoiisis" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ε9</h5>
                            <label className={`detail-upload-card ${files.e9.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('e9')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.e9} field="e9" onRemove={removeFile} />
                          </div>
                        </>
                      )}

                      {/* Ιδιοκτήτης → τίτλος/Ε9 + ληγμένη ΥΔΕ */}
                      {detailForm.idpiothsia === 'Ιδιοκτήτης' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Τίτλος ιδιοκτησίας / Ε9</h5>
                            <label className={`detail-upload-card ${files.titlosIdioktisias.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('titlosIdioktisias')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.titlosIdioktisias} field="titlosIdioktisias" onRemove={removeFile} />
                          </div>

                          <YesNoToggle
                            label="Ληγμένη ΥΔΕ;"
                            value={detailForm.ligmeniYde}
                            onChange={v => setDetailForm(prev => ({ ...prev, ligmeniYde: v }))}
                          />

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{detailForm.ligmeniYde ? 'Νέα ΥΔΕ (με συναίνεση ιδιοκτήτη)' : 'ΥΔΕ'}</h5>
                            <label className={`detail-upload-card ${files.yde.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('yde')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.yde} field="yde" onRemove={removeFile} />
                          </div>
                        </>
                      )}

                      {/* Χωρίς μετρητή + Ιδιοκτήτης → νέα σύνδεση (επιπλέον πεδία) */}
                      {detailForm.yparxeiMetritis === false && detailForm.idpiothsia === 'Ιδιοκτήτης' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Οικοδομική άδεια</h5>
                            <label className={`detail-upload-card ${files.oikodomikiAdeia.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('oikodomikiAdeia')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.oikodomikiAdeia} field="oikodomikiAdeia" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Δήλωση τετραγωνικών</h5>
                            <label className={`detail-upload-card ${files.dilosiTetragonikon.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('dilosiTetragonikon')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.dilosiTetragonikon} field="dilosiTetragonikon" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ηλεκτρολογικό σχέδιο</h5>
                            <label className={`detail-upload-card ${files.ilektrologikoSxedio.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('ilektrologikoSxedio')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.ilektrologikoSxedio} field="ilektrologikoSxedio" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Απόδειξη πληρωμής κόστους σύνδεσης</h5>
                            <label className={`detail-upload-card ${files.apodeixiPliromisSyndesis.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('apodeixiPliromisSyndesis')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.apodeixiPliromisSyndesis} field="apodeixiPliromisSyndesis" onRemove={removeFile} />
                          </div>
                        </>
                      )}

                      {/* Δωρεάν Παραχώρηση */}
                      {detailForm.idpiothsia === 'Δωρεάν Παραχώρηση' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ε2 / Ε9</h5>
                            <label className={`detail-upload-card ${files.e2e9.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('e2e9')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.e2e9} field="e2e9" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Υπεύθυνη δήλωση ιδιοκτήτη</h5>
                            <label className={`detail-upload-card ${files.ypeuthiniDilosiIdioktiti.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('ypeuthiniDilosiIdioktiti')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.ypeuthiniDilosiIdioktiti} field="ypeuthiniDilosiIdioktiti" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Ταυτότητα ιδιοκτήτη</h5>
                            <label className={`detail-upload-card ${files.tautotitaIdioktiti.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('tautotitaIdioktiti')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.tautotitaIdioktiti} field="tautotitaIdioktiti" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-group">
                            <label>ΑΦΜ ιδιοκτήτη</label>
                            <input
                              type="text"
                              value={detailForm.afmIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, afmIdioktiti: e.target.value }))}
                              placeholder="Εισάγετε ΑΦΜ ιδιοκτήτη"
                            />
                          </div>
                        </>
                      )}

                      {/* Οφειλές + ίδιος οφειλέτης → απόδειξη πληρωμής */}
                      {detailForm.yparxounOfeiles && detailForm.idiosOfeiletis && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">Απόδειξη πληρωμής / διακανονισμού</h5>
                          <label className={`detail-upload-card ${files.apodeixiPliromis.length ? 'has-file' : ''}`}>
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('apodeixiPliromis')} />
                            <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                          </label>
                          <FilePreviewList files={files.apodeixiPliromis} field="apodeixiPliromis" onRemove={removeFile} />
                        </div>
                      )}

                      {/* Οφειλές + ΟΧΙ ίδιος οφειλέτης → μισθωτήριο/τίτλος + υπεύθυνη δήλωση */}
                      {detailForm.yparxounOfeiles && !detailForm.idiosOfeiletis && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Μισθωτήριο / Τίτλος ιδιοκτησίας</h5>
                            <label className={`detail-upload-card ${files.misthotirioTitlos.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('misthotirioTitlos')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.misthotirioTitlos} field="misthotirioTitlos" onRemove={removeFile} />
                          </div>

                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">Υπεύθυνη δήλωση μη σχέσης με τον οφειλέτη</h5>
                            <label className={`detail-upload-card ${files.ypeuthiniDilosiMiSxesis.length ? 'has-file' : ''}`}>
                              <input type="file" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleFileChange('ypeuthiniDilosiMiSxesis')} />
                              <span className="detail-upload-card-label"><UploadIcon />Επιλογή αρχείων</span>
                            </label>
                            <FilePreviewList files={files.ypeuthiniDilosiMiSxesis} field="ypeuthiniDilosiMiSxesis" onRemove={removeFile} />
                          </div>
                        </>
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

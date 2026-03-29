import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'
import { upsertSubmission } from '../lib/submissions'
import './styles/PlanDetailSidebar.css'

import idFront from '../assets/idFront.svg'
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

function isPdfFile(file) {
  if (file.type === 'application/pdf') return true
  return file.name.split('.').pop().toLowerCase() === 'pdf'
}

const PdfIcon = () => (
  <svg className="file-preview-thumb file-preview-pdf-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <text x="12" y="17" textAnchor="middle" fill="currentColor" stroke="none" fontSize="6" fontWeight="bold">PDF</text>
  </svg>
)

function FilePreviewItem({ file, onRemove, onPreview }) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(null)
  const isImage = isImageFile(file)
  const isPdf = isPdfFile(file)

  useEffect(() => {
    if (!file || !isImage) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file, isImage])

  return (
    <div className="file-preview" onClick={onPreview} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onPreview()}>
      {url && <img src={url} alt={file.name} className="file-preview-thumb" />}
      {isPdf && <PdfIcon />}
      <span className="file-preview-name">{file.name}</span>
      <button type="button" className="file-preview-remove" onClick={e => { e.stopPropagation(); onRemove() }} aria-label={t('common.remove')}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

function FilePreviewModal({ file, onClose }) {
  const [url, setUrl] = useState(null)
  const isImage = file && isImageFile(file)
  const isPdf = file && isPdfFile(file)

  useEffect(() => {
    if (!file) return
    const handleKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [file, onClose])

  useEffect(() => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  if (!file || !url) return null

  return (
    <div className="file-preview-modal-overlay" onClick={onClose}>
      <div className="file-preview-modal" onClick={e => e.stopPropagation()}>
        <button type="button" className="file-preview-modal-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="file-preview-modal-filename">{file.name}</div>
        <div className="file-preview-modal-content">
          {isImage && <img src={url} alt={file.name} className="file-preview-modal-image" />}
          {isPdf && <iframe src={url} title={file.name} className="file-preview-modal-pdf" />}
        </div>
      </div>
    </div>
  )
}

function FilePreviewList({ files, field, onRemove, onPreview }) {
  if (!files.length) return null
  return (
    <div className="file-preview-list">
      {files.map((file, i) => (
        <FilePreviewItem key={`${file.name}-${i}`} file={file} onRemove={() => onRemove(field, i)} onPreview={() => onPreview(file)} />
      ))}
    </div>
  )
}

function YesNoToggle({ label, value, onChange, options }) {
  const { t } = useTranslation()
  const opts = options || [
    { label: t('common.yes'), value: true },
    { label: t('common.no'), value: false },
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

const SECTION_KEYS = [
  { titleKey: 'detail.programDetails', step: 0 },
  { titleKey: 'detail.enterDetails', step: 1 },
  { titleKey: 'detail.attachFiles', step: 2 },
  { titleKey: 'detail.submission', step: 3 },
]

const IDIOTITA_OPTIONS = [
  { value: 'Ενοικιαστής', labelKey: 'detail.tenant' },
  { value: 'Ιδιοκτήτης', labelKey: 'detail.owner' },
]

const BUSINESS_TYPE_OPTIONS = [
  { value: 'Ατομική', labelKey: 'detail.individual' },
  { value: 'Εταιρία', labelKey: 'detail.company' },
]

export default function PlanDetailSidebar({ isOpen, onClose, selectedPlan, formData, submissionId, providersData }) {
  const { t } = useTranslation()
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
    tautotita: [],
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

  const currentProviderName = useMemo(() => {
    if (!formData?.provider || formData.provider === 'unknown' || !providersData?.length) return null
    return providersData.find(p => p.id === formData.provider)?.name || null
  }, [formData?.provider, providersData])

  const isProfessional = formData?.customerType === 'professional' && selectedPlan?.service_type !== 'gas'

  const isProviderChange = currentProviderName &&
    selectedPlan?.provider &&
    currentProviderName.toUpperCase() !== selectedPlan.provider.toUpperCase()

  const isGas = selectedPlan?.service_type === 'gas'

  const afmValid = (() => {
    const afm = detailForm.afm.trim()
    if (!/^\d{9}$/.test(afm)) return false
    // Greek AFM mod-11 checksum
    let sum = 0
    for (let i = 0; i < 8; i++) sum += parseInt(afm[i]) * (1 << (8 - i))
    return (sum % 11 % 10) === parseInt(afm[8])
  })()
  const isStep1Valid =
    afmValid &&
    detailForm.doy.trim() !== '' &&
    files.tautotita.length > 0 &&
    files.logariasmos.length > 0 &&
    (!isProfessional || detailForm.tiposEpixeirisis !== '') &&
    (!(detailForm.allagiOnomatos && (!isProviderChange || isGas)) || detailForm.idiotita !== '')

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

  const isStep2Valid = (() => {
    // --- Zenith standing-order fields ---
    if (isZenithPagia) {
      const ibanClean = detailForm.iban.replace(/\s/g, '')
      if (!/^GR\d{25}$/.test(ibanClean)) return false
      // IBAN mod-97 checksum: move first 4 chars to end, convert letters to numbers, check mod 97 === 1
      const rearranged = ibanClean.slice(4) + ibanClean.slice(0, 4)
      const numeric = rearranged.replace(/[A-Z]/g, ch => (ch.charCodeAt(0) - 55).toString())
      let remainder = numeric.match(/.{1,7}/g).reduce((acc, chunk) => BigInt(acc + chunk) % 97n, 0n)
      if (remainder !== 1n) return false
      if (!detailForm.onomaDikaiouhou.trim()) return false
      if (!detailForm.onomaTrapezas.trim()) return false
      if (detailForm.ibanTritosProsopo && files.ypeuthiniDilosiIban.length === 0) return false
    }

    // --- Gas tenant owner details ---
    if (isGasEnikiasti) {
      if (!/^\d{9}$/.test(detailForm.afmIdioktiti.trim())) return false
      if (!detailForm.onomaIdioktiti.trim()) return false
      if (!/^69\d{8}$/.test(detailForm.kinitoIdioktiti.trim())) return false
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detailForm.emailIdioktiti.trim())) return false
    }

    // --- Required uploads based on visible step-2 sections ---
    if (isProviderChange && detailForm.ofeilesPalioParoxou) {
      if (files.diakanonismos.length === 0) return false
      if (files.pliromiTeleftaiasDosis.length === 0) return false
    }
    if (detailForm.protiSyndesi && files.symvasiDeddie.length === 0) return false
    if (isIdioktitisE9 && files.e9.length === 0) return false
    if (isParaxorisi && files.ypeuthiniDilosiParaxorisis.length === 0) return false
    if (isGasMetritis && files.metritisAeriou.length === 0) return false

    // --- Professional business-type uploads ---
    if (isProfessional) {
      if (detailForm.tiposEpixeirisis === 'Ατομική' && files.enarxiDrastiriotitas.length === 0) return false
      if (detailForm.tiposEpixeirisis === 'Εταιρία') {
        if (files.katastatiko.length === 0) return false
        if (files.tautotitaNomimouEkprosopou.length === 0) return false
      }
    }

    return true
  })()

  const MAX_FILES_PER_FIELD = 5
  const MAX_FILE_SIZE_MB = 10
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
  const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'
  ]
  const [fileError, setFileError] = useState(null)

  const handleFileChange = (field) => (e) => {
    const newFiles = Array.from(e.target.files || [])
    if (newFiles.length === 0) return
    setFileError(null)

    const invalidType = newFiles.find(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return !ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(f.type)
    })
    if (invalidType) {
      setFileError(t('detail.invalidFileType'))
      e.target.value = ''
      return
    }

    const oversized = newFiles.find(f => f.size > MAX_FILE_SIZE_BYTES)
    if (oversized) {
      setFileError(t('detail.fileTooLarge', { max: MAX_FILE_SIZE_MB }))
      e.target.value = ''
      return
    }

    setFiles(prev => {
      const current = prev[field]
      const remaining = MAX_FILES_PER_FIELD - current.length
      if (remaining <= 0) {
        setFileError(t('detail.tooManyFiles', { max: MAX_FILES_PER_FIELD }))
        return prev
      }
      const toAdd = newFiles.slice(0, remaining)
      if (toAdd.length < newFiles.length) {
        setFileError(t('detail.tooManyFiles', { max: MAX_FILES_PER_FIELD }))
      }
      return { ...prev, [field]: [...current, ...toAdd] }
    })
    e.target.value = ''
  }

  const [previewFile, setPreviewFile] = useState(null)

  const removeFile = (field, index) => {
    setFiles(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
  }

  const handleNext = () => {
    if (activeStep === 1 && !isStep1Valid) return
    if (activeStep === 2 && !isStep2Valid) return
    if (activeStep < SECTION_KEYS.length - 1) {
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
  const [uploadWarning, setUploadWarning] = useState(null)

  const uploadFiles = useCallback(async (fieldFiles, folder) => {
    const results = await Promise.all(fieldFiles.map(async (file) => {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { url: null, failed: true, name: file.name }
      }
      const path = `${folder}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('uploads').upload(path, file)
      if (error) {
        if (import.meta.env.DEV) console.error(`Upload failed for ${file.name}:`, error)
        return { url: null, failed: true, name: file.name }
      }
      return { url: path, failed: false, name: file.name }
    }))
    const failedFiles = results.filter(r => r.failed).map(r => r.name)
    const urls = results.filter(r => !r.failed).map(r => r.url)
    return { urls, failedFiles }
  }, [])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setSubmitResult(null)
    setUploadWarning(null)
    try {
      const folder = submissionId || crypto.randomUUID()

      const [
        logariasmosResult,
        tautotitaResult,
        metritisResult,
        diakanonismosResult, pliromiTeleftaiasDosisResult,
        symvasiDeddieResult,
        ypeuthiniDilosiIbanResult,
        e9Result,
        ypeuthiniDilosiParaxorisisResult,
        enarxiDrastiriotirasResult,
        katastatikoResult,
        tautotitaNomimouEkprosopouResult,
        metritisAeriouResult
      ] = await Promise.all([
        uploadFiles(files.logariasmos, `${folder}/logariasmos`),
        uploadFiles(files.tautotita, `${folder}/tautotita`),
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

      // Collect all failed file names
      const allResults = [
        logariasmosResult, tautotitaResult, metritisResult,
        diakanonismosResult, pliromiTeleftaiasDosisResult,
        symvasiDeddieResult, ypeuthiniDilosiIbanResult,
        e9Result, ypeuthiniDilosiParaxorisisResult,
        enarxiDrastiriotirasResult, katastatikoResult,
        tautotitaNomimouEkprosopouResult, metritisAeriouResult
      ]
      const allFailedFiles = allResults.flatMap(r => r.failedFiles)
      if (allFailedFiles.length > 0) {
        setUploadWarning(t('detail.uploadPartialWarning', { count: allFailedFiles.length }))
      }

      // Extract URL arrays
      const logariasmosUrls = logariasmosResult.urls
      const tautotitaUrls = tautotitaResult.urls
      const metritisUrls = metritisResult.urls
      const diakanonismosUrls = diakanonismosResult.urls
      const pliromiTeleftaiasDosisUrls = pliromiTeleftaiasDosisResult.urls
      const symvasiDeddieUrls = symvasiDeddieResult.urls
      const ypeuthiniDilosiIbanUrls = ypeuthiniDilosiIbanResult.urls
      const e9Urls = e9Result.urls
      const ypeuthiniDilosiParaxorisisUrls = ypeuthiniDilosiParaxorisisResult.urls
      const enarxiDrastiriotirasUrls = enarxiDrastiriotirasResult.urls
      const katastatikoUrls = katastatikoResult.urls
      const tautotitaNomimouEkprosopouUrls = tautotitaNomimouEkprosopouResult.urls
      const metritisAeriouUrls = metritisAeriouResult.urls

      const updateData = {
        selected_plan: selectedPlan ? {
          provider: selectedPlan.provider,
          plan: selectedPlan.plan,
          tariff_type: selectedPlan.tariff_type,
          price_per_kwh: selectedPlan.resolved_price ?? selectedPlan.price_per_kwh,
          night_price_per_kwh: selectedPlan.resolved_night_price ?? selectedPlan.night_price_per_kwh,
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
          tautotita: tautotitaUrls,
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

      // Ensure submission exists (upsert via RPC)
      let targetId = submissionId
      if (!targetId) {
        const { id, error: upsertErr } = await upsertSubmission(formData, providersData)
        if (upsertErr) throw upsertErr
        targetId = id
      }

      // Update details via RPC (bypasses RLS safely)
      const { error } = await supabase.rpc('update_submission_details', {
        p_id: targetId,
        p_selected_plan: updateData.selected_plan,
        p_detail_form: updateData.detail_form,
        p_uploaded_files: updateData.uploaded_files,
      })

      if (error) throw error
      setSubmitResult('success')
    } catch (err) {
      if (import.meta.env.DEV) console.error('Submit error:', err)
      setSubmitResult('error')
    } finally {
      setSubmitting(false)
    }
  }, [files, formData, selectedPlan, detailForm, submissionId, uploadFiles, t])

  const handleClose = () => {
    onClose()
  }

  return (
    <>
      {isOpen && <div className="detail-sidebar-backdrop" onClick={handleClose} />}

      <aside className={`detail-sidebar ${isOpen ? 'open' : ''}`}>
        {isOpen && (
          <button className="detail-sidebar-close-btn" type="button" onClick={handleClose} aria-label={t('common.close')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <div className="detail-sidebar-header">
          <h3>{t('detail.attachDocuments')}</h3>
        </div>

        <div className="detail-sidebar-inner">
        <div className="detail-sidebar-content">
          <div className="steps-info-box">
            <div className="steps-info-title">{t('form.stepsTitle')}</div>
            <div className="steps-timeline">
              <div className="steps-timeline-item">
                <div className="steps-timeline-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <span className="steps-timeline-text">{t('form.stepsStep1')}</span>
              </div>
              <div className="steps-timeline-divider" />
              <div className="steps-timeline-item">
                <div className="steps-timeline-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="steps-timeline-text">{t('form.stepsStep2')}</span>
              </div>
              <div className="steps-timeline-divider" />
              <div className="steps-timeline-item">
                <div className="steps-timeline-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="steps-timeline-text">{t('form.stepsStep3')}</span>
              </div>
            </div>
          </div>
          {SECTION_KEYS.map(({ titleKey, step }) => {
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
                  <h4 className="detail-section-title">{t(titleKey)}</h4>
                  {step === 1 && <span className="detail-accepted-formats">{t('detail.fileLimitsHint', { maxFiles: MAX_FILES_PER_FIELD, maxSize: MAX_FILE_SIZE_MB })}</span>}
                </div>

                {step === 1 && fileError && (
                  <div className="detail-file-error" onClick={() => setFileError(null)}>
                    {fileError}
                  </div>
                )}

                <div className="detail-section-body">
                  {step === 0 && selectedPlan && (
                    <div className="detail-plan-summary">
                      <div className="detail-plan-info">
                        <div className="detail-plan-row">
                          <span className="detail-plan-label">{t('detail.service')}</span>
                          <span className="detail-plan-value">{selectedPlan.tariff_type}</span>
                        </div>
                        <div className="detail-plan-row">
                          <span className="detail-plan-label">{t('detail.packageName')}</span>
                          <span className="detail-plan-value">{selectedPlan.plan}</span>
                        </div>
                        <div className="detail-plan-row">
                          <span className="detail-plan-label">{t('detail.providerName')}</span>
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
                        <h5 className="detail-form-subtitle">{t('detail.personalInfo')}</h5>

                        <div className="detail-form-group">
                          <label>{t('detail.idPassport')} <span className="detail-required">*</span></label>
                          <label className={`detail-upload-card ${files.tautotita.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotita')} />
                            <img src={idFront} alt={t('detail.idPassport')} className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.frontAndBack')}</span>
                          </label>
                          <FilePreviewList files={files.tautotita} field="tautotita" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.afm')} <span className="detail-required">*</span></label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{9}"
                            maxLength={9}
                            value={detailForm.afm}
                            onChange={(e) => setDetailForm(prev => ({ ...prev, afm: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                            placeholder={t('detail.afmPlaceholder')}
                            required
                          />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.doy')} <span className="detail-required">*</span></label>
                          <input
                            type="text"
                            value={detailForm.doy}
                            onChange={(e) => setDetailForm(prev => ({ ...prev, doy: e.target.value }))}
                            placeholder={t('detail.doyPlaceholder')}
                            required
                          />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.billPhoto')} <span className="detail-required">*</span></label>
                          <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                            <img src={billFront} alt={t('detail.billPhoto')} className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.allPages')}</span>
                          </label>
                          <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">{t('detail.electricityDetails')}</h5>

                        {isProviderChange && (
                          <p className="detail-provider-change-note">
                            {t('detail.providerChange')}
                          </p>
                        )}

                        <div className="detail-toggle-list">
                          <YesNoToggle
                            label={t('detail.standingOrder')}
                            value={detailForm.pagiaEntoli}
                            onChange={v => setDetailForm(prev => ({ ...prev, pagiaEntoli: v }))}
                          />
                          <YesNoToggle
                            label={t('detail.firstConnection')}
                            value={detailForm.protiSyndesi}
                            onChange={v => setDetailForm(prev => ({ ...prev, protiSyndesi: v }))}
                          />
                          {isZenithPagia && (
                            <YesNoToggle
                              label={t('detail.ibanThirdParty')}
                              value={detailForm.ibanTritosProsopo}
                              onChange={v => setDetailForm(prev => ({ ...prev, ibanTritosProsopo: v }))}
                            />
                          )}
                          {isProviderChange && (
                            <YesNoToggle
                              label={t('detail.previousDebts')}
                              value={detailForm.ofeilesPalioParoxou}
                              onChange={v => setDetailForm(prev => ({ ...prev, ofeilesPalioParoxou: v }))}
                            />
                          )}
                          <YesNoToggle
                            label={t('detail.nameChange')}
                            value={detailForm.allagiOnomatos}
                            onChange={v => setDetailForm(prev => ({ ...prev, allagiOnomatos: v }))}
                          />
                        </div>
                        {detailForm.allagiOnomatos && (!isProviderChange || isGas) && (
                          <div className="detail-form-group">
                            <label>{t('detail.status')} <span className="detail-required">*</span></label>
                            <div className="detail-form-options">
                              {IDIOTITA_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`detail-form-option-btn ${detailForm.idiotita === opt.value ? 'active' : ''}`}
                                  onClick={() => setDetailForm(prev => ({ ...prev, idiotita: opt.value }))}
                                >
                                  {t(opt.labelKey)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {isIdioktitisE9 && (
                          <div className="detail-toggle-list">
                            <YesNoToggle
                              label={t('detail.thirdPartyAssignment')}
                              value={detailForm.paraxorisiTrito}
                              onChange={v => setDetailForm(prev => ({ ...prev, paraxorisiTrito: v }))}
                            />
                            {isParaxorisi && (
                              <YesNoToggle
                                label={t('detail.activeUde')}
                                value={detailForm.energoYde}
                                onChange={v => setDetailForm(prev => ({ ...prev, energoYde: v }))}
                              />
                            )}
                            {isParaxorisi && detailForm.energoYde === false && (
                              <YesNoToggle
                                label={t('detail.electrified')}
                                value={detailForm.ilektrodoteitai}
                                onChange={v => setDetailForm(prev => ({ ...prev, ilektrodoteitai: v }))}
                              />
                            )}
                          </div>
                        )}
                        <div className="detail-form-group">
                          <label>{t('detail.businessType')} <span className="detail-required">*</span></label>
                          <div className="detail-form-options">
                            {BUSINESS_TYPE_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`detail-form-option-btn ${detailForm.tiposEpixeirisis === opt.value ? 'active' : ''}`}
                                onClick={() => setDetailForm(prev => ({ ...prev, tiposEpixeirisis: opt.value }))}
                              >
                                {t(opt.labelKey)}
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
                        <h5 className="detail-form-subtitle">{t('detail.personalInfo')}</h5>

                        <div className="detail-form-group">
                          <label>{t('detail.idPassport')} <span className="detail-required">*</span></label>
                          <label className={`detail-upload-card ${files.tautotita.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotita')} />
                            <img src={idFront} alt={t('detail.idPassport')} className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.frontAndBack')}</span>
                          </label>
                          <FilePreviewList files={files.tautotita} field="tautotita" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.afm')} <span className="detail-required">*</span></label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="\d{9}"
                            maxLength={9}
                            value={detailForm.afm}
                            onChange={(e) => setDetailForm(prev => ({ ...prev, afm: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                            placeholder={t('detail.afmPlaceholder')}
                            required
                          />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.doy')} <span className="detail-required">*</span></label>
                          <input
                            type="text"
                            value={detailForm.doy}
                            onChange={(e) => setDetailForm(prev => ({ ...prev, doy: e.target.value }))}
                            placeholder={t('detail.doyPlaceholder')}
                            required
                          />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.billPhoto')} <span className="detail-required">*</span></label>
                          <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                            <img src={billFront} alt={t('detail.billPhoto')} className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.allPages')}</span>
                          </label>
                          <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>

                        <div className="detail-form-group">
                          <label>{t('detail.meterPhoto')}</label>
                          <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritis')} />
                            <img src={powerMeter} alt={t('detail.meterPhoto')} className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />{t('detail.meterAndReadings')}</span>
                          </label>
                          <FilePreviewList files={files.metritis} field="metritis" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      </div>

                      <div className="detail-form-subsection">
                        <h5 className="detail-form-subtitle">{t('detail.electricityDetails')}</h5>

                        <div className="detail-toggle-list">
                          <YesNoToggle
                            label={t('detail.firstConnection')}
                            value={detailForm.protiSyndesi}
                            onChange={v => setDetailForm(prev => ({ ...prev, protiSyndesi: v }))}
                          />
                          <YesNoToggle
                            label={t('detail.standingOrder')}
                            value={detailForm.pagiaEntoli}
                            onChange={v => setDetailForm(prev => ({ ...prev, pagiaEntoli: v }))}
                          />
                          {isZenithPagia && (
                            <YesNoToggle
                              label={t('detail.ibanThirdParty')}
                              value={detailForm.ibanTritosProsopo}
                              onChange={v => setDetailForm(prev => ({ ...prev, ibanTritosProsopo: v }))}
                            />
                          )}
                          <YesNoToggle
                            label={t('detail.nameChange')}
                            value={detailForm.allagiOnomatos}
                            onChange={v => setDetailForm(prev => ({ ...prev, allagiOnomatos: v }))}
                          />
                          {isProviderChange && (
                            <YesNoToggle
                              label={t('detail.previousDebts')}
                              value={detailForm.ofeilesPalioParoxou}
                              onChange={v => setDetailForm(prev => ({ ...prev, ofeilesPalioParoxou: v }))}
                            />
                          )}
                        </div>
                      </div>

                      {detailForm.allagiOnomatos && (!isProviderChange || isGas) && (
                        <div className="detail-form-subsection">
                          <div className="detail-form-group">
                            <label>{t('detail.status')} <span className="detail-required">*</span></label>
                            <div className="detail-form-options">
                              {IDIOTITA_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`detail-form-option-btn ${detailForm.idiotita === opt.value ? 'active' : ''}`}
                                  onClick={() => setDetailForm(prev => ({ ...prev, idiotita: opt.value }))}
                                >
                                  {t(opt.labelKey)}
                                </button>
                              ))}
                            </div>
                          </div>
                          {isIdioktitisE9 && (
                            <div className="detail-toggle-list">
                              <YesNoToggle
                                label={t('detail.thirdPartyAssignment')}
                                value={detailForm.paraxorisiTrito}
                                onChange={v => setDetailForm(prev => ({ ...prev, paraxorisiTrito: v }))}
                              />
                              {isParaxorisi && (
                                <YesNoToggle
                                  label={t('detail.activeUde')}
                                  value={detailForm.energoYde}
                                  onChange={v => setDetailForm(prev => ({ ...prev, energoYde: v }))}
                                />
                              )}
                              {isParaxorisi && detailForm.energoYde === false && (
                                <YesNoToggle
                                  label={t('detail.electrified')}
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
                            <h5 className="detail-form-subtitle">{t('detail.billPhoto')}</h5>
                            <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                              <img src={billFront} alt={t('detail.billPhoto')} className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.allPages')}</span>
                            </label>
                            <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.meterPhoto')}</h5>
                            <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritis')} />
                              <img src={powerMeter} alt={t('detail.meterPhoto')} className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />{t('detail.meterAndReadings')}</span>
                            </label>
                            <FilePreviewList files={files.metritis} field="metritis" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                        </>
                      )}
                      {isProviderChange && detailForm.ofeilesPalioParoxou && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.settlement')}</h5>
                            <label className={`detail-upload-card ${files.diakanonismos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('diakanonismos')} />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                            </label>
                            <FilePreviewList files={files.diakanonismos} field="diakanonismos" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.lastInstallment')}</h5>
                            <label className={`detail-upload-card ${files.pliromiTeleftaiasDosis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('pliromiTeleftaiasDosis')} />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                            </label>
                            <FilePreviewList files={files.pliromiTeleftaiasDosis} field="pliromiTeleftaiasDosis" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                        </>
                      )}
                      {detailForm.tiposEpixeirisis === 'Ατομική' && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.businessStart')}</h5>
                          <label className={`detail-upload-card ${files.enarxiDrastiriotitas.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('enarxiDrastiriotitas')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.enarxiDrastiriotitas} field="enarxiDrastiriotitas" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}
                      {detailForm.tiposEpixeirisis === 'Εταιρία' && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.articlesOfAssociation')}</h5>
                            <label className={`detail-upload-card ${files.katastatiko.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('katastatiko')} />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                            </label>
                            <FilePreviewList files={files.katastatiko} field="katastatiko" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.legalRepId')}</h5>
                            <label className={`detail-upload-card ${files.tautotitaNomimouEkprosopou.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('tautotitaNomimouEkprosopou')} />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                            </label>
                            <FilePreviewList files={files.tautotitaNomimouEkprosopou} field="tautotitaNomimouEkprosopou" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                        </>
                      )}
                      {detailForm.protiSyndesi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.deddieContract')}</h5>
                          <label className={`detail-upload-card ${files.symvasiDeddie.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('symvasiDeddie')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.symvasiDeddie} field="symvasiDeddie" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}
                      {isZenithPagia && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.standingOrderDetails')}</h5>
                          <div className="detail-form-group">
                            <label>{t('detail.iban')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.iban}
                              onChange={e => setDetailForm(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                              placeholder="GR00 0000 0000 0000 0000 0000 000"
                              maxLength={34}
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.beneficiaryName')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaDikaiouhou}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaDikaiouhou: e.target.value }))}
                              placeholder={t('detail.beneficiaryPlaceholder')}
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.bankName')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaTrapezas}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaTrapezas: e.target.value }))}
                              placeholder={t('detail.bankPlaceholder')}
                            />
                          </div>
                          {detailForm.ibanTritosProsopo && (
                            <div className="detail-form-group">
                              <label>{t('detail.ibanDeclaration')}</label>
                              <label className={`detail-upload-card ${files.ypeuthiniDilosiIban.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiIban')} />
                                <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                              </label>
                              <FilePreviewList files={files.ypeuthiniDilosiIban} field="ypeuthiniDilosiIban" onRemove={removeFile} onPreview={setPreviewFile} />
                            </div>
                          )}
                        </div>
                      )}
                      {isIdioktitisE9 && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.e9')}</h5>
                          <label className={`detail-upload-card ${files.e9.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('e9')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.e9} field="e9" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}
                      {isParaxorisi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.assignmentDeclaration')}</h5>
                          <label className={`detail-upload-card ${files.ypeuthiniDilosiParaxorisis.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiParaxorisis')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.ypeuthiniDilosiParaxorisis} field="ypeuthiniDilosiParaxorisis" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}
                      {!detailForm.tiposEpixeirisis && (
                        <p className="detail-step2-empty">
                          {t('detail.selectBusinessType')}
                        </p>
                      )}
                    </div>
                  )}

                  {step === 2 && !isProfessional && (
                    <div className="detail-form">
                      {!hasStep2Content && (
                        <p className="detail-step2-empty">
                          {t('detail.noExtraDocs')}
                        </p>
                      )}

                      {isProviderChange && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.billPhoto')}</h5>
                            <label className={`detail-upload-card ${files.logariasmos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('logariasmos')} />
                              <img src={billFront} alt={t('detail.billPhoto')} className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.allPages')}</span>
                            </label>
                            <FilePreviewList files={files.logariasmos} field="logariasmos" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.meterPhoto')}</h5>
                            <label className={`detail-upload-card ${files.metritis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritis')} />
                              <img src={powerMeter} alt={t('detail.meterPhoto')} className="detail-upload-card-icon" />
                              <span className="detail-upload-card-label"><UploadIcon />{t('detail.meterAndReadings')}</span>
                            </label>
                            <FilePreviewList files={files.metritis} field="metritis" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                        </>
                      )}

                      {isProviderChange && detailForm.ofeilesPalioParoxou && (
                        <>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.settlement')}</h5>
                            <label className={`detail-upload-card ${files.diakanonismos.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('diakanonismos')} />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                            </label>
                            <FilePreviewList files={files.diakanonismos} field="diakanonismos" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                          <div className="detail-form-subsection">
                            <h5 className="detail-form-subtitle">{t('detail.lastInstallment')}</h5>
                            <label className={`detail-upload-card ${files.pliromiTeleftaiasDosis.length ? 'has-file' : ''}`}>
                              <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('pliromiTeleftaiasDosis')} />
                              <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                            </label>
                            <FilePreviewList files={files.pliromiTeleftaiasDosis} field="pliromiTeleftaiasDosis" onRemove={removeFile} onPreview={setPreviewFile} />
                          </div>
                        </>
                      )}

                      {isZenithPagia && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.standingOrderDetails')}</h5>
                          <div className="detail-form-group">
                            <label>{t('detail.iban')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.iban}
                              onChange={e => setDetailForm(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
                              placeholder="GR00 0000 0000 0000 0000 0000 000"
                              maxLength={34}
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.beneficiaryName')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaDikaiouhou}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaDikaiouhou: e.target.value }))}
                              placeholder={t('detail.beneficiaryPlaceholder')}
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.bankName')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaTrapezas}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaTrapezas: e.target.value }))}
                              placeholder={t('detail.bankPlaceholder')}
                            />
                          </div>
                          {detailForm.ibanTritosProsopo && (
                            <div className="detail-form-group">
                              <label>{t('detail.ibanDeclaration')}</label>
                              <label className={`detail-upload-card ${files.ypeuthiniDilosiIban.length ? 'has-file' : ''}`}>
                                <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiIban')} />
                                <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                              </label>
                              <FilePreviewList files={files.ypeuthiniDilosiIban} field="ypeuthiniDilosiIban" onRemove={removeFile} onPreview={setPreviewFile} />
                            </div>
                          )}
                        </div>
                      )}

                      {detailForm.protiSyndesi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.deddieContract')}</h5>
                          <label className={`detail-upload-card ${files.symvasiDeddie.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('symvasiDeddie')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.symvasiDeddie} field="symvasiDeddie" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}

                      {isIdioktitisE9 && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.e9')}</h5>
                          <label className={`detail-upload-card ${files.e9.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('e9')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.e9} field="e9" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}

                      {isParaxorisi && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.assignmentDeclaration')}</h5>
                          <label className={`detail-upload-card ${files.ypeuthiniDilosiParaxorisis.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('ypeuthiniDilosiParaxorisis')} />
                            <span className="detail-upload-card-label"><UploadIcon />{t('common.selectFiles')}</span>
                          </label>
                          <FilePreviewList files={files.ypeuthiniDilosiParaxorisis} field="ypeuthiniDilosiParaxorisis" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}

                      {isGasMetritis && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.gasMeterPhoto')}</h5>
                          <label className={`detail-upload-card ${files.metritisAeriou.length ? 'has-file' : ''}`}>
                            <input type="file" accept="image/*,.pdf,.heic,.heif,.webp" multiple onChange={handleFileChange('metritisAeriou')} />
                            <img src={powerMeter} alt={t('detail.gasMeterPhoto')} className="detail-upload-card-icon" />
                            <span className="detail-upload-card-label"><UploadIcon />{t('detail.gasMeterPhoto')}</span>
                          </label>
                          <FilePreviewList files={files.metritisAeriou} field="metritisAeriou" onRemove={removeFile} onPreview={setPreviewFile} />
                        </div>
                      )}

                      {isGasEnikiasti && (
                        <div className="detail-form-subsection">
                          <h5 className="detail-form-subtitle">{t('detail.ownerDetails')}</h5>
                          <div className="detail-form-group">
                            <label>{t('detail.ownerAfm')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.afmIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, afmIdioktiti: e.target.value }))}
                              placeholder={t('detail.ownerAfmPlaceholder')}
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.ownerName')} <span className="detail-required">*</span></label>
                            <input
                              type="text"
                              value={detailForm.onomaIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, onomaIdioktiti: e.target.value }))}
                              placeholder={t('detail.ownerNamePlaceholder')}
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.ownerMobile')} <span className="detail-required">*</span></label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              value={detailForm.kinitoIdioktiti}
                              onChange={e => setDetailForm(prev => ({ ...prev, kinitoIdioktiti: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                              placeholder="69xxxxxxxx"
                            />
                          </div>
                          <div className="detail-form-group">
                            <label>{t('detail.ownerEmail')} <span className="detail-required">*</span></label>
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
                          <p>{t('detail.successMessage')}</p>
                          {uploadWarning && (
                            <div className="upload-warning">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              <span>{uploadWarning}</span>
                            </div>
                          )}
                        </div>
                      ) : submitResult === 'error' ? (
                        <div className="detail-submit-error">
                          <p>{t('detail.errorMessage')}</p>
                          <button type="button" className="detail-next-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? t('common.submitting') : t('detail.tryAgain')}
                          </button>
                        </div>
                      ) : (
                        <div className="detail-submit-ready">
                          <p className="detail-submit-text">{t('detail.readyMessage')}</p>
                          <button type="button" className="detail-next-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? t('common.submitting') : t('detail.submitApplication')}
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
                          {t('common.back')}
                        </button>
                      )}
                      {step < SECTION_KEYS.length - 1 && (
                        <div className="detail-next-wrapper">
                          <button
                            className="detail-next-btn"
                            type="button"
                            onClick={handleNext}
                            disabled={!isActive || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
                          >
                            {t('common.next')}
                          </button>
                          {isActive && ((step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)) && (
                            <span className="detail-next-tooltip">
                              {step === 1
                                ? t('detail.fillRequired')
                                : t('detail.uploadRequired')}
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
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  )
}

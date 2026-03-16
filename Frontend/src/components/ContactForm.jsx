import { useState } from 'react'
import SpecificInfo from './formSteps/SpecificInfo'
import BasicInfo from './formSteps/BasicInfo'
import ProviderInfo from './formSteps/ProviderInfo'
import Lightning from './LighitngBackground'
import LiquidEther from './LiquidEther';
import './styles/ContactForm.css'

const GAS_COLORS = ['#00b64c', '#00d8cd', '#90E0EF']
const GAS_STYLE = { position: 'absolute' }

export default function ContactForm({ formData, setFormData, onFormSubmit, providersData }) {
    const [activeService, setActiveService] = useState('electricity')
    const [toggleOpen, setToggleOpen] = useState(false)
    const [basicInfo, setBasicInfo] = useState({})
    const [throwError, setThrowError] = useState()
    const [step, setStep] = useState(1)

    const handleToggle = (service, isActive) => {
        if (isActive) {
            setToggleOpen(!toggleOpen)
        } else {
            setActiveService(service)
            setToggleOpen(false)
            setStep(1)
            setThrowError(null)
            setFormData(prev => ({
                ...prev,
                customerType: 'residential',
                businessTariff: '',
                nightTariff: '',
                socialTariff: '',
                provider: '',
                kwhConsumption: 140,
                nightKwhConsumption: 0,
                region: '',
            }))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const data = {
            service: activeService,
            ...formData
        }
        console.log('Form submitted:', data)
        onFormSubmit?.()
    }

    const handleBack = () => {
        setThrowError(null)
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleNext = () => {
        setThrowError(null)
        if (step === 1) {
            if (formData.customerType !== 'professional') {
                if (!formData.nightTariff) {
                    setThrowError('Παρακαλώ επιλέξτε εάν έχετε νυχτερινό τιμολόγιο ή όχι.')
                    return
                }

                if (!formData.socialTariff) {
                    setThrowError('Παρακαλώ επιλέξτε εάν λαμβάνετε κοινωνικό τιμολόγιο ή όχι.')
                    return
                }
            }

            setBasicInfo({
                service: activeService,
                customerType: formData.customerType,
                nightTariff: formData.nightTariff,
                socialTariff: formData.socialTariff
            })

            setStep(2)
        } else if (step === 2) {
            if (!formData.provider) {
                setThrowError('Παρακαλώ επιλέξτε πάροχο.')
                return
            }

            setStep(3)
        }
    }

    return (
        <div className="form-card">
            {activeService === 'electricity' && (
                <Lightning hue={260} xOffset={0} speed={0.5} intensity={0.6} size={2} />
            )}
            {activeService === 'gas' && (
                <LiquidEther
                    className="ether-background"
                    style={GAS_STYLE}
                    colors={GAS_COLORS}
                    mouseForce={10}
                    cursorSize={80}
                    isViscous
                    viscous={30}
                    iterationsViscous={32}
                    iterationsPoisson={32}
                    resolution={0.5}
                    isBounce={true}
                    autoDemo
                    autoSpeed={0.9}
                    autoIntensity={3}
                    takeoverDuration={0.25}
                    autoResumeDelay={0}
                    autoRampDuration={0.6}
                    disableMouse
                />
            )}
            <div className="form-content">
                <div className="form-header">
                    <h2>Λάβε Δωρεάν Προσφορά</h2>
                    <p>Συμπλήρωσε τα στοιχεία σου και θα σε καλέσουμε</p>
                </div>

            <form id="leadForm" onSubmit={handleSubmit}>
                <div className={`service-toggle ${toggleOpen ? 'open' : ''}`}>
                    <button
                        type="button"
                        className={`toggle-btn ${activeService === 'electricity' ? 'active' : ''}`}
                        onClick={() => handleToggle('electricity', activeService === 'electricity')}
                    >
                            {/* ⚡  */}Ρεύμα
                        <i className="fa-solid fa-chevron-down toggle-arrow"></i>
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${activeService === 'gas' ? 'active' : ''}`}
                        onClick={() => handleToggle('gas', activeService === 'gas')}
                    >
                        {/*🔥*/} Φ. Αέριο
                        <i className="fa-solid fa-chevron-down toggle-arrow"></i>
                    </button>
                    <button
                        type="button"
                        className={`toggle-btn ${activeService === 'both' ? 'active' : ''}`}
                        onClick={() => handleToggle('both', activeService === 'both')}
                    >
                        {/*✨*/} Και τα δύο
                        <i className="fa-solid fa-chevron-down toggle-arrow"></i>
                    </button>
                </div>

                <div className="step-indicator">
                    <div className="step-text">Βήμα {step}/3</div>
                    <div className="step-bar">
                        <div className="step-bar-fill" style={{ width: `${(step / 3) * 100}%` }} />
                    </div>
                </div>

                <div className="form-step-content">
                    {step === 1 && (
                        <BasicInfo formData={formData} setFormData={setFormData} throwError={throwError} setThrowError={setThrowError} />
                    )}

                    {step === 2 && (
                        <>
                            <div className="step-title">Τωρινός πάροχος</div>
                            <ProviderInfo formData={formData} setFormData={setFormData} throwError={throwError} setThrowError={setThrowError} activeService={activeService} providersData={providersData} />
                        </>
                    )}

                    {step === 3 && (
                        <SpecificInfo formData={formData} setFormData={setFormData} setThrowError={setThrowError} activeService={activeService} />
                    )}
                </div>

                <div className={throwError ? "error-container" : "error-container hidden"}>
                    <p className="error-message">{throwError}‎ </p>
                </div>

                <div className="form-buttons">
                    {step > 1 && (
                        <button type="button" onClick={handleBack} className="back-btn">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                    )}
                    <button type={step === 3 ? 'submit' : 'button'} onClick={step !== 3 ? handleNext : undefined} className="next-btn">
                        {step !== 3 ? <i className="fa-solid fa-arrow-right fa-xl"></i> : 'Θέλω να με καλέσετε'}
                    </button>
                </div>

            </form>

            <p className="form-footer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Τα στοιχεία σου είναι ασφαλή
            </p>
            </div>
        </div>
    )
}

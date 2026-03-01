import deiLogo from '../../assets/deiLogo.svg'
import enerwaveLogo from '../../assets/enerwaveLogo.svg'
import eyniceLogo from '../../assets/eyniceLogo.svg'
import hrwnLogo from '../../assets/hrwnLogo.svg'
import protergiaLogo from '../../assets/protergiaLogo.svg'
import zenithLogo from '../../assets/zenithLogo.svg'
import '../styles/ProviderInfo.css'

export default function ProviderInfo({ formData, setFormData, throwError, setThrowError }) {
    const handleSelect = (provider) => {
        setFormData(prev => ({ ...prev, provider }))
        if(throwError?.includes('πάροχο')) setThrowError(null)
    }

    const providers = [
        { id: 'dei', src: deiLogo, alt: 'ΔΕΗ' },
        { id: 'enerwave', src: enerwaveLogo, alt: 'Enerwave' },
        { id: 'eynice', src: eyniceLogo, alt: 'Eynice' },
        { id: 'hron', src: hrwnLogo, alt: 'Ήρων' },
        { id: 'protergia', src: protergiaLogo, alt: 'Protergia' },
        { id: 'zenith', src: zenithLogo, alt: 'Zenith' }
    ]

    return (
        <div className="providerInfoContainer">
            {providers.map(provider => (
                <img
                    key={provider.id}
                    src={provider.src}
                    alt={provider.alt}
                    className={formData.provider === provider.id ? 'selected' : ''}
                    onClick={() => handleSelect(provider.id)}
                />
            ))}
            <button
                type="button"
                className={`provider-unknown-btn ${formData.provider === 'unknown' ? 'selected' : ''}`}
                onClick={() => handleSelect('unknown')}
            >
                Δεν γνωρίζω
            </button>
        </div>
    )
}   
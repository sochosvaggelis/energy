import { useMemo } from 'react'
import { useTranslation } from '../../context/LanguageContext'
import '../styles/ProviderInfo.css'

export default function ProviderInfo({ formData, setFormData, throwError, setThrowError, activeService, providersData, pricesData }) {
    const { t } = useTranslation()

    const providers = useMemo(() => {
        if (!providersData) return []
        if (activeService === 'both') return providersData
        const providerIdsWithPlans = new Set(
            (pricesData || [])
                .filter(p => p.service_type === activeService)
                .map(p => p.provider)
        )
        return providersData.filter(p => providerIdsWithPlans.has(p.name))
    }, [providersData, pricesData, activeService])

    const handleSelect = (providerId) => {
        setFormData(prev => ({ ...prev, provider: providerId }))
        if (throwError === 'errors.provider') setThrowError(null)
    }

    return (
        <div className="providerInfoContainer">
            {providers.map(provider => (
                provider.logo_url ? (
                    <img
                        key={provider.id}
                        src={provider.logo_url}
                        alt={provider.name}
                        loading="lazy"
                        width="120"
                        height="60"
                        role="button"
                        tabIndex={0}
                        className={formData.provider === provider.id ? 'selected' : ''}
                        onClick={() => handleSelect(provider.id)}
                        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(provider.id))}
                    />
                ) : (
                    <button
                        key={provider.id}
                        type="button"
                        className={`provider-name-btn ${formData.provider === provider.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(provider.id)}
                    >
                        {provider.name}
                    </button>
                )
            ))}
            <button
                type="button"
                className={`provider-unknown-btn ${formData.provider === 'unknown' ? 'selected' : ''}`}
                onClick={() => handleSelect('unknown')}
            >
                {t('providerInfo.unknown')}
            </button>
        </div>
    )
}

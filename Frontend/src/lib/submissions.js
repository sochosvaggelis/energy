import { supabase } from './supabase'

/**
 * Upsert a submission via RPC (handles find-or-create server-side).
 * Returns { id, error }.
 */
export async function upsertSubmission(formData, providersData, activeService) {
  // Resolve provider UUID to name for readability in admin dashboard
  let providerName = formData.provider
  if (formData.provider && formData.provider !== 'unknown' && providersData?.length) {
    providerName = providersData.find(p => p.id === formData.provider)?.name || formData.provider
  }

  const leadInfo = {
    name: formData.name,
    phone: formData.phone,
    email: formData.email || null,
    region: formData.region,
    contact_time: formData.contact_time,
    service_type: activeService || 'electricity',
  }
  const electricityInfo = {
    customer_type: formData.customerType,
    night_tariff: formData.nightTariff,
    social_tariff: formData.socialTariff,
    current_provider: providerName,
    kwh_consumption: formData.kwhConsumption,
    night_kwh_consumption: formData.nightKwhConsumption,
  }

  const { data, error } = await supabase.rpc('upsert_submission', {
    p_lead_info: leadInfo,
    p_electricity_info: electricityInfo,
  })

  return { id: error ? null : data, error }
}

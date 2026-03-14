import { supabase } from './supabase'

/**
 * Find an existing submission by phone + email combo.
 * Returns the submission id or null.
 */
export async function findSubmissionByContact(phone, email) {
  let query = supabase
    .from('submissions')
    .select('id')
    .eq('lead_info->>phone', phone)

  if (email) {
    query = query.eq('lead_info->>email', email)
  } else {
    query = query.is('lead_info->>email', null)
  }

  const { data } = await query.maybeSingle()
  return data?.id ?? null
}

/**
 * Upsert a submission: update if found by phone+email, otherwise insert.
 * Returns { id, error }.
 */
export async function upsertSubmission(formData, extraData = {}) {
  const phone = formData.phone
  const email = formData.email || null

  const leadInfo = {
    name: formData.name,
    phone,
    email,
    region: formData.region,
    contact_time: formData.contact_time,
  }
  const electricityInfo = {
    customer_type: formData.customerType,
    night_tariff: formData.nightTariff,
    social_tariff: formData.socialTariff,
    current_provider: formData.provider,
    kwh_consumption: formData.kwhConsumption,
    night_kwh_consumption: formData.nightKwhConsumption,
  }

  const existingId = await findSubmissionByContact(phone, email)

  if (existingId) {
    const { error } = await supabase
      .from('submissions')
      .update({
        lead_info: leadInfo,
        electricity_info: electricityInfo,
        submitted_at: new Date().toISOString(),
        ...extraData,
      })
      .eq('id', existingId)

    return { id: error ? null : existingId, error }
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      lead_info: leadInfo,
      electricity_info: electricityInfo,
      submitted_at: new Date().toISOString(),
      ...extraData,
    }])
    .select('id')
    .single()

  return { id: data?.id ?? null, error }
}

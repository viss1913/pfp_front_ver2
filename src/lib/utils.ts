import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует число с разделителями тысяч
 * @param value - число для форматирования (может быть числом или строкой)
 * @returns отформатированная строка (например: "5 000 000")
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0'
  return new Intl.NumberFormat('ru-RU').format(numValue)
}

/**
 * Форматирует процентное значение с одним знаком после запятой
 * @param value - процентное значение (может быть числом или строкой)
 * @returns отформатированная строка (например: "13.0%")
 */
export function formatRate(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0.0%'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0.0%'
  return `${numValue.toFixed(1)}%`
}

/**
 * Форматирует коэффициент софинансирования (ratio_numerator / ratio_denominator)
 * @param numerator - числитель соотношения
 * @param denominator - знаменатель соотношения
 * @returns отформатированная строка (например: "1.0")
 */
export function formatCoefficient(numerator: number, denominator: number): string {
  if (denominator === 0) return '0.0'
  const coefficient = numerator / denominator
  return coefficient.toFixed(2)
}



export function normalizePortfolioData(formData: any): any {
  const ALLOWED = new Set(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'])

  const data: any = {
    name: formData.name,
    currency: formData.currency,
    amount_from: Number(formData.amount_from),
    amount_to: Number(formData.amount_to),
    term_from_months: Number(formData.term_from_months),
    term_to_months: Number(formData.term_to_months),
    age_from: formData.age_from ? Number(formData.age_from) : null,
    age_to: formData.age_to ? Number(formData.age_to) : null,
    investor_type: formData.investor_type || null,
    gender: formData.gender || null,
    classes: Array.isArray(formData.classes) ? formData.classes.map((id: any) => Number(id)) : [],
    riskProfiles: [],
  }

  const profilesSource = formData.riskProfiles ?? formData.risk_profiles ?? []

  if (Array.isArray(profilesSource)) {
    data.riskProfiles = profilesSource.map((profile: any) => {
      const profileType = profile.profile_type?.toString()?.toUpperCase()
      if (!ALLOWED.has(profileType)) {
        throw new Error(`Invalid profile_type: ${profile.profile_type}`)
      }

      const normalizedProfile: any = {
        profile_type: profileType,
        potential_yield_percent: profile.potential_yield_percent ?? null,
        instruments: [],
      }

      if (Array.isArray(profile.instruments) && profile.instruments.length > 0) {
        normalizedProfile.instruments = profile.instruments.map((inst: any) => ({
          product_id: Number(inst.product_id),
          share_percent: Number(inst.share_percent),
          bucket_type: inst.bucket_type || null,
          order_index: inst.order_index != null ? Number(inst.order_index) : null,
        }))
      } else {
        if (Array.isArray(profile.initial_capital)) {
          normalizedProfile.instruments.push(
            ...profile.initial_capital.map((item: any) => ({
              product_id: Number(item.product_id),
              share_percent: Number(item.share_percent),
              bucket_type: 'INITIAL_CAPITAL',
              order_index: item.order_index != null ? Number(item.order_index) : null,
            }))
          )
        }
        if (Array.isArray(profile.initial_replenishment)) {
          normalizedProfile.instruments.push(
            ...profile.initial_replenishment.map((item: any) => ({
              product_id: Number(item.product_id),
              share_percent: Number(item.share_percent),
              bucket_type: 'TOP_UP',
              order_index: item.order_index != null ? Number(item.order_index) : null,
            }))
          )
        }
      }

      return normalizedProfile
    })
  }

  return data
}






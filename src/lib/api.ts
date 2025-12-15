import axios from 'axios'

const API_BASE_URL = 'https://pfpbackend-production.up.railway.app/api'

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor для добавления токена к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor для обработки ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или невалиден
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Типы для API
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    name: string
    role: string
    agentId: number
  }
}

export interface Product {
  id: number
  name: string
  product_type: string
  currency: string
  min_term_months?: number
  max_term_months?: number
  min_amount?: number
  max_amount?: number
  yields?: ProductYield[]
  lines?: ProductLine[]
  is_default?: boolean
  is_active?: number
  agent_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface ProductType {
  id: number
  code: string
  name: string
  description?: string
  is_active: boolean
  order_index: number
  created_at?: string
  updated_at?: string
}

export interface ProductYield {
  term_from_months: number
  term_to_months: number
  amount_from: number
  amount_to: number
  yield_percent: number
}

export interface ProductLine {
  min_term_months: number
  max_term_months: number
  min_amount: number
  max_amount: number
  yield_percent: number
}

export interface PassiveIncomeYieldLine {
  min_term_months: number
  max_term_months: number
  min_amount: number
  max_amount: number
  yield_percent: number
}

export interface PassiveIncomeYieldResponse {
  lines: PassiveIncomeYieldLine[]
  updated_at: string
}

export interface Portfolio {
  id: number
  name: string
  currency: string
  amount_from: number
  amount_to: number
  term_from_months: number
  term_to_months: number
  age_from?: number
  age_to?: number
  investor_type?: string
  gender?: string
  classes?: number[]
  riskProfiles?: PortfolioRiskProfile[]
  // Legacy support
  risk_profiles?: PortfolioRiskProfile[]
}

export interface PortfolioClass {
  id: number
  code: string
  name: string
}

export type BucketType = 'INITIAL_CAPITAL' | 'TOP_UP'

export interface PortfolioInstrument {
  product_id: number
  share_percent: number
  bucket_type: BucketType
  order_index?: number | null
}

export interface PortfolioRiskProfile {
  profile_type: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'
  potential_yield_percent?: number | null
  instruments: PortfolioInstrument[]
  // Legacy support
  initial_capital?: any[]
  initial_replenishment?: any[]
}

// Helper types for UI compatibility if needed
export type PortfolioInstrumentWithBucket = PortfolioInstrument

// Normalization function as requested
export function preparePortfolioData(portfolio: any): any {
  // Try to use riskProfiles, fallback to risk_profiles
  const sourceRiskProfiles = portfolio.riskProfiles || portfolio.risk_profiles || []

  const data = {
    name: portfolio.name,
    currency: portfolio.currency,
    amount_from: Number(portfolio.amount_from),
    amount_to: Number(portfolio.amount_to),
    term_from_months: Number(portfolio.term_from_months),
    term_to_months: Number(portfolio.term_to_months),
    age_from: portfolio.age_from ? Number(portfolio.age_from) : null,
    age_to: portfolio.age_to ? Number(portfolio.age_to) : null,
    investor_type: portfolio.investor_type || null,
    gender: portfolio.gender || null,
    classes: portfolio.classes ? portfolio.classes.map((id: any) => {
      if (id && typeof id === 'object') return Number(id.id)
      return Number(id)
    }).filter((n: number) => !isNaN(n)) : [],
    riskProfiles: sourceRiskProfiles.map((profile: any) => ({
      profile_type: profile.profile_type.toUpperCase(),
      potential_yield_percent: profile.potential_yield_percent ?? null,
      instruments: profile.instruments ? profile.instruments.map((inst: any) => ({
        product_id: Number(inst.product_id),
        share_percent: Number(inst.share_percent),
        bucket_type: inst.bucket_type || null,
        order_index: inst.order_index ? Number(inst.order_index) : null
      })) : []
    }))
  }

  return data
}

export interface SystemSetting {
  key: string
  value: string | number | object
  description?: string
  category?: string
  updated_at?: string
}

export interface Tax2ndflBracket {
  id: number
  income_from: number
  income_to: number
  rate: number
  order_index: number
  description?: string
  created_at: string
  updated_at: string
}

export interface Tax2ndflBracketCreate {
  income_from: number
  income_to: number
  rate: number
  order_index?: number
}

export interface Tax2ndflBracketUpdate {
  income_from?: number
  income_to?: number
  rate?: number
  order_index?: number
}

export interface ApiError {
  error: string
  message: string
}

// Типы для софинансирования ПДС
export interface PdsCofinSettings {
  id: number
  max_state_cofin_amount_per_year: number
  min_contribution_for_support_per_year: number
  income_basis: 'gross_before_ndfl' | 'net_after_ndfl'
  created_at: string
  updated_at: string
}

export interface PdsCofinSettingsUpdate {
  max_state_cofin_amount_per_year?: number
  min_contribution_for_support_per_year?: number
  income_basis?: 'gross_before_ndfl' | 'net_after_ndfl'
}

export interface PdsCofinIncomeBracket {
  id: number
  income_from: number
  income_to: number | null
  ratio_numerator: number
  ratio_denominator: number
  created_at: string
  updated_at: string
}

export interface PdsCofinIncomeBracketCreate {
  income_from: number
  income_to?: number | null
  ratio_numerator: number
  ratio_denominator: number
}

export interface PdsCofinIncomeBracketUpdate {
  income_from?: number
  income_to?: number | null
  ratio_numerator?: number
  ratio_denominator?: number
}

// API методы
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export const productsAPI = {
  list: async (params?: { includeDefaults?: boolean; product_type?: string }): Promise<Product[]> => {
    const response = await api.get<Product[]>('/pfp/products', { params })
    return response.data
  },
  get: async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/pfp/products/${id}`)
    return response.data
  },
  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await api.post<Product>('/pfp/products', data)
    return response.data
  },
  update: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/pfp/products/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pfp/products/${id}`)
  },
  clone: async (id: number): Promise<Product> => {
    const response = await api.post<Product>(`/pfp/products/${id}/clone`)
    return response.data
  },
}

export const productTypesAPI = {
  list: async (params?: { is_active?: boolean }): Promise<ProductType[]> => {
    const response = await api.get<ProductType[]>('/pfp/product-types', { params })
    return response.data
  },
}

export const portfoliosAPI = {
  list: async (params?: { amount_from?: number }): Promise<Portfolio[]> => {
    const response = await api.get<Portfolio[]>('/pfp/portfolios', { params })
    const data: any[] = response.data

    // If backend returns new camelCase `riskProfiles`, map it to legacy `risk_profiles`
    // so admin UI that expects `risk_profiles` continues to work.
    data.forEach((p) => {
      if (p.riskProfiles && (!p.risk_profiles || p.risk_profiles.length === 0)) {
        p.risk_profiles = p.riskProfiles.map((rp: any) => {
          const initial_capital = (rp.instruments || []).filter((i: any) => i.bucket_type === 'INITIAL_CAPITAL').map((i: any) => ({
            product_id: Number(i.product_id),
            order_index: i.order_index != null ? Number(i.order_index) : null,
            share_percent: Number(i.share_percent),
          }))
          const initial_replenishment = (rp.instruments || []).filter((i: any) => i.bucket_type === 'TOP_UP').map((i: any) => ({
            product_id: Number(i.product_id),
            order_index: i.order_index != null ? Number(i.order_index) : null,
            share_percent: Number(i.share_percent),
          }))
          return {
            profile_type: rp.profile_type,
            initial_capital,
            initial_replenishment,
          }
        })
      }
    })

    return data
  },
  get: async (id: number): Promise<Portfolio> => {
    const response = await api.get<Portfolio>(`/pfp/portfolios/${id}`)
    return response.data
  },
  create: async (data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.post<Portfolio>('/pfp/portfolios', data)
    return response.data
  },
  update: async (id: number, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.put<Portfolio>(`/pfp/portfolios/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pfp/portfolios/${id}`)
  },
  clone: async (id: number): Promise<Portfolio> => {
    const response = await api.post<Portfolio>(`/pfp/portfolios/${id}/clone`)
    return response.data
  },
  getClasses: async (): Promise<PortfolioClass[]> => {
    const response = await api.get<PortfolioClass[]>('/pfp/portfolios/classes')
    return response.data
  },
}

export const settingsAPI = {
  list: async (params?: { category?: string }): Promise<SystemSetting[]> => {
    const response = await api.get<SystemSetting[]>('/pfp/settings', { params })
    return response.data
  },
  get: async (key: string): Promise<SystemSetting> => {
    const response = await api.get<SystemSetting>(`/pfp/settings/${key}`)
    return response.data
  },
  update: async (key: string, value: string | number | object): Promise<SystemSetting> => {
    const response = await api.put<SystemSetting>(`/pfp/settings/${key}`, { value })
    return response.data
  },
  create: async (data: Partial<SystemSetting>): Promise<SystemSetting> => {
    const response = await api.post<SystemSetting>('/pfp/settings', data)
    return response.data
  },
  delete: async (key: string): Promise<void> => {
    await api.delete(`/pfp/settings/${key}`)
  },
}

export const taxBracketsAPI = {
  list: async (): Promise<Tax2ndflBracket[]> => {
    const response = await api.get<Tax2ndflBracket[]>('/pfp/settings/tax-2ndfl/brackets')
    return response.data
  },
  get: async (id: number): Promise<Tax2ndflBracket> => {
    const response = await api.get<Tax2ndflBracket>(`/pfp/settings/tax-2ndfl/brackets/${id}`)
    return response.data
  },
  getByIncome: async (income: number): Promise<Tax2ndflBracket> => {
    const response = await api.get<Tax2ndflBracket>(`/pfp/settings/tax-2ndfl/brackets/by-income/${income}`)
    return response.data
  },
  create: async (data: Tax2ndflBracketCreate): Promise<Tax2ndflBracket> => {
    const response = await api.post<Tax2ndflBracket>('/pfp/settings/tax-2ndfl/brackets', data)
    return response.data
  },
  update: async (id: number, data: Tax2ndflBracketUpdate): Promise<Tax2ndflBracket> => {
    const response = await api.put<Tax2ndflBracket>(`/pfp/settings/tax-2ndfl/brackets/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pfp/settings/tax-2ndfl/brackets/${id}`)
  },
  bulkCreate: async (brackets: Tax2ndflBracketCreate[]): Promise<Tax2ndflBracket[]> => {
    const response = await api.post<Tax2ndflBracket[]>('/pfp/settings/tax-2ndfl/brackets/bulk', brackets)
    return response.data
  },
}

export const pdsCofinAPI = {
  getSettings: async (): Promise<PdsCofinSettings> => {
    const response = await api.get<PdsCofinSettings>('/pfp/settings/pds/cofin-settings')
    return response.data
  },
  updateSettings: async (data: PdsCofinSettingsUpdate): Promise<PdsCofinSettings> => {
    const response = await api.patch<PdsCofinSettings>('/pfp/settings/pds/cofin-settings', data)
    return response.data
  },
  listBrackets: async (): Promise<PdsCofinIncomeBracket[]> => {
    const response = await api.get<PdsCofinIncomeBracket[]>('/pfp/settings/pds/cofin-income-brackets')
    return response.data
  },
  getBracket: async (id: number): Promise<PdsCofinIncomeBracket> => {
    const response = await api.get<PdsCofinIncomeBracket>(`/pfp/settings/pds/cofin-income-brackets/${id}`)
    return response.data
  },
  createBracket: async (data: PdsCofinIncomeBracketCreate): Promise<PdsCofinIncomeBracket> => {
    const response = await api.post<PdsCofinIncomeBracket>('/pfp/settings/pds/cofin-income-brackets', data)
    return response.data
  },
  updateBracket: async (id: number, data: PdsCofinIncomeBracketUpdate): Promise<PdsCofinIncomeBracket> => {
    const response = await api.patch<PdsCofinIncomeBracket>(`/pfp/settings/pds/cofin-income-brackets/${id}`, data)
    return response.data
  },
  deleteBracket: async (id: number): Promise<void> => {
    await api.delete(`/pfp/settings/pds/cofin-income-brackets/${id}`)
  },
}

export const passiveIncomeAPI = {
  getYieldLines: async (): Promise<PassiveIncomeYieldResponse> => {
    const response = await api.get<PassiveIncomeYieldResponse>('/pfp/settings/passive-income/yield')
    return response.data
  },
  updateYieldLines: async (lines: PassiveIncomeYieldLine[]): Promise<PassiveIncomeYieldResponse> => {
    const response = await api.put<PassiveIncomeYieldResponse>('/pfp/settings/passive-income/yield', { lines })
    return response.data
  },
}

export default api


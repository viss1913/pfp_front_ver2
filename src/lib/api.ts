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
  risk_profiles?: PortfolioRiskProfile[]
}

export interface PortfolioClass {
  id: number
  code: string
  name: string
}

export interface PortfolioClass {
  id: number
  code: string
  name: string
}

export interface PortfolioRiskProfile {
  profile_type: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'
  initial_capital: PortfolioInstrument[]
  initial_replenishment: PortfolioInstrument[]
}

export type BucketType = 'INITIAL_CAPITAL' | 'INITIAL_REPLENISHMENT'

export interface PortfolioInstrument {
  product_id: number
  share_percent: number
  order_index: number
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

export const portfoliosAPI = {
  list: async (params?: { amount_from?: number }): Promise<Portfolio[]> => {
    const response = await api.get<Portfolio[]>('/pfp/portfolios', { params })
    return response.data
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


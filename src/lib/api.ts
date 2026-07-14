import axios from 'axios'

const DEFAULT_API_BASE_URL = 'https://pfpbackend-production.up.railway.app/api'

function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim()
  if (!raw) return DEFAULT_API_BASE_URL

  let url = raw.replace(/\/+$/, '')
  if (!url.endsWith('/api')) {
    url = `${url}/api`
  }
  return url
}

/** Задаётся в Vercel / .env: VITE_API_BASE_URL (origin или полный URL с /api) */
export const API_BASE_URL = resolveApiBaseUrl()

if (typeof window !== 'undefined') {
  if (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
    console.warn(
      '[API] VITE_API_BASE_URL использует HTTP, а админка на HTTPS — браузер заблокирует запросы (mixed content).',
      API_BASE_URL
    )
  }
  console.info('[API] base URL:', API_BASE_URL)
}

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

    const projectKey = localStorage.getItem('project_key')
    const projectId = localStorage.getItem('project_id')

    if (projectKey) {
      config.headers['X-Project-Key'] = projectKey
    }

    if (projectId) {
      config.headers['X-Project-ID'] = projectId
    }

    // Отладочный лог для консоли
    if (projectKey || projectId) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        'X-Project-Key': projectKey,
        'X-Project-ID': projectId
      })
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
  project_id: number
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
  commission_schema?: CommissionSchema | null
  created_at?: string
  updated_at?: string
}

export type CommissionRuleType =
  | 'ONE_TIME_FIXED'
  | 'ONE_TIME_PERCENT_OF_PREMIUM'
  | 'FIRST_YEAR_PERCENT_OF_PREMIUMS'
  | 'ANNUAL_PERCENT_OF_PREMIUM'
  | 'AUM_MANAGEMENT_FEE'
  | 'TIERED_BY_YEAR'

export type CommissionRuleBase = 'INITIAL' | 'FLOW' | 'INITIAL_PLUS_FLOW' | 'AUM_AVG'
export type CommissionRuleFrequency = 'ONE_TIME' | 'MONTHLY' | 'YEARLY'

export interface CommissionTier {
  year_from: number
  year_to: number
  rate_percent: number
}

export interface CommissionRule {
  rule_type: CommissionRuleType
  name?: string
  base?: CommissionRuleBase
  frequency?: CommissionRuleFrequency
  rate_percent?: number
  fixed_amount_rub?: number
  years?: {
    start: number
    end: number
  }
  tiers?: CommissionTier[]
}

export interface CommissionSchema {
  version: number
  rules: CommissionRule[]
}

export interface CommissionFieldConstraint {
  min?: number
  max?: number
}

export interface CommissionRuleTypeMeta {
  code: CommissionRuleType
  label: string
  description?: string
  required_fields: string[]
  optional_fields: string[]
  allowed_base: CommissionRuleBase[]
  allowed_frequency: CommissionRuleFrequency[]
  supports_years: boolean
  supports_tiers: boolean
}

export interface CommissionSchemaMeta {
  version: number
  rule_types: CommissionRuleTypeMeta[]
  field_constraints?: Record<string, CommissionFieldConstraint>
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
  project_id: number
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

/** Один диапазон месяцев с единой годовой ставкой инфляции (ключ inflation_rate_matrix) */
export interface InflationRateRange {
  fromMonth: number
  toMonthExcl: number
  rateAnnual: number
}

/** Матрица инфляции по месяцам горизонта (value для ключа inflation_rate_matrix) */
export interface InflationRateMatrix {
  ranges: InflationRateRange[]
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

// --- Home Owners Insurance ---

export interface HomeOwnersProduct {
  id?: number
  /** null — общий для всех проектов; число — привязка к проекту */
  project_id?: number | null
  name: string
  description?: string
  is_active: boolean
  rate_constructive: number
  rate_finish: number
  rate_property: number
  rate_civil: number
}

export interface HomeOwnersTariff {
  id?: number
  product_id: number
  parameter_name: string
  parameter_value: string
  coefficient: number
  label: string
  coefficient_type: 'base' | 'multiplier'
}

export interface HomeOwnersCalculationRequest {
  product_id: number
  client_id?: number | null
  object_params: Record<string, any>
  limits: {
    property: number
    civil?: number
  }
}

export interface HomeOwnersCalculationResponse {
  total_premium: number
  total_limit: number
  limits: {
    property: number
    civil?: number
  }
  currency: string
  calculation_steps: Array<{
    parameter: string
    value: string
    coefficient: number
    premium_after: number
  }>
}

// API методы
export interface ParsePartnerAgentRequest {
  project_key: string
  partner_agent_id?: string
  partner_ref_url?: string
}

export interface ParsePartnerAgentResponse {
  partner_agent_id: string
  label?: string
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },
  me: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  parsePartnerAgent: async (
    data: ParsePartnerAgentRequest
  ): Promise<ParsePartnerAgentResponse> => {
    const response = await api.post<ParsePartnerAgentResponse>(
      '/auth/parse-partner-agent',
      data
    )
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
  getCommissionSchemaMeta: async (): Promise<CommissionSchemaMeta> => {
    const paths = [
      '/pfp/commission-schema/meta',
      '/pfp/products/commission-schema/meta',
    ] as const
    let lastError: unknown
    for (const path of paths) {
      try {
        const response = await api.get<CommissionSchemaMeta>(path)
        return response.data
      } catch (error) {
        lastError = error
        const status = (error as { response?: { status?: number } }).response?.status
        if (status !== 404) throw error
      }
    }
    throw lastError
  },
}

export const productTypesAPI = {
  list: async (params?: { is_active?: boolean }): Promise<ProductType[]> => {
    const response = await api.get<ProductType[]>('/pfp/product-types', { params })
    return response.data
  },
}

export const portfoliosAPI = {
  list: async (params?: { amount_from?: number; includeDefaults?: boolean }): Promise<Portfolio[]> => {
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
    const response = await api.get<SystemSetting[]>('/pfp/settings', {
      // Добавляем параметр, чтобы обходить кеш браузера/прокси
      params: { ...params, _ts: Date.now() },
    })
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


export interface AiAssistant {
  id: number
  name: string
  slug: string
  context_template: string
  model: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface AiAssistantCreate {
  name: string
  slug: string
  context_template: string
  model: string
  is_active: boolean
}

export interface AiAssistantUpdate {
  name?: string
  slug?: string
  context_template?: string
  model?: string
  is_active?: boolean
}

export const aiAssistantsAPI = {
  list: async (): Promise<AiAssistant[]> => {
    const response = await api.get<AiAssistant[]>('/admin/ai-assistants')
    return response.data
  },
  get: async (id: number): Promise<AiAssistant> => {
    const response = await api.get<AiAssistant>(`/admin/ai-assistants/${id}`)
    return response.data
  },
  create: async (data: AiAssistantCreate): Promise<AiAssistant> => {
    const response = await api.post<AiAssistant>('/admin/ai-assistants', data)
    return response.data
  },
  update: async (id: number, data: AiAssistantUpdate): Promise<AiAssistant> => {
    const response = await api.put<AiAssistant>(`/admin/ai-assistants/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/ai-assistants/${id}`)
  },
}

export type AgentGender = 'male' | 'female'

export interface Agent {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  /** Локальная часть корп. почты до @ (или полный адрес — бэк обрежет). */
  email_corp?: string
  phone?: string
  telegram_bot?: string
  telegram_channel?: string
  telegram_channel_id?: string
  is_active: boolean
  region?: string
  city?: string
  position_title?: string
  specialization?: string
  experience_years?: number
  passport_series?: string
  passport_number?: string
  birth_date?: string
  gender?: AgentGender
  signature_image_url?: string
  partner_agent_id?: string | null
  parent_agent_id?: number | null
  referral_slug?: string | null
  created_at?: string
  updated_at?: string
}

export interface AgentCreate {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  password: string
  email_corp?: string
  phone?: string
  telegram_bot?: string
  telegram_channel?: string
  telegram_channel_id?: string
  is_active?: boolean
  region?: string
  city?: string
  position_title?: string
  specialization?: string
  experience_years?: number
  passport_series?: string
  passport_number?: string
  birth_date?: string
  gender?: AgentGender
  signature_image_url?: string
  partner_agent_id?: string
  partner_ref_url?: string
  parent_agent_id?: number
}

export interface AgentUpdate {
  first_name?: string
  last_name?: string
  middle_name?: string
  email?: string
  password?: string
  email_corp?: string
  phone?: string
  telegram_bot?: string
  telegram_channel?: string
  telegram_channel_id?: string
  is_active?: boolean
  region?: string
  city?: string
  position_title?: string
  specialization?: string
  experience_years?: number
  passport_series?: string
  passport_number?: string
  birth_date?: string
  gender?: AgentGender
  signature_image_url?: string
  partner_agent_id?: string | null
  parent_agent_id?: number | null
}

export interface AgentSignatureUploadResponse {
  url: string
  signature_image_url: string
  agent: Agent
}

export const agentsAPI = {
  list: async (params?: { is_active?: boolean; updated_since?: string }): Promise<Agent[]> => {
    const response = await api.get<Agent[]>('/pfp/agents', { params })
    return response.data
  },
  get: async (id: number): Promise<Agent> => {
    const response = await api.get<Agent>(`/pfp/agents/${id}`)
    return response.data
  },
  create: async (data: AgentCreate): Promise<Agent> => {
    const response = await api.post<Agent>('/pfp/agents', data)
    return response.data
  },
  update: async (id: number, data: AgentUpdate): Promise<Agent> => {
    const response = await api.patch<Agent>(`/pfp/agents/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pfp/agents/${id}`)
  },
  uploadSignature: async (id: number, image: File): Promise<AgentSignatureUploadResponse> => {
    const formData = new FormData()
    formData.append('image', image)
    const response = await api.post<AgentSignatureUploadResponse>(
      `/pfp/agents/${id}/signature-upload`,
      formData,
      {
        transformRequest: [
          (data, headers) => {
            if (data instanceof FormData) {
              delete headers['Content-Type']
            }
            return data
          },
        ],
      }
    )
    return response.data
  },
}

// --- Constructor API ---

export interface CJMTemplate {
  id?: number
  bot_id?: number
  command: string
  classifier: string
  response: string
  section: string
}

export interface BrainContext {
  id?: number
  title: string
  content: string
  is_active: boolean
  priority: number
}

export interface BotInfo {
  id: number
  name: string
  agent_email?: string
  status: string
  created_at: string
}

export interface ConstructorClient {
  id: number
  external_id: string
  name?: string
  platform: string
  last_activity: string
  created_at: string
}

export const constructorAPI = {
  // CJM Templates
  listTemplates: async (): Promise<CJMTemplate[]> => {
    const response = await api.get<CJMTemplate[]>('/pfp/constructor/commands')
    return response.data
  },
  createTemplate: async (data: CJMTemplate): Promise<CJMTemplate> => {
    const response = await api.post<CJMTemplate>('/pfp/constructor/commands', data)
    return response.data
  },
  updateTemplate: async (id: number, data: Partial<CJMTemplate>): Promise<CJMTemplate> => {
    const response = await api.put<CJMTemplate>(`/pfp/constructor/commands/${id}`, data)
    return response.data
  },
  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/pfp/constructor/commands/${id}`)
  },

  // Brain Contexts
  createBrainContext: async (data: BrainContext): Promise<BrainContext> => {
    const response = await api.post<BrainContext>('/pfp/constructor/brain-contexts', data)
    return response.data
  },
  listBrainContexts: async (): Promise<BrainContext[]> => {
    const response = await api.get<BrainContext[]>('/pfp/constructor/brain-contexts')
    return response.data
  },
  updateBrainContext: async (id: number, data: Partial<BrainContext>): Promise<BrainContext> => {
    const response = await api.put<BrainContext>(`/pfp/constructor/brain-contexts/${id}`, data)
    return response.data
  },
  deleteBrainContext: async (id: number): Promise<void> => {
    await api.delete(`/pfp/constructor/brain-contexts/${id}`)
  },

  // Bots
  listBots: async (): Promise<BotInfo[]> => {
    const response = await api.get<BotInfo[]>('/pfp/constructor/bots')
    return response.data
  },

  // Clients
  listClients: async (): Promise<ConstructorClient[]> => {
    const response = await api.get<ConstructorClient[]>('/pfp/constructor/clients')
    return response.data
  },
}

// --- AI B2C Site API ---

export interface B2cBrainContext {
  id?: number
  project_id?: number
  title: string
  content: string
  is_active: boolean
  priority: number
  created_at?: string
  updated_at?: string
}

export interface B2cStageContext {
  id?: number
  project_id?: number
  stage_key: string
  title: string
  content: string
  is_active: boolean
  priority: number
  created_at?: string
  updated_at?: string
}

export const aiB2cAPI = {
  // Brain Contexts
  listBrainContexts: async (): Promise<B2cBrainContext[]> => {
    const response = await api.get<B2cBrainContext[]>('/admin/ai-b2c/brain-contexts')
    return response.data
  },
  createBrainContext: async (data: Partial<B2cBrainContext>): Promise<B2cBrainContext> => {
    const response = await api.post<B2cBrainContext>('/admin/ai-b2c/brain-contexts', data)
    return response.data
  },
  updateBrainContext: async (id: number, data: Partial<B2cBrainContext>): Promise<B2cBrainContext> => {
    const response = await api.put<B2cBrainContext>(`/admin/ai-b2c/brain-contexts/${id}`, data)
    return response.data
  },
  deleteBrainContext: async (id: number): Promise<void> => {
    await api.delete(`/admin/ai-b2c/brain-contexts/${id}`)
  },

  // Stage Contexts
  listStages: async (): Promise<B2cStageContext[]> => {
    const response = await api.get<B2cStageContext[]>('/admin/ai-b2c/stages')
    return response.data
  },
  createStage: async (data: Partial<B2cStageContext>): Promise<B2cStageContext> => {
    const response = await api.post<B2cStageContext>('/admin/ai-b2c/stages', data)
    return response.data
  },
  updateStage: async (id: number, data: Partial<B2cStageContext>): Promise<B2cStageContext> => {
    const response = await api.put<B2cStageContext>(`/admin/ai-b2c/stages/${id}`, data)
    return response.data
  },
  deleteStage: async (id: number): Promise<void> => {
    await api.delete(`/admin/ai-b2c/stages/${id}`)
  },
}

export const homeOwnersAPI = {
  // Products
  listProducts: async (): Promise<HomeOwnersProduct[]> => {
    // Контракт: { success: true, data: [...] }, в каждом продукте project_id (number | null)
    try {
      const response = await api.get<{ success: boolean; data: HomeOwnersProduct[] }>('/admin/insurance/home-owners/products')
      if (response.data?.success === true && Array.isArray(response.data.data)) {
        return response.data.data
      }
      return []
    } catch (e) {
      // Fallback to pfp/products with filter if admin/insurance/home-owners/products GET is not defined
      const response = await api.get<any>('/pfp/products', {
        params: { product_type: 'HOME_OWNERS' }
      })
      return Array.isArray(response.data) ? response.data : (response.data?.data || [])
    }
  },
  upsertProduct: async (data: HomeOwnersProduct): Promise<void> => {
    await api.post('/admin/insurance/home-owners/products', data)
  },
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/admin/insurance/home-owners/products/${id}`)
  },

  // Tariffs
  listTariffs: async (productId?: number): Promise<HomeOwnersTariff[]> => {
    const response = await api.get<any>('/admin/insurance/home-owners/tariffs', {
      params: { product_id: productId }
    })
    // Handle { success: true, data: [...] } or direct array
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data
    }
    if (response.data && response.data.success && Array.isArray(response.data.tariffs)) {
      return response.data.tariffs
    }
    if (Array.isArray(response.data)) {
      return response.data
    }
    return []
  },
  upsertTariff: async (data: HomeOwnersTariff): Promise<void> => {
    await api.post('/admin/insurance/home-owners/tariffs', data)
  },
  deleteTariff: async (id: number): Promise<void> => {
    await api.delete(`/admin/insurance/home-owners/tariffs/${id}`)
  },
}

// --- PFP Calculations ---

export interface PfpCalculation {
  pfp_id: number
  client_fio: string
  agent_fio: string
  agent_email: string
  status: 'THINKING' | 'BOUGHT' | 'REFUSED'
  has_calculation: boolean
  created_at: string
}

export interface PfpCalculationResponse {
  data: PfpCalculation[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/** Элемент списка клиентов агента (GET /pfp/clients). owner_label приходит при agents_see_all_clients. */
export interface PfpClientItem {
  id: number
  owner_label?: string
  first_name?: string
  last_name?: string
  [key: string]: unknown
}
export interface PfpClientsResponse {
  data: PfpClientItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const pfpAPI = {
  listCalculations: async (params?: {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
  }): Promise<PfpCalculationResponse> => {
    const response = await api.get<PfpCalculationResponse>('/admin/pfp/calculations', { params })
    return response.data
  },
  /** Список клиентов агента (или всех клиентов проекта при agents_see_all_clients). */
  getClients: async (params?: {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
  }): Promise<PfpClientsResponse> => {
    const response = await api.get<PfpClientsResponse>('/pfp/clients', { params })
    return response.data
  },
}

// --- Admin Management API (Super Admin) ---

export interface PartnerAgentIdProjectSettings {
  label?: string
  require_on_admin_create?: boolean
  require_on_public_registration?: boolean
}

export interface ProjectSettings {
  agents_see_all_clients?: boolean
  partner_agent_id?: PartnerAgentIdProjectSettings
}

export interface Project {
  id: number
  name: string
  slug: string
  public_key: string
  status: 'active' | 'suspended'
  settings?: ProjectSettings
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: number
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'agent'
  projectId: number | null
  is_active: boolean
  projectName?: string
}

export const adminManagementAPI = {
  // Projects
  listProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/admin/projects')
    return response.data
  },
  getProject: async (id: number): Promise<Project> => {
    const response = await api.get<Project>(`/admin/projects/${id}`)
    return response.data
  },
  createProject: async (data: { name: string; slug?: string; settings?: ProjectSettings }): Promise<Project> => {
    const response = await api.post<Project>('/admin/projects', data)
    return response.data
  },
  updateProject: async (id: number, data: { name?: string; status?: string; settings?: ProjectSettings }): Promise<Project> => {
    const response = await api.put<Project>(`/admin/projects/${id}`, data)
    return response.data
  },

  // Global Users
  listUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get<AdminUser[]>('/admin/users')
    return response.data
  },
  createUser: async (data: Partial<AdminUser> & { password?: string }): Promise<AdminUser> => {
    const response = await api.post<AdminUser>('/admin/users', data)
    return response.data
  },
  updateUser: async (id: number, data: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await api.put<AdminUser>(`/admin/users/${id}`, data)
    return response.data
  },
}

// --- Content Factory (admin) IDE v1 ---
// Headers JWT + X-Project-Key via interceptor (localStorage token / project_key)
// Spec: docs / OpenAPI Content Factory v1 (brief + chat SSE + media)

export type OfferStatus = 'draft' | 'published' | 'archived'

export type IdeAgentId = 'orchestrator' | 'site_architect' | 'code_generator'

export const IDE_AGENT_LABELS: Record<string, string> = {
  orchestrator: 'Планировщик',
  site_architect: 'Бизнес-аналитик',
  code_generator: 'Программист',
}

export type TemplateOrientation = 'portrait' | 'landscape'
export type TemplateTheme = 'light' | 'dark'

export const DEFAULT_TEMPLATE_ID = 'finam-a4-portrait-light'
export const MIN_PAGE_COUNT = 1
export const MAX_PAGE_COUNT = 20
export const DEFAULT_PAGE_COUNT = 1

export function clampPageCount(value: number): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return DEFAULT_PAGE_COUNT
  return Math.min(MAX_PAGE_COUNT, Math.max(MIN_PAGE_COUNT, n))
}

export interface ContentFactoryTemplate {
  id: string
  title: string
  orientation?: TemplateOrientation
  theme?: TemplateTheme
  format?: string
  page_size?: string
  preview_url: string
}

/** @deprecated legacy CRUD templates — use ContentFactoryTemplate picker */
export interface ContentTemplate {
  id: number
  project_id: number
  title: string
  description?: string | null
  html_source: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContentTemplateCreate {
  title: string
  description?: string | null
  html_source: string
  slots?: Record<string, unknown>
  is_active?: boolean
}

export interface ContentOffer {
  id: number
  project_id: number
  title: string
  kind: string
  brief?: string | null
  base_template_id?: string | null
  page_count?: number
  ide_session_id?: string | null
  cta_url_base?: string | null
  cta_label?: string | null
  generated_html?: string | null
  status: OfferStatus
  expires_at?: string | null
  published_at?: string | null
  created_at?: string
  updated_at?: string
  // legacy optional fields (v0.1)
  template_id?: number | null
  payload?: Record<string, unknown>
}

export interface ContentOfferCreate {
  title: string
  brief?: string | null
  base_template_id?: string
  page_count?: number
  kind?: string
  cta_url_base?: string | null
  cta_label?: string | null
  expires_at?: string | null
  generate?: boolean
}

export interface ContentOfferPatch {
  title?: string
  brief?: string | null
  kind?: string
  base_template_id?: string
  page_count?: number
  cta_url_base?: string | null
  cta_label?: string | null
  expires_at?: string | null
}

export interface ContentChatAttachment {
  ref: string
  role?: string
  instruction?: string
}

export interface ContentChatMessage {
  id?: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at?: string
  attachments?: ContentChatAttachment[]
}

export interface ContentChatRequest {
  content: string
  attachments?: ContentChatAttachment[]
}

export interface ContentChatPostResponse {
  offer?: ContentOffer
  messages?: ContentChatMessage[]
  preview_html?: string
  assistant_message?: string
  validation?: { cta_slot_present?: boolean }
}

export type MediaFileKind = 'logo' | 'hero' | 'icon' | 'chart_data' | 'text' | 'other'

export interface MediaUploadFile {
  name: string
  content_base64: string
  content_type?: string
  kind?: MediaFileKind
}

export interface MediaFileRef {
  ref: string
  name: string
  content_type?: string
  kind?: string
}

export interface SseProgressEvent {
  agent?: IdeAgentId | string
  message?: string
  status?: string
}

export interface SseResultEvent {
  html?: string
  assistant_message?: string
}

export interface SseErrorEvent {
  error?: string
  message?: string
}

export type ChatStreamHandlers = {
  onHello?: () => void
  onProgress?: (event: SseProgressEvent) => void
  onResult?: (event: SseResultEvent) => void
  onDone?: () => void
  onError?: (event: SseErrorEvent) => void
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.files)) return obj.files as T[]
  }
  return []
}

/** Parse API error for UI (422 CTA removed by AI) */
export function getContentFactoryErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = err.response?.data as
      | { detail?: string | { msg?: string }[]; message?: string; error?: string }
      | undefined

    if (status === 422) {
      return 'AI удалил кнопку CTA — попросите вернуть <a data-cta-slot>'
    }
    if (status === 413) {
      return 'Сервер отклонил тело запроса (413 Request Entity Too Large). Лимит на nginx/backend, не на фронте.'
    }
    if (status === 503) return 'IDE не настроен на backend'
    if (status === 504) return 'Таймаут генерации — повторите'
    if (status === 400) {
      if (typeof data?.detail === 'string') return data.detail
      return data?.message || data?.error || 'Некорректный запрос (400)'
    }
    if (status === 401) return 'Не авторизован — проверьте JWT'
    if (status === 403) return 'Нет доступа — проверьте x-project-key и роль'

    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d) => d.msg || JSON.stringify(d)).join('; ')
    }
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return 'Неизвестная ошибка'
}

function parseSseChunk(buffer: string, handlers: ChatStreamHandlers): string {
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const block of parts) {
    if (!block.trim()) continue
    let eventName = 'message'
    const dataLines: string[] = []
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    const raw = dataLines.join('\n')
    let data: Record<string, unknown> = {}
    if (raw) {
      try {
        data = JSON.parse(raw) as Record<string, unknown>
      } catch {
        data = { message: raw }
      }
    }
    switch (eventName) {
      case 'hello':
        handlers.onHello?.()
        break
      case 'progress':
        handlers.onProgress?.(data as SseProgressEvent)
        break
      case 'result':
        handlers.onResult?.(data as SseResultEvent)
        break
      case 'done':
        handlers.onDone?.()
        break
      case 'error':
        handlers.onError?.(data as SseErrorEvent)
        break
      default:
        break
    }
  }
  return rest
}

function resolveContentFactoryPath(relativePath: string): string {
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }
  if (relativePath.startsWith('/api/')) {
    return relativePath.slice(4)
  }
  if (relativePath.startsWith('/')) {
    return relativePath
  }
  return `/${relativePath}`
}

export const contentFactoryAPI = {
  listOffers: async (status?: OfferStatus | ''): Promise<ContentOffer[]> => {
    const response = await api.get('/admin/content-factory/offers', {
      params: status ? { status } : undefined,
    })
    return unwrapList<ContentOffer>(response.data)
  },
  getOffer: async (id: number, opts?: { sync?: boolean }): Promise<ContentOffer> => {
    const response = await api.get<ContentOffer>(`/admin/content-factory/offers/${id}`, {
      params: opts?.sync ? { sync: '1' } : undefined,
    })
    return response.data
  },
  createOffer: async (data: ContentOfferCreate): Promise<ContentOffer> => {
    const response = await api.post<ContentOffer>('/admin/content-factory/offers', data)
    return response.data
  },
  patchOffer: async (id: number, data: ContentOfferPatch): Promise<ContentOffer> => {
    const response = await api.patch<ContentOffer>(`/admin/content-factory/offers/${id}`, data)
    return response.data
  },
  publishOffer: async (id: number): Promise<ContentOffer> => {
    const response = await api.post<ContentOffer>(
      `/admin/content-factory/offers/${id}/publish`,
      {}
    )
    return response.data
  },
  unpublishOffer: async (id: number): Promise<ContentOffer> => {
    const response = await api.post<ContentOffer>(
      `/admin/content-factory/offers/${id}/unpublish`,
      {}
    )
    return response.data
  },
  archiveOffer: async (id: number): Promise<void> => {
    await api.delete(`/admin/content-factory/offers/${id}`)
  },
  getChatMessages: async (id: number): Promise<ContentChatMessage[]> => {
    const response = await api.get(`/admin/content-factory/offers/${id}/chat/messages`)
    return unwrapList<ContentChatMessage>(response.data)
  },
  postChatMessage: async (
    id: number,
    body: ContentChatRequest
  ): Promise<ContentChatPostResponse> => {
    const response = await api.post<ContentChatPostResponse>(
      `/admin/content-factory/offers/${id}/chat/messages`,
      body
    )
    return response.data
  },
  postChatMessageStream: async (
    id: number,
    body: ContentChatRequest,
    handlers: ChatStreamHandlers
  ): Promise<void> => {
    const token = localStorage.getItem('token')
    const projectKey = localStorage.getItem('project_key')
    const url = `${API_BASE_URL}/admin/content-factory/offers/${id}/chat/messages?stream=1`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(projectKey ? { 'X-Project-Key': projectKey } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        const errBody = await res.json()
        if (res.status === 422) {
          message = 'AI удалил кнопку CTA — попросите вернуть <a data-cta-slot>'
        } else if (res.status === 503) message = 'IDE не настроен на backend'
        else if (res.status === 504) message = 'Таймаут генерации — повторите'
        else if (typeof errBody?.detail === 'string') message = errBody.detail
        else if (errBody?.message) message = errBody.message
      } catch {
        /* ignore */
      }
      handlers.onError?.({ error: String(res.status), message })
      throw new Error(message)
    }

    if (!res.body) {
      const message = 'Пустой SSE stream'
      handlers.onError?.({ message })
      throw new Error(message)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      buffer = parseSseChunk(buffer, handlers)
    }
    if (buffer.trim()) parseSseChunk(buffer + '\n\n', handlers)
    handlers.onDone?.()
  },
  listMedia: async (id: number): Promise<MediaFileRef[]> => {
    const response = await api.get(`/admin/content-factory/offers/${id}/media`)
    if (response.data && Array.isArray(response.data.files)) {
      return response.data.files
    }
    return unwrapList<MediaFileRef>(response.data)
  },
  uploadMedia: async (
    id: number,
    files: MediaUploadFile[]
  ): Promise<MediaFileRef[]> => {
    const response = await api.post(`/admin/content-factory/offers/${id}/media`, { files })
    if (response.data && Array.isArray(response.data.files)) {
      return response.data.files
    }
    return unwrapList<MediaFileRef>(response.data)
  },
  healthIde: async (): Promise<Record<string, unknown>> => {
    const response = await api.get('/admin/content-factory/health/ide')
    return response.data
  },
  listTemplates: async (): Promise<ContentFactoryTemplate[]> => {
    const response = await api.get('/admin/content-factory/templates')
    const data = response.data as { templates?: ContentFactoryTemplate[] }
    if (Array.isArray(data?.templates)) return data.templates
    return unwrapList<ContentFactoryTemplate>(response.data)
  },
  fetchTemplatePreviewHtml: async (previewUrl: string): Promise<string> => {
    const path = resolveContentFactoryPath(previewUrl)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const token = localStorage.getItem('token')
      const projectKey = localStorage.getItem('project_key')
      const res = await fetch(path, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(projectKey ? { 'X-Project-Key': projectKey } : {}),
        },
      })
      if (!res.ok) {
        const err = new Error(res.status === 404 ? 'Шаблон не найден' : `HTTP ${res.status}`) as Error & {
          status?: number
        }
        err.status = res.status
        throw err
      }
      return res.text()
    }
    try {
      const response = await api.get<string>(path, {
        responseType: 'text',
        transformResponse: [(data) => data],
        headers: { Accept: 'text/html' },
      })
      return response.data
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        const notFound = new Error('Шаблон не найден') as Error & { status?: number }
        notFound.status = 404
        throw notFound
      }
      throw err
    }
  },
}

export default api


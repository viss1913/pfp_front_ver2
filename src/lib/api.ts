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
  min_term_months: number
  max_term_months: number
  min_amount: number
  max_amount: number
  yields?: ProductYield[]
  is_default?: boolean
}

export interface ProductYield {
  term_from_months: number
  term_to_months: number
  amount_from: number
  amount_to: number
  yield_percent: number
}

export interface Portfolio {
  id: number
  name: string
  currency: string
  amount_from: number
  amount_to: number
  term_from_months: number
  term_to_months: number
  classes?: any[]
  riskProfiles?: PortfolioRiskProfile[]
}

export interface PortfolioRiskProfile {
  profile_type: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'
  potential_yield_percent: number
  instruments: PortfolioInstrument[]
}

export interface PortfolioInstrument {
  product_id: number
  bucket_type: 'INITIAL_CAPITAL' | 'TOP_UP'
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

export default api


import type { ProjectSettings } from '@/lib/api'

export const PARTNER_AGENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export interface PartnerAgentIdConfig {
  label: string
  requiredOnCreate: boolean
}

export function getPartnerAgentIdConfig(settings?: ProjectSettings): PartnerAgentIdConfig {
  const cfg = settings?.partner_agent_id
  return {
    label: cfg?.label?.trim() || 'ID партнёра',
    requiredOnCreate: Boolean(cfg?.require_on_admin_create),
  }
}

export function validatePartnerAgentId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!PARTNER_AGENT_ID_PATTERN.test(trimmed)) {
    return 'Допустимы латиница, цифры, _ и -, от 1 до 64 символов'
  }
  return null
}

export function isPartnerRefUrl(value: string): boolean {
  const v = value.trim()
  return /^https?:\/\//i.test(v)
}

export function formatAgentSaveError(err: unknown): string {
  const ax = err as {
    response?: { status?: number; data?: { message?: string; error?: string } }
    message?: string
  }
  const status = ax.response?.status
  const msg = ax.response?.data?.message || ax.response?.data?.error || ax.message
  if (status === 409) {
    return msg || 'Агент с таким ID партнёра уже зарегистрирован в проекте'
  }
  if (status === 400) {
    return msg || 'Некорректные данные'
  }
  return msg || 'Ошибка при сохранении'
}

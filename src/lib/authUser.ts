export type AppRole = 'super_admin' | 'admin' | 'agent'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: AppRole
  agentId: number
}

/** Приводит role с бэка к формату, который ждёт админка */
export function normalizeRole(role: unknown): AppRole {
  if (role == null || role === '') return 'agent'

  const r = String(role).trim().toLowerCase().replace(/[\s-]+/g, '_')

  if (r === 'super_admin' || r === 'superadmin') return 'super_admin'
  if (r === 'admin' || r === 'administrator') return 'admin'
  if (r === 'agent') return 'agent'

  return r as AppRole
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return normalizeRole(role) === 'super_admin'
}

export function isAdmin(role: string | undefined | null): boolean {
  const r = normalizeRole(role)
  return r === 'admin' || r === 'super_admin'
}

function roleFromJwt(token: string): string | undefined {
  try {
    const part = token.split('.')[1]
    if (!part) return undefined
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role ?? payload.user_role ?? payload.userRole
  } catch {
    return undefined
  }
}

/** Собирает user из login/me (поддержка snake_case и разных написаний role) */
export function parseAuthUser(
  raw: Record<string, unknown>,
  token?: string | null
): AuthUser {
  const roleRaw =
    raw.role ?? raw.user_role ?? raw.userRole ?? (token ? roleFromJwt(token) : undefined)

  return {
    id: Number(raw.id ?? 0),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? raw.email ?? ''),
    role: normalizeRole(roleRaw),
    agentId: Number(raw.agentId ?? raw.agent_id ?? 0),
  }
}

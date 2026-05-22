import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, Project } from '@/lib/api'
import { AuthUser, parseAuthUser } from '@/lib/authUser'

type User = AuthUser

interface AuthContextType {
  user: User | null
  activeProject: Project | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  selectProject: (project: Project | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const projectStr = localStorage.getItem('active_project')

    if (token && userStr) {
      try {
        const stored = parseAuthUser(JSON.parse(userStr) as Record<string, unknown>, token)
        setUser(stored)
        authAPI
          .me()
          .then((me) => {
            const fresh = parseAuthUser(
              { ...stored, ...(me as Record<string, unknown>) },
              token
            )
            setUser(fresh)
            localStorage.setItem('user', JSON.stringify(fresh))
            console.info('[Auth] role:', fresh.role)
          })
          .catch(() => {})
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }

    if (projectStr) {
      try {
        const project = JSON.parse(projectStr)
        setActiveProject(project)
      } catch (e) {
        localStorage.removeItem('active_project')
        localStorage.removeItem('project_key')
        localStorage.removeItem('project_id')
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password })
    localStorage.setItem('token', response.token)

    let user = parseAuthUser(
      response.user as unknown as Record<string, unknown>,
      response.token
    )

    try {
      const me = await authAPI.me()
      user = parseAuthUser({ ...user, ...(me as Record<string, unknown>) }, response.token)
    } catch {
      // оставляем user из login
    }

    console.info('[Auth] login role:', user.role, { email: user.email })
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const selectProject = (project: Project | null) => {
    sessionStorage.clear() // Очищаем кэш справочников при смене контекста
    if (project) {
      localStorage.setItem('active_project', JSON.stringify(project))
      localStorage.setItem('project_key', project.public_key)
      localStorage.setItem('project_id', project.id.toString())
      setActiveProject(project)
    } else {
      localStorage.removeItem('active_project')
      localStorage.removeItem('project_key')
      localStorage.removeItem('project_id')
      setActiveProject(null)
    }
  }

  const logout = () => {
    sessionStorage.clear()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('active_project')
    localStorage.removeItem('project_key')
    localStorage.removeItem('project_id')
    setUser(null)
    setActiveProject(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProject,
        isAuthenticated: !!user,
        login,
        logout,
        selectProject,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


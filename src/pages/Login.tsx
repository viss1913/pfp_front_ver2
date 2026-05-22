import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { error?: string; message?: string } }
        message?: string
        code?: string
      }
      if (!axiosErr.response) {
        const insecureApi =
          window.location.protocol === 'https:' &&
          import.meta.env.VITE_API_BASE_URL?.trim().startsWith('http:')
        setError(
          insecureApi
            ? 'API на HTTP, а сайт на HTTPS — браузер блокирует запрос. Укажи HTTPS в VITE_API_BASE_URL или убери переменную.'
            : axiosErr.code === 'ERR_NETWORK'
              ? 'Сервер API недоступен (сеть/CORS). Проверь VITE_API_BASE_URL на Vercel и redeploy.'
              : 'Не удалось связаться с API. Проверь адрес бэкенда и redeploy.'
        )
      } else {
        setError(
          axiosErr.response.data?.error ||
            axiosErr.response.data?.message ||
            'Ошибка входа'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Вход в систему</CardTitle>
          <CardDescription>
            Введите ваши учетные данные для доступа к админ-панели
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pfp.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}












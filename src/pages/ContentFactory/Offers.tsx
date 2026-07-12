import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ContentOffer,
  OfferStatus,
  contentFactoryAPI,
  getContentFactoryErrorMessage,
} from '@/lib/api'
import { cn } from '@/lib/utils'

const FILTERS: { value: OfferStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU')
  } catch {
    return iso
  }
}

function isExpiringSoon(expiresAt?: string | null) {
  if (!expiresAt) return false
  const exp = new Date(expiresAt).getTime()
  if (Number.isNaN(exp)) return false
  const days = (exp - Date.now()) / (1000 * 60 * 60 * 24)
  return days >= 0 && days < 7
}

function StatusBadge({ status }: { status: OfferStatus }) {
  const map: Record<OfferStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-orange-100 text-orange-800',
  }
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', map[status])}>
      {status}
    </span>
  )
}

export default function ContentFactoryOffers() {
  const [status, setStatus] = useState<OfferStatus | ''>('')
  const [items, setItems] = useState<ContentOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await contentFactoryAPI.listOffers(status)
      setItems(data)
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <PackageOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Офферы</h1>
            <p className="text-sm text-muted-foreground">
              Draft → generate → AI-чат → publish
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Обновить
          </Button>
          <Button asChild>
            <Link to="/content-factory/offers/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать draft
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={status === f.value ? 'default' : 'outline'}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Published at</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Нет офферов
                </TableCell>
              </TableRow>
            ) : (
              items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {o.title}
                      {isExpiringSoon(o.expires_at) && (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                          Скоро истекает
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.kind || '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(o.expires_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(o.published_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" asChild className="h-auto p-0">
                      <Link to={`/content-factory/offers/${o.id}`}>Открыть</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

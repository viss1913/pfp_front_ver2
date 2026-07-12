import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  ContentChatMessage,
  ContentOffer,
  ContentTemplate,
  contentFactoryAPI,
  getContentFactoryErrorMessage,
} from '@/lib/api'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Мета' },
  { id: 2, label: 'Payload' },
  { id: 3, label: 'Generate' },
  { id: 4, label: 'AI-чат' },
  { id: 5, label: 'Publish' },
] as const

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-orange-100 text-orange-800',
  }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        map[status] || 'bg-gray-100'
      )}
    >
      {status}
    </span>
  )
}

export default function ContentFactoryOfferForm() {
  const { id: idParam } = useParams()
  const isNew = !idParam || idParam === 'new'
  const id = isNew ? null : Number(idParam)
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [offer, setOffer] = useState<ContentOffer | null>(null)
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [messages, setMessages] = useState<ContentChatMessage[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [useLlm, setUseLlm] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('product')
  const [templateId, setTemplateId] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [ctaLabel, setCtaLabel] = useState('Оформить')
  const [expiresAt, setExpiresAt] = useState('')
  const [payloadText, setPayloadText] = useState(
    JSON.stringify({ title: '', body: '' }, null, 2)
  )

  const syncForm = (o: ContentOffer) => {
    setOffer(o)
    setTitle(o.title || '')
    setKind(o.kind || 'product')
    setTemplateId(o.template_id != null ? String(o.template_id) : '')
    setCtaUrl(o.cta_url_base || '')
    setCtaLabel(o.cta_label || 'Оформить')
    setExpiresAt(toDatetimeLocal(o.expires_at))
    setPayloadText(JSON.stringify(o.payload ?? {}, null, 2))
  }

  const load = useCallback(async () => {
    setError(null)
    try {
      const tpls = await contentFactoryAPI.listTemplates()
      setTemplates(tpls.filter((t) => t.is_active !== false))
      if (id) {
        setLoading(true)
        const o = await contentFactoryAPI.getOffer(id)
        syncForm(o)
        try {
          const msgs = await contentFactoryAPI.getChatMessages(id)
          setMessages(msgs)
        } catch {
          setMessages([])
        }
      }
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const parsePayload = (): Record<string, unknown> | null => {
    try {
      return JSON.parse(payloadText || '{}')
    } catch {
      alert('Payload: невалидный JSON')
      return null
    }
  }

  const buildBody = () => {
    const payload = parsePayload()
    if (payload === null) return null
    return {
      title: title.trim(),
      kind: kind.trim() || 'product',
      template_id: templateId ? Number(templateId) : null,
      payload,
      cta_url_base: ctaUrl.trim() || null,
      cta_label: ctaLabel.trim() || null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    }
  }

  const onCreate = async () => {
    if (!title.trim()) {
      alert('Title обязателен')
      return
    }
    const body = buildBody()
    if (!body) return
    setBusy(true)
    setError(null)
    try {
      const created = await contentFactoryAPI.createOffer(body)
      navigate(`/content-factory/offers/${created.id}`, { replace: true })
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onSave = async (): Promise<ContentOffer | null> => {
    if (!id) return null
    const body = buildBody()
    if (!body) return null
    setBusy(true)
    setError(null)
    try {
      const updated = await contentFactoryAPI.updateOffer(id, body)
      syncForm(updated)
      return updated
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
      return null
    } finally {
      setBusy(false)
    }
  }

  const onGenerate = async () => {
    if (!id) return
    await onSave()
    setBusy(true)
    setError(null)
    try {
      const result = await contentFactoryAPI.generateOffer(id, useLlm)
      syncForm(result)
      setStep(3)
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !chatInput.trim()) return
    setBusy(true)
    setError(null)
    try {
      const res = await contentFactoryAPI.postChatMessage(id, chatInput.trim())
      if (res.offer) syncForm(res.offer)
      if (res.messages) setMessages(res.messages)
      setChatInput('')
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onPublish = async () => {
    if (!id || !offer?.generated_html) {
      alert('Сначала сгенерируйте HTML')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await contentFactoryAPI.publishOffer(id)
      syncForm(result)
      setStep(5)
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onUnpublish = async () => {
    if (!id) return
    setBusy(true)
    try {
      const result = await contentFactoryAPI.unpublishOffer(id)
      syncForm(result)
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onArchive = async () => {
    if (!id) return
    if (!window.confirm('Архивировать оффер (DELETE)?')) return
    setBusy(true)
    try {
      await contentFactoryAPI.archiveOffer(id)
      navigate('/content-factory/offers')
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>
  }

  const hasHtml = Boolean(offer?.generated_html)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-auto px-2">
            <Link to="/content-factory/offers">
              <ArrowLeft className="mr-1 h-4 w-4" />К списку
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <PackageOpen className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? 'Новый оффер (draft)' : `Оффер #${offer?.id}: ${offer?.title}`}
            </h1>
            {offer && <StatusBadge status={offer.status} />}
          </div>
        </div>
        {!isNew && offer && (
          <div className="flex flex-wrap gap-2">
            {offer.status === 'published' && (
              <Button variant="outline" onClick={onUnpublish} disabled={busy}>
                Unpublish
              </Button>
            )}
            <Button variant="destructive" onClick={onArchive} disabled={busy}>
              Archive
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isNew && (
        <div className="flex flex-wrap gap-1">
          {STEPS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={step === s.id ? 'default' : 'outline'}
              onClick={() => setStep(s.id)}
            >
              {s.id}. {s.label}
            </Button>
          ))}
        </div>
      )}

      {/* Create or Meta */}
      {(isNew || step === 1) && (
        <div className="mx-auto max-w-2xl space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">{isNew ? 'Создать draft' : '1. Мета'}</h2>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Kind</Label>
            <Input value={kind} onChange={(e) => setKind(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Template</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">— без шаблона —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>cta_url_base</Label>
            <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>cta_label</Label>
            <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>expires_at</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          {isNew && (
            <div className="space-y-2">
              <Label>Payload (JSON)</Label>
              <Textarea
                className="min-h-[140px] font-mono text-xs"
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}
          <div className="flex gap-2">
            {isNew ? (
              <Button onClick={onCreate} disabled={busy || !title.trim()}>
                {busy ? 'Создание…' : 'Создать draft'}
              </Button>
            ) : (
              <>
                <Button onClick={onSave} disabled={busy}>
                  Сохранить
                </Button>
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Далее → Payload
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {!isNew && step === 2 && (
        <div className="mx-auto max-w-2xl space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">2. Payload (JSON)</h2>
          <p className="text-xs text-muted-foreground">
            Ключи → placeholders в шаблоне
          </p>
          <Textarea
            className="min-h-[280px] font-mono text-xs"
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={busy}>
              Сохранить
            </Button>
            <Button variant="secondary" onClick={() => setStep(3)}>
              Далее → Generate
            </Button>
          </div>
        </div>
      )}

      {!isNew && step === 3 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-6">
            <h2 className="text-lg font-semibold">3. Generate HTML</h2>
            <p className="text-sm text-muted-foreground">
              POST /admin/content-factory/offers/{'{id}'}/generate
            </p>
            <div className="flex items-center gap-2">
              <Switch checked={useLlm} onCheckedChange={setUseLlm} id="use_llm" />
              <Label htmlFor="use_llm">use_llm (полировка LLM)</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onGenerate} disabled={busy}>
                {busy ? 'Генерация…' : 'Generate'}
              </Button>
              <Button variant="outline" onClick={() => setStep(4)}>
                Далее → AI-чат
              </Button>
            </div>
            {!hasHtml && (
              <p className="text-sm text-amber-700">
                Publish недоступен без generated_html
              </p>
            )}
          </div>
          <HtmlPreview html={offer?.generated_html} />
        </div>
      )}

      {!isNew && step === 4 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <HtmlPreview html={offer?.generated_html} height={560} />
          <div className="flex h-[560px] flex-col overflow-hidden rounded-lg border">
            <div className="border-b px-4 py-3">
              <h2 className="text-lg font-semibold">4. AI-чат</h2>
              <p className="text-xs text-muted-foreground">
                LLM ~5–30 сек. 422 = CTA удалён AI
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  История пуста. Например: «увеличь заголовок»
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className={cn(
                    'max-w-[90%] rounded-md px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'mr-auto bg-muted'
                  )}
                >
                  <div className="mb-0.5 text-[10px] uppercase opacity-70">{m.role}</div>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={onSendChat} className="flex gap-2 border-t p-3">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Текст правки…"
                disabled={busy || !hasHtml}
              />
              <Button type="submit" disabled={busy || !chatInput.trim() || !hasHtml}>
                {busy ? '…' : 'Send'}
              </Button>
            </form>
            <div className="border-t px-3 py-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(5)}>
                Далее → Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isNew && step === 5 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-6">
            <h2 className="text-lg font-semibold">5. Publish</h2>
            <p className="text-sm text-muted-foreground">
              В каталог агентов. Disabled без generated_html.
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{offer && <StatusBadge status={offer.status} />}</dd>
              <dt className="text-muted-foreground">Published at</dt>
              <dd>
                {offer?.published_at
                  ? new Date(offer.published_at).toLocaleString('ru-RU')
                  : '—'}
              </dd>
              <dt className="text-muted-foreground">Has HTML</dt>
              <dd>
                {hasHtml ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">да</Badge>
                ) : (
                  'нет'
                )}
              </dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onPublish}
                disabled={busy || !hasHtml || offer?.status === 'published'}
              >
                Publish
              </Button>
              {offer?.status === 'published' && (
                <Button variant="outline" onClick={onUnpublish} disabled={busy}>
                  Unpublish → draft
                </Button>
              )}
            </div>
            {!hasHtml && (
              <p className="text-sm text-destructive">
                Publish недоступен: нет generated_html
              </p>
            )}
          </div>
          <HtmlPreview html={offer?.generated_html} />
        </div>
      )}
    </div>
  )
}

function HtmlPreview({
  html,
  height = 420,
}: {
  html?: string | null
  height?: number
}) {
  if (!html) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
        style={{ minHeight: height }}
      >
        Нет HTML для превью
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted px-3 py-1.5 text-xs text-muted-foreground">
        generated_html preview
      </div>
      <iframe
        title="offer-preview"
        sandbox=""
        srcDoc={html}
        className="w-full bg-white"
        style={{ height, border: 0 }}
      />
    </div>
  )
}

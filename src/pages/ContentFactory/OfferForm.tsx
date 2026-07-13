import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Paperclip, Send, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ContentChatAttachment,
  ContentChatMessage,
  ContentOffer,
  IDE_AGENT_LABELS,
  MediaFileKind,
  SseProgressEvent,
  contentFactoryAPI,
  getContentFactoryErrorMessage,
} from '@/lib/api'
import { cn } from '@/lib/utils'

type PreviewViewport = 'desktop' | 'tablet' | 'a4'

function toDatetimeLocal(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function StatusBadge({ status, dark }: { status: string; dark?: boolean }) {
  const light: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-900',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-orange-100 text-orange-800',
  }
  const darkMap: Record<string, string> = {
    draft: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30',
    published: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30',
    archived: 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30',
  }
  const labels: Record<string, string> = {
    draft: 'Черновик',
    published: 'Опубликован',
    archived: 'Архив',
  }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        dark ? darkMap[status] || 'bg-white/10 text-white' : light[status] || 'bg-gray-100'
      )}
    >
      {labels[status] || status}
    </span>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.includes(',') ? result.split(',')[1]! : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function guessMediaKind(file: File): MediaFileKind {
  if (file.type.startsWith('image/')) {
    if (/logo/i.test(file.name)) return 'logo'
    if (/hero|banner/i.test(file.name)) return 'hero'
    return 'logo'
  }
  if (/\.(csv|json|xlsx?)$/i.test(file.name)) return 'chart_data'
  return 'other'
}

export default function ContentFactoryOfferForm() {
  const { id: idParam } = useParams()
  const isNew = !idParam || idParam === 'new'
  const id = isNew ? null : Number(idParam)
  const navigate = useNavigate()

  const [offer, setOffer] = useState<ContentOffer | null>(null)
  const [messages, setMessages] = useState<ContentChatMessage[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [busy, setBusy] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<ContentChatAttachment[]>([])
  const [progressHistory, setProgressHistory] = useState<SseProgressEvent[]>([])
  const [viewport, setViewport] = useState<PreviewViewport>('a4')
  const [metaOpen, setMetaOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('')
  const [kind, setKind] = useState('product')
  const [ctaUrl, setCtaUrl] = useState('')
  const [ctaLabel, setCtaLabel] = useState('Оформить')
  const [expiresAt, setExpiresAt] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const syncForm = (o: ContentOffer) => {
    setOffer(o)
    setTitle(o.title || '')
    setBrief(o.brief || '')
    setKind(o.kind || 'product')
    setCtaUrl(o.cta_url_base || '')
    setCtaLabel(o.cta_label || 'Оформить')
    setExpiresAt(toDatetimeLocal(o.expires_at))
  }

  const load = useCallback(
    async (sync = false) => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const o = await contentFactoryAPI.getOffer(id, { sync })
        syncForm(o)
        try {
          const msgs = await contentFactoryAPI.getChatMessages(id)
          setMessages(msgs)
        } catch {
          setMessages([])
        }
      } catch (err) {
        setError(getContentFactoryErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    if (!isNew) load()
  }, [isNew, load])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, progressHistory, streaming])

  const willGenerate = brief.trim().length > 0

  const onCreate = async () => {
    if (!title.trim()) {
      alert('Title обязателен')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const created = await contentFactoryAPI.createOffer({
        title: title.trim(),
        brief: brief.trim() || null,
        kind: kind.trim() || 'product',
        cta_url_base: ctaUrl.trim() || null,
        cta_label: ctaLabel.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        generate: willGenerate,
      })
      navigate(`/content-factory/offers/${created.id}`, { replace: true })
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onSaveMeta = async () => {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const updated = await contentFactoryAPI.patchOffer(id, {
        title: title.trim(),
        brief: brief.trim() || null,
        kind: kind.trim() || 'product',
        cta_url_base: ctaUrl.trim() || null,
        cta_label: ctaLabel.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      syncForm(updated)
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const onSendChat = async () => {
    const content = chatInput.trim()
    if (!id || !content || streaming) return

    const attachments = [...pendingAttachments]
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content,
        attachments: attachments.length ? attachments : undefined,
        created_at: new Date().toISOString(),
      },
    ])
    setChatInput('')
    setPendingAttachments([])
    setStreaming(true)
    setProgressHistory([])
    setError(null)

    try {
      await contentFactoryAPI.postChatMessageStream(
        id,
        { content, attachments: attachments.length ? attachments : undefined },
        {
          onProgress: (p) => setProgressHistory((prev) => [...prev, p]),
          onResult: (r) => {
            if (r.html) {
              setOffer((prev) => (prev ? { ...prev, generated_html: r.html } : prev))
            }
            if (r.assistant_message) {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: r.assistant_message || '',
                  created_at: new Date().toISOString(),
                },
              ])
            }
          },
          onError: (e) => {
            setError(e.message || e.error || 'Ошибка генерации')
          },
        }
      )
      try {
        const o = await contentFactoryAPI.getOffer(id, { sync: true })
        syncForm(o)
        const msgs = await contentFactoryAPI.getChatMessages(id)
        if (msgs.length) setMessages(msgs)
      } catch {
        /* keep local */
      }
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
      try {
        const res = await contentFactoryAPI.postChatMessage(id, {
          content,
          attachments: attachments.length ? attachments : undefined,
        })
        if (res.offer) syncForm(res.offer)
        else if (res.preview_html) {
          setOffer((prev) =>
            prev ? { ...prev, generated_html: res.preview_html } : prev
          )
        }
        if (res.messages?.length) setMessages(res.messages)
        else if (res.assistant_message) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: res.assistant_message || '' },
          ])
        }
      } catch (fallbackErr) {
        setError(getContentFactoryErrorMessage(fallbackErr))
      }
    } finally {
      setStreaming(false)
      setProgressHistory([])
    }
  }

  const onAttachFiles = async (files: FileList | null) => {
    if (!files?.length || !id) return
    setBusy(true)
    setError(null)
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => ({
          name: file.name,
          content_base64: await fileToBase64(file),
          content_type: file.type || 'application/octet-stream',
          kind: guessMediaKind(file),
        }))
      )
      const uploaded = await contentFactoryAPI.uploadMedia(id, uploads)
      setPendingAttachments((prev) => [
        ...prev,
        ...uploaded.map((f) => ({
          ref: f.ref || `media:${f.name}`,
          role: f.kind || 'logo',
          instruction: 'использовать во вёрстке',
        })),
      ])
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onPublish = async () => {
    if (!id || !offer?.generated_html) {
      alert('Сначала получите HTML через чат')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await contentFactoryAPI.publishOffer(id)
      syncForm(result)
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
    if (!window.confirm('Архивировать оффер?')) return
    setBusy(true)
    try {
      await contentFactoryAPI.archiveOffer(id)
      navigate('/content-factory/offers')
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
      setBusy(false)
    }
  }

  // ─── Create form (normal layout) ─────────────────────────
  if (isNew) {
    return (
      <div className="relative space-y-6">
        {busy && willGenerate && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 px-6 text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-lg font-semibold">AI генерирует страницу…</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Обычно 1–10 минут. Не закрывайте вкладку.
            </p>
          </div>
        )}

        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-auto px-2">
            <Link to="/content-factory/offers">
              <ArrowLeft className="mr-1 h-4 w-4" />К списку
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Новый оффер</h1>
          <p className="text-sm text-muted-foreground">
            Title + brief → AI соберёт A4. Без brief — шаблон без LLM.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mx-auto max-w-2xl space-y-4 rounded-lg border p-6">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Подушка безопасности"
            />
          </div>
          <div className="space-y-2">
            <Label>Brief</Label>
            <Textarea
              className="min-h-[140px]"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Одна страница A4, продукт НСЖ, логотип в шапке, CTA внизу…"
            />
            <p className="text-xs text-muted-foreground">
              {willGenerate
                ? 'generate: true — полная генерация через IDE'
                : 'Пустой brief → generate: false'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Kind</Label>
            <Input value={kind} onChange={(e) => setKind(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>CTA URL</Label>
            <Input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://partner.example/offer"
            />
          </div>
          <div className="space-y-2">
            <Label>CTA label</Label>
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
          <Button onClick={onCreate} disabled={busy || !title.trim()}>
            {busy
              ? 'Создание…'
              : willGenerate
                ? 'Создать и сгенерировать'
                : 'Создать черновик'}
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Загрузка редактора…</p>
  }

  if (!offer) {
    return (
      <div>
        <p className="mb-2 text-sm text-destructive">Оффер не найден</p>
        <Button asChild variant="link">
          <Link to="/content-factory/offers">К списку</Link>
        </Button>
      </div>
    )
  }

  const hasHtml = Boolean(offer.generated_html)

  // ─── IDE editor: fills parent only (Layout gives h-full min-h-0) ───
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0f1419] text-[#e5e7eb]">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.pdf,.csv,.json,.svg"
        onChange={(e) => onAttachFiles(e.target.files)}
      />

      {/* Top bar — single row, no wrap, scroll if needed */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[#2a3344] bg-[#1a1f2e] px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <Link
            to="/content-factory/offers"
            className="flex shrink-0 items-center gap-1 text-sm text-[#9ca3af] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Офферы</span>
          </Link>
          <StatusBadge status={offer.status} dark />
          <h1 className="min-w-0 truncate text-sm font-semibold" title={offer.title}>
            {offer.title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 border-[#2a3344] bg-transparent px-2 text-[#9ca3af] hover:bg-[#121820] hover:text-white"
            onClick={() => load(true)}
            disabled={busy || streaming}
            title="Sync IDE"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 border-[#2a3344] bg-transparent px-2.5 text-xs text-[#c5cdd8] hover:bg-[#121820]"
            onClick={() => setMetaOpen((v) => !v)}
          >
            CTA
          </Button>
          {offer.status === 'published' ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0 border-[#2a3344] bg-transparent px-2.5 text-xs text-white hover:bg-[#121820]"
              onClick={onUnpublish}
              disabled={busy}
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 shrink-0 bg-[#111827] px-3 text-xs text-white hover:bg-black"
              onClick={onPublish}
              disabled={busy || !hasHtml || offer.status === 'archived'}
            >
              Опубликовать
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 shrink-0 px-2 text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300"
            onClick={onArchive}
            disabled={busy || offer.status === 'archived'}
          >
            Архив
          </Button>
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-red-900/50 bg-red-950/40 px-3 py-1.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Split 45/55 — only this area scrolls internally */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,45%)_minmax(0,55%)]">
        {/* Chat */}
        <section className="flex min-h-0 flex-col overflow-hidden border-b border-[#2a3344] bg-[#121820] lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-[#2a3344] px-3 py-2">
            <h2 className="text-sm font-semibold">Чат с AI</h2>
            <p className="text-[11px] text-[#6b7280]">
              Планировщик → БА → Программист · SSE
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2">
            {messages.length === 0 && !streaming && (
              <p className="text-sm text-[#6b7280]">
                Опишите правку или задачу — AI обновит A4-страницу.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={m.id ?? `msg-${i}`}
                className={cn(
                  'max-w-[92%] rounded-lg px-3 py-2 text-sm',
                  m.role === 'user'
                    ? 'ml-auto bg-[#1e3a5f] text-[#e8f0fe]'
                    : 'mr-auto bg-[#1e2633] text-[#e5e7eb]'
                )}
              >
                <div className="mb-0.5 text-[10px] uppercase tracking-wide opacity-60">
                  {m.role === 'user' ? 'Вы' : 'Ассистент'}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.attachments.map((a) => (
                      <span
                        key={a.ref}
                        className="inline-flex items-center gap-1 rounded bg-black/20 px-2 py-0.5 text-[11px]"
                      >
                        📎 {a.ref.replace(/^media:/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {(streaming || progressHistory.length > 0) && (
              <div className="space-y-1.5 font-mono text-xs">
                {progressHistory.map((p, i) => {
                  const label = IDE_AGENT_LABELS[p.agent || ''] || p.agent || 'Агент'
                  const isLast = i === progressHistory.length - 1
                  return (
                    <div
                      key={`${p.agent}-${i}-${p.message}`}
                      className="flex items-start gap-2 rounded-lg border border-[#2a3344] bg-[#0a0e14]/60 px-3 py-2 text-[#9ca3af]"
                    >
                      <span
                        className={cn(
                          'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                          isLast
                            ? 'animate-pulse bg-indigo-400'
                            : 'bg-emerald-500/70'
                        )}
                      />
                      <div>
                        <span className="font-semibold text-indigo-300">{label}</span>
                        {p.status && (
                          <span className="ml-1.5 text-[10px] uppercase opacity-60">
                            {p.status}
                          </span>
                        )}
                        {p.message && (
                          <div className="mt-0.5 text-[#c5cdd8]">
                            {p.message}
                            {isLast && streaming && <span className="animate-pulse">…</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {pendingAttachments.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-[#2a3344] px-3 py-1.5">
              {pendingAttachments.map((a) => (
                <span
                  key={a.ref}
                  className="inline-flex items-center gap-1 rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-0.5 text-xs"
                >
                  📎 {a.ref.replace(/^media:/, '')}
                  <button
                    type="button"
                    className="ml-1 text-[#6b7280] hover:text-white"
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((x) => x.ref !== a.ref))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex shrink-0 items-end gap-2 border-t border-[#2a3344] p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || streaming}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2a3344] text-[#9ca3af] hover:bg-[#1e2633] hover:text-white disabled:opacity-40"
              title="Прикрепить файл"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              className="max-h-24 min-h-[36px] flex-1 resize-none rounded-lg border border-[#2a3344] bg-[#0a0e14] px-3 py-2 text-sm text-[#e5e7eb] placeholder:text-[#6b7280] focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!streaming && chatInput.trim()) onSendChat()
                }
              }}
              placeholder="Правка или задача…"
              disabled={busy || streaming}
            />
            <button
              type="button"
              onClick={onSendChat}
              disabled={busy || streaming || !chatInput.trim()}
              className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              {streaming ? '…' : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">{!streaming && 'Отправить'}</span>
            </button>
          </div>
        </section>

        {/* Preview */}
        <section className="flex min-h-0 flex-col overflow-hidden bg-[#0a0e14]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#2a3344] px-3 py-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
              Preview
            </span>
            <div className="inline-flex rounded-lg border border-[#2a3344] bg-[#121820] p-0.5">
              {(['desktop', 'tablet', 'a4'] as PreviewViewport[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewport(v)}
                  className={cn(
                    'rounded-md px-2 py-0.5 text-xs font-medium capitalize transition-colors',
                    viewport === v
                      ? 'bg-[#2a3344] text-white'
                      : 'text-[#9ca3af] hover:text-white'
                  )}
                >
                  {v === 'a4' ? 'A4' : v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3">
            {!hasHtml ? (
              <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-[#2a3344] text-sm text-[#6b7280]">
                Создайте оффер или отправьте первую правку в чат
              </div>
            ) : (
              <div
                className={cn(
                  'overflow-hidden bg-white shadow-2xl shadow-black/40',
                  viewport === 'a4' ? 'rounded-sm' : 'h-full max-h-full rounded-lg'
                )}
                style={
                  viewport === 'desktop'
                    ? { width: '100%', maxWidth: 1280, height: '100%' }
                    : viewport === 'tablet'
                      ? { width: 'min(100%, 768px)', height: '100%' }
                      : {
                          width: 'min(100%, 380px)',
                          height: '100%',
                          maxHeight: '100%',
                          aspectRatio: '210 / 297',
                        }
                }
              >
                <iframe
                  title="preview"
                  sandbox="allow-same-origin"
                  srcDoc={offer.generated_html || ''}
                  className="h-full w-full border-0 bg-white"
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Meta — capped height so it never pushes editor off-screen */}
      <div className="shrink-0 border-t border-[#2a3344] bg-[#0f1419]">
        <button
          type="button"
          onClick={() => setMetaOpen((v) => !v)}
          className="flex h-9 w-full items-center justify-between px-3 text-left text-xs font-medium text-[#c5cdd8] hover:bg-[#121820]"
        >
          <span>{metaOpen ? '▲' : '▼'} Настройки оффера (CTA, срок, brief)</span>
          <span className="text-[10px] text-[#6b7280]">
            {metaOpen ? 'свернуть' : 'развернуть'}
          </span>
        </button>
        {metaOpen && (
          <div className="max-h-[28vh] overflow-y-auto border-t border-[#2a3344] px-3 py-2">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-0.5 block text-[11px] text-[#6b7280]">Title</label>
                <input
                  className="w-full rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1.5 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] text-[#6b7280]">Kind</label>
                <input
                  className="w-full rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1.5 text-sm"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] text-[#6b7280]">CTA URL</label>
                <input
                  className="w-full rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1.5 text-sm"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] text-[#6b7280]">CTA label</label>
                <input
                  className="w-full rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1.5 text-sm"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] text-[#6b7280]">Срок</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1.5 text-sm"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-0.5 block text-[11px] text-[#6b7280]">Brief</label>
                <textarea
                  className="max-h-20 min-h-[40px] w-full rounded-md border border-[#2a3344] bg-[#0a0e14] px-2 py-1.5 text-sm"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </div>
              <div>
                <Button
                  size="sm"
                  className="h-8 bg-[#1e2633] text-white hover:bg-[#2a3344]"
                  onClick={onSaveMeta}
                  disabled={busy}
                >
                  {busy ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

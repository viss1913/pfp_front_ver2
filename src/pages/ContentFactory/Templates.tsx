import { useCallback, useEffect, useState } from 'react'
import { FileCode2, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ContentTemplate,
  ContentTemplateCreate,
  contentFactoryAPI,
  getContentFactoryErrorMessage,
} from '@/lib/api'

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-bottom: 12px; }
    .body { margin-bottom: 20px; line-height: 1.5; }
    a[data-cta-slot] {
      display: inline-block; background: #00A8B1; color: #fff;
      padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;
    }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <div class="body">{{body}}</div>
  <a data-cta-slot href="{{cta_href}}">{{cta_label}}</a>
</body>
</html>
`

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('ru-RU')
  } catch {
    return iso
  }
}

export default function ContentFactoryTemplates() {
  const [items, setItems] = useState<ContentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [editing, setEditing] = useState<ContentTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [htmlSource, setHtmlSource] = useState(DEFAULT_HTML)
  const [isActive, setIsActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await contentFactoryAPI.listTemplates()
      setItems(data)
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setHtmlSource(DEFAULT_HTML)
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (t: ContentTemplate) => {
    setEditing(t)
    setTitle(t.title)
    setDescription(t.description || '')
    setHtmlSource(t.html_source)
    setIsActive(t.is_active)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim() || !htmlSource.trim()) {
      alert('title и html_source обязательны')
      return
    }
    const body: ContentTemplateCreate = {
      title: title.trim(),
      description: description.trim() || null,
      html_source: htmlSource,
      is_active: isActive,
    }
    setSaving(true)
    try {
      if (editing) {
        await contentFactoryAPI.updateTemplate(editing.id, body)
      } else {
        await contentFactoryAPI.createTemplate(body)
      }
      setDialogOpen(false)
      await load()
    } catch (err) {
      alert(getContentFactoryErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (t: ContentTemplate) => {
    if (!window.confirm(`Удалить шаблон «${t.title}» (id=${t.id})?`)) return
    try {
      await contentFactoryAPI.deleteTemplate(t.id)
      await load()
    } catch (err) {
      alert(getContentFactoryErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Шаблоны</h1>
            <p className="text-sm text-muted-foreground">
              Фабрика контента · placeholders: {'{{title}}'}, {'{{body}}'}, {'{{cta_href}}'},{' '}
              {'{{cta_label}}'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            Обновить
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Создать
          </Button>
        </div>
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
              <TableHead>Название</TableHead>
              <TableHead className="w-[100px]">Активен</TableHead>
              <TableHead>Обновлён</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Нет шаблонов
                </TableCell>
              </TableRow>
            ) : (
              items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    {t.is_active ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Да
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Нет
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(t.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Preview"
                        onClick={() => {
                          setPreviewHtml(t.html_source)
                          setPreviewOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(t)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Шаблон #${editing.id}` : 'Новый шаблон'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="опционально"
              />
            </div>
            <div className="space-y-2">
              <Label>html_source *</Label>
              <Textarea
                className="min-h-[280px] font-mono text-xs"
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                CTA: {'<a data-cta-slot href="{{cta_href}}">{{cta_label}}</a>'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="is_active" />
              <Label htmlFor="is_active">Активен</Label>
            </div>
            {htmlSource && (
              <div className="overflow-hidden rounded-md border">
                <div className="border-b bg-muted px-3 py-1 text-xs text-muted-foreground">
                  Preview (sandbox)
                </div>
                <iframe
                  title="preview"
                  sandbox=""
                  srcDoc={htmlSource}
                  className="h-[240px] w-full bg-white"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <iframe
            title="preview-full"
            sandbox=""
            srcDoc={previewHtml}
            className="h-[60vh] w-full rounded-md border bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

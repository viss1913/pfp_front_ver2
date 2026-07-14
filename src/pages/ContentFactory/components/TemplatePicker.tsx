import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ContentFactoryTemplate,
  DEFAULT_TEMPLATE_ID,
  TemplateOrientation,
  contentFactoryAPI,
  getContentFactoryErrorMessage,
} from '@/lib/api'
import TemplatePreviewCard from './TemplatePreviewCard'

type Props = {
  selectedTemplateId: string
  onSelect: (id: string) => void
}

function sortTemplates(templates: ContentFactoryTemplate[]) {
  const order: Record<string, number> = {
    'portrait-light': 0,
    'portrait-dark': 1,
    'landscape-light': 2,
    'landscape-dark': 3,
  }
  return [...templates].sort((a, b) => {
    const keyA = `${a.orientation ?? ''}-${a.theme ?? ''}`
    const keyB = `${b.orientation ?? ''}-${b.theme ?? ''}`
    return (order[keyA] ?? 99) - (order[keyB] ?? 99)
  })
}

function groupByOrientation(templates: ContentFactoryTemplate[]) {
  const sorted = sortTemplates(templates)
  return {
    portrait: sorted.filter((t) => t.orientation === 'portrait'),
    landscape: sorted.filter((t) => t.orientation === 'landscape'),
  }
}

export default function TemplatePicker({ selectedTemplateId, onSelect }: Props) {
  const [templates, setTemplates] = useState<ContentFactoryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await contentFactoryAPI.listTemplates()
      setTemplates(list)
      if (list.length && !list.some((t) => t.id === selectedTemplateId)) {
        const fallback = list.find((t) => t.id === DEFAULT_TEMPLATE_ID) ?? list[0]
        onSelect(fallback.id)
      }
    } catch (err) {
      setError(getContentFactoryErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const groups = useMemo(() => groupByOrientation(templates), [templates])

  const renderRow = (
    label: string,
    orientation: TemplateOrientation,
    items: ContentFactoryTemplate[]
  ) => (
    <div key={orientation}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <TemplatePreviewCard
            key={t.id}
            template={t}
            selected={selectedTemplateId === t.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-sm text-muted-foreground">Загрузка шаблонов…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <p>{error}</p>
        <Button type="button" variant="link" className="mt-1 h-auto p-0" onClick={loadTemplates}>
          Повторить
        </Button>
      </div>
    )
  }

  if (!templates.length) {
    return <p className="text-sm text-muted-foreground">Шаблоны не найдены на backend.</p>
  }

  return (
    <div className="space-y-5">
      {groups.portrait.length > 0 && renderRow('A4 вертикально', 'portrait', groups.portrait)}
      {groups.landscape.length > 0 &&
        renderRow('A4 горизонтально', 'landscape', groups.landscape)}
    </div>
  )
}

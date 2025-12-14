import { useEffect, useState } from 'react'
import { passiveIncomeAPI, PassiveIncomeYieldLine } from '@/lib/api'
import { formatNumber, formatRate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Plus } from 'lucide-react'

interface Props {
  isAdmin: boolean
}

export default function PassiveIncomeYieldSettings({ isAdmin }: Props) {
  const [lines, setLines] = useState<PassiveIncomeYieldLine[]>([])
  const [originalLines, setOriginalLines] = useState<PassiveIncomeYieldLine[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  const [form, setForm] = useState<PassiveIncomeYieldLine>({
    min_term_months: 0,
    max_term_months: 0,
    min_amount: 0,
    max_amount: 0,
    yield_percent: 0,
  })

  const [error, setError] = useState<string>('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await passiveIncomeAPI.getYieldLines()
      setLines(data.lines || [])
      setOriginalLines(JSON.parse(JSON.stringify(data.lines || [])))
      setUpdatedAt(data.updated_at || null)
      setError('')
    } catch (err: any) {
      console.error('Failed to load passive income yields:', err)
      setError('Не удалось загрузить линии доходности')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = () => {
    return JSON.stringify(lines) !== JSON.stringify(originalLines)
  }

  const handleAdd = () => {
    setEditingIndex(null)
    setForm({ min_term_months: 0, max_term_months: 0, min_amount: 0, max_amount: 0, yield_percent: 0 })
    setError('')
    setIsDialogOpen(true)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setForm({ ...lines[index] })
    setError('')
    setIsDialogOpen(true)
  }

  const handleDelete = (index: number) => {
    setDeletingIndex(index)
    setIsDeleteDialogOpen(true)
  }

  const validateForm = (): string | null => {
    if (form.min_term_months === null || form.max_term_months === null ||
      form.min_amount === null || form.max_amount === null || form.yield_percent === null) {
      return 'Все поля обязательны'
    }
    if (form.min_term_months < 0 || form.max_term_months < 0 || form.min_amount < 0 || form.max_amount < 0 || form.yield_percent < 0) {
      return 'Все значения должны быть >= 0'
    }
    if (form.max_term_months < form.min_term_months) return 'Срок до должен быть >= срока от'
    if (form.max_amount < form.min_amount) return 'Сумма до должна быть >= суммы от'
    return null
  }

  const handleSaveLine = () => {
    const v = validateForm()
    if (v) {
      setError(v)
      return
    }
    const newLines = [...lines]
    if (editingIndex === null) {
      newLines.push({ ...form })
    } else {
      newLines[editingIndex] = { ...form }
    }
    setLines(newLines)
    setIsDialogOpen(false)
  }

  const handleConfirmDelete = () => {
    if (deletingIndex === null) return
    const newLines = [...lines]
    newLines.splice(deletingIndex, 1)
    setLines(newLines)
    setIsDeleteDialogOpen(false)
  }

  const handleSaveAll = async () => {
    if (!isAdmin) {
      alert('Только администратор может сохранять изменения')
      return
    }
    // Client-side validation for all lines
    for (const l of lines) {
      if (l.min_term_months < 0 || l.max_term_months < 0 || l.min_amount < 0 || l.max_amount < 0 || l.yield_percent < 0) {
        alert('Все значения должны быть >= 0')
        return
      }
      if (l.max_term_months < l.min_term_months) {
        alert('В некоторых линиях: "Срок до" меньше "Срок от"')
        return
      }
      if (l.max_amount < l.min_amount) {
        alert('В некоторых линиях: "Сумма до" меньше "Суммы от"')
        return
      }
    }

    try {
      setSaving(true)
      await passiveIncomeAPI.updateYieldLines(lines)
      // reload
      await load()
      alert('Изменения успешно сохранены')
    } catch (err: any) {
      console.error('Failed to save passive income yields:', err)
      if (err.response?.status === 400) {
        alert('Ошибка валидации: ' + (err.response?.data?.message || 'Неверные данные'))
      } else if (err.response?.status === 403) {
        alert('Недостаточно прав для сохранения')
      } else {
        alert('Ошибка при сохранении')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancelChanges = () => {
    setLines(JSON.parse(JSON.stringify(originalLines)))
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Пассивный доход — доходности</h2>
          <p className="text-muted-foreground">Управление линиями доходности для целей типа "Пассивный доход"</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {updatedAt ? `Последнее обновление: ${new Date(updatedAt).toLocaleString()}` : ''}
        </div>
      </div>

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md">{error}</div>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Линии доходности</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить линию
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Нет линий доходности</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Срок от (мес)</TableHead>
                  <TableHead>Срок до (мес)</TableHead>
                  <TableHead>Сумма от (₽)</TableHead>
                  <TableHead>Сумма до (₽)</TableHead>
                  <TableHead>Доходность (% годовых)</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{line.min_term_months}</TableCell>
                    <TableCell>{line.max_term_months}</TableCell>
                    <TableCell>{formatNumber(line.min_amount)} ₽</TableCell>
                    <TableCell>{formatNumber(line.max_amount)} ₽</TableCell>
                    <TableCell>{formatRate(line.yield_percent)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(idx)} title="Редактировать">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(idx)} title="Удалить">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button onClick={handleSaveAll} disabled={!hasChanges() || saving}>
          {saving ? 'Сохранение...' : 'Сохранить все изменения'}
        </Button>
        <Button variant="outline" onClick={handleCancelChanges} disabled={!hasChanges()}>
          Отменить изменения
        </Button>
      </div>

      {/* Диалог добавления / редактирования */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? 'Добавить линию' : 'Редактировать линию'}</DialogTitle>
            <DialogDescription>Заполните поля линии доходности</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Срок от (мес) *</Label>
                <Input type="number" min={0} value={form.min_term_months} onChange={(e) => setForm({ ...form, min_term_months: parseInt(e.target.value || '0') })} />
              </div>
              <div className="space-y-2">
                <Label>Срок до (мес) *</Label>
                <Input type="number" min={0} value={form.max_term_months} onChange={(e) => setForm({ ...form, max_term_months: parseInt(e.target.value || '0') })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Сумма от (₽) *</Label>
                <Input type="number" min={0} value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: parseInt(e.target.value || '0') })} />
              </div>
              <div className="space-y-2">
                <Label>Сумма до (₽) *</Label>
                <Input type="number" min={0} value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: parseInt(e.target.value || '0') })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Доходность (% годовых) *</Label>
              <Input type="number" min={0} step={0.1} value={form.yield_percent} onChange={(e) => setForm({ ...form, yield_percent: parseFloat(e.target.value || '0') })} />
            </div>

            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSaveLine}>{editingIndex === null ? 'Добавить' : 'Сохранить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить линию доходности</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить эту линию?
              <br />
              {deletingIndex !== null && (
                <strong>
                  Срок: {lines[deletingIndex]?.min_term_months} - {lines[deletingIndex]?.max_term_months} мес, Сумма: {formatNumber(lines[deletingIndex]?.min_amount)} - {formatNumber(lines[deletingIndex]?.max_amount)} ₽, Доходность: {formatRate(lines[deletingIndex]?.yield_percent)}
                </strong>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

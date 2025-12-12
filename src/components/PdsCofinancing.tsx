import { useState, useEffect } from 'react'
import {
  pdsCofinAPI,
  PdsCofinSettings,
  PdsCofinSettingsUpdate,
  PdsCofinIncomeBracket,
  PdsCofinIncomeBracketCreate,
  PdsCofinIncomeBracketUpdate,
} from '@/lib/api'
import { formatNumber, formatCoefficient } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface PdsCofinancingProps {
  isAdmin: boolean
}

export default function PdsCofinancing({ isAdmin }: PdsCofinancingProps) {
  const [settings, setSettings] = useState<PdsCofinSettings | null>(null)
  const [brackets, setBrackets] = useState<PdsCofinIncomeBracket[]>([])
  const [loading, setLoading] = useState(true)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingBracket, setEditingBracket] = useState<PdsCofinIncomeBracket | null>(null)
  const [deletingBracket, setDeletingBracket] = useState<PdsCofinIncomeBracket | null>(null)
  const [error, setError] = useState<string>('')

  // Форма настроек
  const [settingsForm, setSettingsForm] = useState<PdsCofinSettingsUpdate>({
    max_state_cofin_amount_per_year: 36000,
    min_contribution_for_support_per_year: 2000,
    income_basis: 'gross_before_ndfl',
  })

  // Форма создания/редактирования диапазона
  const [bracketForm, setBracketForm] = useState<PdsCofinIncomeBracketCreate>({
    income_from: 0,
    income_to: null,
    ratio_numerator: 1,
    ratio_denominator: 1,
  })
  const [isUnlimited, setIsUnlimited] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [settingsData, bracketsData] = await Promise.all([
        pdsCofinAPI.getSettings(),
        pdsCofinAPI.listBrackets(),
      ])
      setSettings(settingsData)
      // Сортируем по income_from
      const sorted = [...bracketsData].sort((a, b) => a.income_from - b.income_from)
      setBrackets(sorted)
      setError('')
    } catch (error: any) {
      console.error('Failed to load PDS cofinancing data:', error)
      if (error.response?.status === 404) {
        setError('Настройки софинансирования ПДС не найдены')
      } else {
        setError('Не удалось загрузить данные')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEditSettings = () => {
    if (settings) {
      setSettingsForm({
        max_state_cofin_amount_per_year: settings.max_state_cofin_amount_per_year,
        min_contribution_for_support_per_year: settings.min_contribution_for_support_per_year,
        income_basis: settings.income_basis,
      })
    }
    setError('')
    setIsSettingsDialogOpen(true)
  }

  const handleSubmitSettings = async () => {
    if (!isAdmin) {
      setError('Только администратор может управлять настройками ПДС')
      return
    }

    setError('')
    
    // Валидация
    if (settingsForm.max_state_cofin_amount_per_year !== undefined && settingsForm.max_state_cofin_amount_per_year < 0) {
      setError('Максимальная сумма господдержки не может быть отрицательной')
      return
    }
    if (settingsForm.min_contribution_for_support_per_year !== undefined && settingsForm.min_contribution_for_support_per_year < 0) {
      setError('Минимальный годовой взнос не может быть отрицательным')
      return
    }

    try {
      await pdsCofinAPI.updateSettings(settingsForm)
      setIsSettingsDialogOpen(false)
      loadData()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка сохранения'
      if (error.response?.status === 400) {
        setError(`Ошибка валидации: ${errorMessage}`)
      } else if (error.response?.status === 403) {
        setError('Только администратор может управлять настройками ПДС')
      } else if (error.response?.status === 404) {
        setError('Настройки софинансирования ПДС не найдены')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleCreate = () => {
    setBracketForm({
      income_from: 0,
      income_to: null,
      ratio_numerator: 1,
      ratio_denominator: 1,
    })
    setIsUnlimited(false)
    setError('')
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (bracket: PdsCofinIncomeBracket) => {
    setEditingBracket(bracket)
    setBracketForm({
      income_from: bracket.income_from,
      income_to: bracket.income_to,
      ratio_numerator: bracket.ratio_numerator,
      ratio_denominator: bracket.ratio_denominator,
    })
    setIsUnlimited(bracket.income_to === null)
    setError('')
    setIsEditDialogOpen(true)
  }

  const handleDelete = (bracket: PdsCofinIncomeBracket) => {
    setDeletingBracket(bracket)
    setIsDeleteDialogOpen(true)
  }

  // Проверка пересечения диапазонов на клиенте
  const checkOverlap = (
    incomeFrom: number,
    incomeTo: number | null,
    excludeId?: number
  ): PdsCofinIncomeBracket | null => {
    for (const bracket of brackets) {
      if (excludeId && bracket.id === excludeId) continue
      
      const bracketTo = bracket.income_to ?? Infinity
      const newTo = incomeTo ?? Infinity
      
      // Проверка пересечения: (incomeFrom, incomeTo) пересекается с (bracket.income_from, bracketTo)
      if (
        (incomeFrom >= bracket.income_from && incomeFrom <= bracketTo) ||
        (newTo >= bracket.income_from && newTo <= bracketTo) ||
        (incomeFrom <= bracket.income_from && newTo >= bracketTo)
      ) {
        return bracket
      }
    }
    return null
  }

  const handleSubmitCreate = async () => {
    if (!isAdmin) {
      setError('Только администратор может управлять диапазонами доходов')
      return
    }

    setError('')
    
    const incomeTo = isUnlimited ? null : bracketForm.income_to
    
    // Валидация
    if (bracketForm.income_from < 0) {
      setError('Доход "от" не может быть отрицательным')
      return
    }
    if (incomeTo !== null && incomeTo <= bracketForm.income_from) {
      setError('Доход "до" должен быть больше дохода "от"')
      return
    }
    if (bracketForm.ratio_numerator < 1) {
      setError('Числитель соотношения должен быть >= 1')
      return
    }
    if (bracketForm.ratio_denominator < 1) {
      setError('Знаменатель соотношения должен быть >= 1')
      return
    }

    // Проверка пересечения
    const overlapping = checkOverlap(bracketForm.income_from, incomeTo)
    if (overlapping) {
      setError('Диапазон доходов пересекается с существующим диапазоном')
      return
    }

    try {
      await pdsCofinAPI.createBracket({
        ...bracketForm,
        income_to: incomeTo,
      })
      setIsCreateDialogOpen(false)
      loadData()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка создания'
      if (error.response?.status === 400) {
        setError(`Ошибка валидации: ${errorMessage}. Диапазон доходов пересекается с существующим диапазоном.`)
      } else if (error.response?.status === 403) {
        setError('Только администратор может управлять диапазонами доходов')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleSubmitEdit = async () => {
    if (!editingBracket || !isAdmin) return

    setError('')
    
    const incomeTo = isUnlimited ? null : bracketForm.income_to
    
    // Валидация
    const incomeFrom = bracketForm.income_from ?? editingBracket.income_from
    if (incomeFrom < 0) {
      setError('Доход "от" не может быть отрицательным')
      return
    }
    if (incomeTo !== null && incomeTo <= incomeFrom) {
      setError('Доход "до" должен быть больше дохода "от"')
      return
    }
    const ratioNum = bracketForm.ratio_numerator ?? editingBracket.ratio_numerator
    const ratioDen = bracketForm.ratio_denominator ?? editingBracket.ratio_denominator
    if (ratioNum < 1) {
      setError('Числитель соотношения должен быть >= 1')
      return
    }
    if (ratioDen < 1) {
      setError('Знаменатель соотношения должен быть >= 1')
      return
    }

    // Проверка пересечения
    const overlapping = checkOverlap(incomeFrom, incomeTo, editingBracket.id)
    if (overlapping) {
      setError('Диапазон доходов пересекается с существующим диапазоном')
      return
    }

    try {
      const updateData: PdsCofinIncomeBracketUpdate = {}
      if (bracketForm.income_from !== editingBracket.income_from) updateData.income_from = bracketForm.income_from
      if (incomeTo !== editingBracket.income_to) updateData.income_to = incomeTo
      if (bracketForm.ratio_numerator !== editingBracket.ratio_numerator) updateData.ratio_numerator = bracketForm.ratio_numerator
      if (bracketForm.ratio_denominator !== editingBracket.ratio_denominator) updateData.ratio_denominator = bracketForm.ratio_denominator

      await pdsCofinAPI.updateBracket(editingBracket.id, updateData)
      setIsEditDialogOpen(false)
      loadData()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка обновления'
      if (error.response?.status === 400) {
        setError(`Ошибка валидации: ${errorMessage}. Диапазон доходов пересекается с существующим диапазоном.`)
      } else if (error.response?.status === 403) {
        setError('Только администратор может управлять диапазонами доходов')
      } else if (error.response?.status === 404) {
        setError('Диапазон доходов не найден')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleSubmitDelete = async () => {
    if (!deletingBracket || !isAdmin) return

    try {
      await pdsCofinAPI.deleteBracket(deletingBracket.id)
      setIsDeleteDialogOpen(false)
      loadData()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка удаления'
      if (error.response?.status === 403) {
        setError('Только администратор может управлять диапазонами доходов')
      } else if (error.response?.status === 404) {
        setError('Диапазон доходов не найден')
      } else {
        setError(errorMessage)
      }
    }
  }

  const coefficient = bracketForm.ratio_denominator > 0
    ? formatCoefficient(bracketForm.ratio_numerator, bracketForm.ratio_denominator)
    : '0.00'

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Софинансирование ПДС</h2>
          <p className="text-muted-foreground">
            Управление параметрами государственного софинансирования программы долгосрочных сбережений
          </p>
        </div>
      </div>

      {error && !isSettingsDialogOpen && !isCreateDialogOpen && !isEditDialogOpen && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Глобальные настройки */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Глобальные настройки</CardTitle>
            {isAdmin && (
              <Button variant="outline" onClick={handleEditSettings}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {settings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Максимальная сумма господдержки в год</Label>
                  <p className="text-lg font-semibold">{formatNumber(settings.max_state_cofin_amount_per_year)} ₽</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Минимальный годовой взнос</Label>
                  <p className="text-lg font-semibold">{formatNumber(settings.min_contribution_for_support_per_year)} ₽</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Основа для расчета дохода</Label>
                <p className="text-lg font-semibold">
                  {settings.income_basis === 'gross_before_ndfl' ? 'До НДФЛ' : 'После НДФЛ'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Все расчеты основаны на доходе до вычета НДФЛ (брутто-доход)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Настройки не загружены</p>
          )}
        </CardContent>
      </Card>

      {/* Список диапазонов доходов */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Диапазоны доходов для расчета коэффициентов</CardTitle>
            {isAdmin && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить диапазон
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {brackets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет диапазонов доходов. {isAdmin && 'Добавьте первый диапазон.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Доход от (₽/мес)</TableHead>
                  <TableHead>Доход до (₽/мес)</TableHead>
                  <TableHead>Коэффициент</TableHead>
                  {isAdmin && <TableHead className="text-right">Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {brackets.map((bracket) => (
                  <TableRow key={bracket.id}>
                    <TableCell className="font-medium">
                      {formatNumber(bracket.income_from)}
                    </TableCell>
                    <TableCell>
                      {bracket.income_to === null ? (
                        <span className="text-muted-foreground">Без ограничений</span>
                      ) : (
                        formatNumber(bracket.income_to)
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCoefficient(bracket.ratio_numerator, bracket.ratio_denominator)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(bracket)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(bracket)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Диалог редактирования настроек */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать настройки софинансирования</DialogTitle>
            <DialogDescription>
              Измените глобальные параметры софинансирования ПДС
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="max_amount">Максимальная сумма господдержки в год (₽) *</Label>
              <Input
                id="max_amount"
                type="number"
                min="0"
                value={settingsForm.max_state_cofin_amount_per_year}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    max_state_cofin_amount_per_year: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_contribution">Минимальный годовой взнос (₽) *</Label>
              <Input
                id="min_contribution"
                type="number"
                min="0"
                value={settingsForm.min_contribution_for_support_per_year}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    min_contribution_for_support_per_year: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income_basis">Основа для расчета дохода *</Label>
              <Select
                value={settingsForm.income_basis}
                onValueChange={(value: 'gross_before_ndfl' | 'net_after_ndfl') =>
                  setSettingsForm({ ...settingsForm, income_basis: value })
                }
              >
                <SelectTrigger id="income_basis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gross_before_ndfl">До НДФЛ</SelectItem>
                  <SelectItem value="net_after_ndfl">После НДФЛ</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Доход берется до вычета НДФЛ (брутто-доход)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmitSettings}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания диапазона */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать диапазон доходов</DialogTitle>
            <DialogDescription>
              Добавьте новый диапазон доходов для расчета коэффициента софинансирования
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_income_from">Доход от (₽/мес) *</Label>
                <Input
                  id="create_income_from"
                  type="number"
                  min="0"
                  value={bracketForm.income_from}
                  onChange={(e) =>
                    setBracketForm({ ...bracketForm, income_from: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_income_to">Доход до (₽/мес)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="create_unlimited"
                      checked={isUnlimited}
                      onChange={(e) => {
                        setIsUnlimited(e.target.checked)
                        if (e.target.checked) {
                          setBracketForm({ ...bracketForm, income_to: null })
                        } else {
                          // При снятии чекбокса устанавливаем значение по умолчанию
                          setBracketForm({ ...bracketForm, income_to: bracketForm.income_from + 1000 })
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="create_unlimited" className="font-normal cursor-pointer">
                      Без ограничений
                    </Label>
                  </div>
                  {!isUnlimited && (
                    <Input
                      id="create_income_to"
                      type="number"
                      min="0"
                      value={bracketForm.income_to || ''}
                      onChange={(e) =>
                        setBracketForm({
                          ...bracketForm,
                          income_to: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create_numerator">Числитель соотношения *</Label>
                <Input
                  id="create_numerator"
                  type="number"
                  min="1"
                  value={bracketForm.ratio_numerator}
                  onChange={(e) =>
                    setBracketForm({
                      ...bracketForm,
                      ratio_numerator: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create_denominator">Знаменатель соотношения *</Label>
                <Input
                  id="create_denominator"
                  type="number"
                  min="1"
                  value={bracketForm.ratio_denominator}
                  onChange={(e) =>
                    setBracketForm({
                      ...bracketForm,
                      ratio_denominator: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                <strong>Коэффициент:</strong> {coefficient}
                <span className="text-muted-foreground ml-2">
                  ({bracketForm.ratio_numerator}:{bracketForm.ratio_denominator})
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Пример: 1:1 означает соотношение 1 к 1 (коэффициент 1.0)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmitCreate}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования диапазона */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать диапазон доходов</DialogTitle>
            <DialogDescription>
              Измените параметры диапазона доходов
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_income_from">Доход от (₽/мес) *</Label>
                <Input
                  id="edit_income_from"
                  type="number"
                  min="0"
                  value={bracketForm.income_from}
                  onChange={(e) =>
                    setBracketForm({ ...bracketForm, income_from: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_income_to">Доход до (₽/мес)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit_unlimited"
                      checked={isUnlimited}
                      onChange={(e) => {
                        setIsUnlimited(e.target.checked)
                        if (e.target.checked) {
                          setBracketForm({ ...bracketForm, income_to: null })
                        } else {
                          // При снятии чекбокса восстанавливаем предыдущее значение или устанавливаем по умолчанию
                          const prevValue = editingBracket?.income_to
                          setBracketForm({
                            ...bracketForm,
                            income_to: prevValue !== null && prevValue !== undefined ? prevValue : bracketForm.income_from + 1000,
                          })
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit_unlimited" className="font-normal cursor-pointer">
                      Без ограничений
                    </Label>
                  </div>
                  {!isUnlimited && (
                    <Input
                      id="edit_income_to"
                      type="number"
                      min="0"
                      value={bracketForm.income_to || ''}
                      onChange={(e) =>
                        setBracketForm({
                          ...bracketForm,
                          income_to: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_numerator">Числитель соотношения *</Label>
                <Input
                  id="edit_numerator"
                  type="number"
                  min="1"
                  value={bracketForm.ratio_numerator}
                  onChange={(e) =>
                    setBracketForm({
                      ...bracketForm,
                      ratio_numerator: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_denominator">Знаменатель соотношения *</Label>
                <Input
                  id="edit_denominator"
                  type="number"
                  min="1"
                  value={bracketForm.ratio_denominator}
                  onChange={(e) =>
                    setBracketForm({
                      ...bracketForm,
                      ratio_denominator: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                <strong>Коэффициент:</strong> {coefficient}
                <span className="text-muted-foreground ml-2">
                  ({bracketForm.ratio_numerator}:{bracketForm.ratio_denominator})
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmitEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить диапазон доходов</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот диапазон доходов?
              <br />
              <strong>
                {deletingBracket &&
                  `Доход: ${formatNumber(deletingBracket.income_from)} - ${
                    deletingBracket.income_to === null
                      ? 'Без ограничений'
                      : formatNumber(deletingBracket.income_to)
                  } ₽/мес, Коэффициент: ${formatCoefficient(
                    deletingBracket.ratio_numerator,
                    deletingBracket.ratio_denominator
                  )}`}
              </strong>
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleSubmitDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


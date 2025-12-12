import { useState, useEffect } from 'react'
import { taxBracketsAPI, Tax2ndflBracket, Tax2ndflBracketCreate, Tax2ndflBracketUpdate } from '@/lib/api'
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
import { Edit, Trash2, Plus, Search, X } from 'lucide-react'

interface TaxBracketsProps {
  isAdmin: boolean
}

export default function TaxBrackets({ isAdmin }: TaxBracketsProps) {
  const [brackets, setBrackets] = useState<Tax2ndflBracket[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)
  const [editingBracket, setEditingBracket] = useState<Tax2ndflBracket | null>(null)
  const [deletingBracket, setDeletingBracket] = useState<Tax2ndflBracket | null>(null)
  const [searchIncome, setSearchIncome] = useState<string>('')
  const [searchResult, setSearchResult] = useState<Tax2ndflBracket | null>(null)
  const [error, setError] = useState<string>('')

  // Форма создания/редактирования
  const [formData, setFormData] = useState<Tax2ndflBracketCreate>({
    income_from: 0,
    income_to: 0,
    rate: 0,
    order_index: 0,
    description: '',
  })

  // Форма массового создания
  const [bulkBrackets, setBulkBrackets] = useState<Tax2ndflBracketCreate[]>([
    { income_from: 0, income_to: 0, rate: 0, order_index: 0, description: '' },
  ])

  useEffect(() => {
    loadBrackets()
  }, [])

  const loadBrackets = async () => {
    try {
      setLoading(true)
      const data = await taxBracketsAPI.list()
      // Преобразуем строковые значения в числа, если они пришли как строки
      const normalized = data.map(bracket => ({
        ...bracket,
        income_from: typeof bracket.income_from === 'string' ? parseFloat(bracket.income_from) : bracket.income_from,
        income_to: typeof bracket.income_to === 'string' ? parseFloat(bracket.income_to) : bracket.income_to,
        rate: typeof bracket.rate === 'string' ? parseFloat(bracket.rate) : bracket.rate,
        order_index: typeof bracket.order_index === 'string' ? parseInt(bracket.order_index, 10) : bracket.order_index,
      }))
      // Сортируем по order_index, затем по income_from
      const sorted = [...normalized].sort((a, b) => {
        if (a.order_index !== b.order_index) {
          return a.order_index - b.order_index
        }
        return a.income_from - b.income_from
      })
      setBrackets(sorted)
      setError('')
    } catch (error: any) {
      console.error('Failed to load tax brackets:', error)
      if (error.response?.status === 404) {
        setError('API endpoint не найден. Возможно, бэкенд еще не развернут с поддержкой налоговых ставок.')
      } else {
        setError('Не удалось загрузить налоговые ставки')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      income_from: 0,
      income_to: 0,
      rate: 0,
      order_index: brackets.length > 0 ? Math.max(...brackets.map(b => b.order_index)) + 1 : 0,
      description: '',
    })
    setError('')
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (bracket: Tax2ndflBracket) => {
    setEditingBracket(bracket)
    setFormData({
      income_from: bracket.income_from,
      income_to: bracket.income_to,
      rate: bracket.rate,
      order_index: bracket.order_index,
      description: bracket.description || '',
    })
    setError('')
    setIsEditDialogOpen(true)
  }

  const handleDelete = (bracket: Tax2ndflBracket) => {
    setDeletingBracket(bracket)
    setIsDeleteDialogOpen(true)
  }

  const handleSubmitCreate = async () => {
    setError('')
    
    // Валидация
    if (formData.income_to <= formData.income_from) {
      setError('Доход "до" должен быть больше дохода "от"')
      return
    }
    if (formData.rate < 0 || formData.rate > 100) {
      setError('Ставка должна быть от 0 до 100%')
      return
    }
    if (formData.income_from < 0 || formData.income_to < 0) {
      setError('Доходы не могут быть отрицательными')
      return
    }

    try {
      await taxBracketsAPI.create(formData)
      setIsCreateDialogOpen(false)
      loadBrackets()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка создания'
      if (error.response?.status === 400) {
        setError(`Ошибка валидации: ${errorMessage}. Возможно, диапазон пересекается с существующей ставкой.`)
      } else if (error.response?.status === 403) {
        setError('Только администратор может управлять налоговыми ставками')
      } else if (error.response?.status === 404) {
        setError('API endpoint не найден (404). Возможно, бэкенд еще не развернут с поддержкой налоговых ставок.')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleSubmitEdit = async () => {
    if (!editingBracket) return

    setError('')
    
    // Валидация
    const incomeFrom = formData.income_from ?? editingBracket.income_from
    const incomeTo = formData.income_to ?? editingBracket.income_to
    const rate = formData.rate ?? editingBracket.rate

    if (incomeTo <= incomeFrom) {
      setError('Доход "до" должен быть больше дохода "от"')
      return
    }
    if (rate < 0 || rate > 100) {
      setError('Ставка должна быть от 0 до 100%')
      return
    }
    if (incomeFrom < 0 || incomeTo < 0) {
      setError('Доходы не могут быть отрицательными')
      return
    }

    try {
      const updateData: Tax2ndflBracketUpdate = {}
      if (formData.income_from !== editingBracket.income_from) updateData.income_from = formData.income_from
      if (formData.income_to !== editingBracket.income_to) updateData.income_to = formData.income_to
      if (formData.rate !== editingBracket.rate) updateData.rate = formData.rate
      if (formData.order_index !== editingBracket.order_index) updateData.order_index = formData.order_index
      if (formData.description !== (editingBracket.description || '')) updateData.description = formData.description

      await taxBracketsAPI.update(editingBracket.id, updateData)
      setIsEditDialogOpen(false)
      loadBrackets()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка обновления'
      if (error.response?.status === 400) {
        setError(`Ошибка валидации: ${errorMessage}. Возможно, диапазон пересекается с существующей ставкой.`)
      } else if (error.response?.status === 403) {
        setError('Только администратор может управлять налоговыми ставками')
      } else if (error.response?.status === 404) {
        setError('Налоговая ставка не найдена')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleSubmitDelete = async () => {
    if (!deletingBracket) return

    try {
      await taxBracketsAPI.delete(deletingBracket.id)
      setIsDeleteDialogOpen(false)
      loadBrackets()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка удаления'
      if (error.response?.status === 403) {
        setError('Только администратор может управлять налоговыми ставками')
      } else if (error.response?.status === 404) {
        setError('Налоговая ставка не найдена')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleBulkCreate = () => {
    setBulkBrackets([{ income_from: 0, income_to: 0, rate: 0, order_index: 0, description: '' }])
    setError('')
    setIsBulkDialogOpen(true)
  }

  const handleAddBulkRow = () => {
    setBulkBrackets([
      ...bulkBrackets,
      { income_from: 0, income_to: 0, rate: 0, order_index: bulkBrackets.length, description: '' },
    ])
  }

  const handleRemoveBulkRow = (index: number) => {
    setBulkBrackets(bulkBrackets.filter((_, i) => i !== index))
  }

  const handleUpdateBulkRow = (index: number, field: keyof Tax2ndflBracketCreate, value: number | string) => {
    const updated = [...bulkBrackets]
    updated[index] = { ...updated[index], [field]: value }
    setBulkBrackets(updated)
  }

  const handleSubmitBulk = async () => {
    setError('')
    
    // Валидация всех строк
    for (let i = 0; i < bulkBrackets.length; i++) {
      const bracket = bulkBrackets[i]
      if (bracket.income_to <= bracket.income_from) {
        setError(`Строка ${i + 1}: Доход "до" должен быть больше дохода "от"`)
        return
      }
      if (bracket.rate < 0 || bracket.rate > 100) {
        setError(`Строка ${i + 1}: Ставка должна быть от 0 до 100%`)
        return
      }
      if (bracket.income_from < 0 || bracket.income_to < 0) {
        setError(`Строка ${i + 1}: Доходы не могут быть отрицательными`)
        return
      }
    }

    try {
      await taxBracketsAPI.bulkCreate(bulkBrackets)
      setIsBulkDialogOpen(false)
      loadBrackets()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Ошибка создания'
      if (error.response?.status === 400) {
        setError(`Ошибка валидации: ${errorMessage}. Возможно, диапазоны пересекаются.`)
      } else if (error.response?.status === 403) {
        setError('Только администратор может управлять налоговыми ставками')
      } else if (error.response?.status === 404) {
        setError('API endpoint не найден (404). Возможно, бэкенд еще не развернут с поддержкой налоговых ставок.')
      } else {
        setError(errorMessage)
      }
    }
  }

  const handleSearch = async () => {
    setError('')
    setSearchResult(null)
    
    const income = parseFloat(searchIncome)
    if (isNaN(income) || income < 0) {
      setError('Введите корректное значение дохода (число >= 0)')
      return
    }

    try {
      const result = await taxBracketsAPI.getByIncome(income)
      // Преобразуем строковые значения в числа, если они пришли как строки
      const normalized = {
        ...result,
        income_from: typeof result.income_from === 'string' ? parseFloat(result.income_from) : result.income_from,
        income_to: typeof result.income_to === 'string' ? parseFloat(result.income_to) : result.income_to,
        rate: typeof result.rate === 'string' ? parseFloat(result.rate) : result.rate,
        order_index: typeof result.order_index === 'string' ? parseInt(result.order_index, 10) : result.order_index,
      }
      setSearchResult(normalized)
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchResult(null)
        setError('Налоговая ставка для данного дохода не найдена')
      } else {
        setError('Ошибка поиска')
      }
    }
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Налоговые ставки 2НДФЛ</h2>
          <p className="text-muted-foreground">
            Управление прогрессивной шкалой налогообложения
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSearchDialogOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            Найти ставку
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleBulkCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить несколько
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить ставку
              </Button>
            </>
          )}
        </div>
      </div>

      {error && !isCreateDialogOpen && !isEditDialogOpen && !isBulkDialogOpen && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список налоговых ставок</CardTitle>
        </CardHeader>
        <CardContent>
          {brackets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет налоговых ставок. {isAdmin && 'Добавьте первую ставку.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Доход от (руб.)</TableHead>
                  <TableHead>Доход до (руб.)</TableHead>
                  <TableHead>Ставка (%)</TableHead>
                  <TableHead>Порядок</TableHead>
                  <TableHead>Описание</TableHead>
                  {isAdmin && <TableHead className="text-right">Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {brackets.map((bracket) => (
                  <TableRow key={bracket.id}>
                    <TableCell className="font-medium">
                      {formatNumber(bracket.income_from)}
                    </TableCell>
                    <TableCell>{formatNumber(bracket.income_to)}</TableCell>
                    <TableCell>{formatRate(bracket.rate)}</TableCell>
                    <TableCell>{bracket.order_index}</TableCell>
                    <TableCell>{bracket.description || '-'}</TableCell>
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

      {/* Диалог создания */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать налоговую ставку</DialogTitle>
            <DialogDescription>
              Заполните данные для новой налоговой ставки
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
                <Label htmlFor="income_from">Доход от (руб.) *</Label>
                <Input
                  id="income_from"
                  type="number"
                  min="0"
                  value={formData.income_from}
                  onChange={(e) =>
                    setFormData({ ...formData, income_from: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income_to">Доход до (руб.) *</Label>
                <Input
                  id="income_to"
                  type="number"
                  min="0"
                  value={formData.income_to}
                  onChange={(e) =>
                    setFormData({ ...formData, income_to: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Ставка (%) *</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_index">Порядок</Label>
                <Input
                  id="order_index"
                  type="number"
                  min="0"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание диапазона"
              />
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

      {/* Диалог редактирования */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать налоговую ставку</DialogTitle>
            <DialogDescription>
              Измените данные налоговой ставки
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
                <Label htmlFor="edit_income_from">Доход от (руб.) *</Label>
                <Input
                  id="edit_income_from"
                  type="number"
                  min="0"
                  value={formData.income_from}
                  onChange={(e) =>
                    setFormData({ ...formData, income_from: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_income_to">Доход до (руб.) *</Label>
                <Input
                  id="edit_income_to"
                  type="number"
                  min="0"
                  value={formData.income_to}
                  onChange={(e) =>
                    setFormData({ ...formData, income_to: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_rate">Ставка (%) *</Label>
                <Input
                  id="edit_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_order_index">Порядок</Label>
                <Input
                  id="edit_order_index"
                  type="number"
                  min="0"
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Описание</Label>
              <Input
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание диапазона"
              />
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
            <DialogTitle>Удалить налоговую ставку</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить налоговую ставку?
              <br />
              <strong>
                {deletingBracket &&
                  `Доход: ${formatNumber(deletingBracket.income_from)} - ${formatNumber(deletingBracket.income_to)} руб., Ставка: ${formatRate(deletingBracket.rate)}`}
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

      {/* Диалог массового создания */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Массовое создание налоговых ставок</DialogTitle>
            <DialogDescription>
              Добавьте несколько налоговых ставок одновременно
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4 py-4">
            {bulkBrackets.map((bracket, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Ставка {index + 1}</CardTitle>
                    {bulkBrackets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBulkRow(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Доход от (руб.) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={bracket.income_from}
                        onChange={(e) =>
                          handleUpdateBulkRow(index, 'income_from', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Доход до (руб.) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={bracket.income_to}
                        onChange={(e) =>
                          handleUpdateBulkRow(index, 'income_to', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ставка (%) *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={bracket.rate}
                        onChange={(e) =>
                          handleUpdateBulkRow(index, 'rate', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Порядок</Label>
                      <Input
                        type="number"
                        min="0"
                        value={bracket.order_index || index}
                        onChange={(e) =>
                          handleUpdateBulkRow(index, 'order_index', parseInt(e.target.value) || index)
                        }
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Описание</Label>
                      <Input
                        value={bracket.description || ''}
                        onChange={(e) => handleUpdateBulkRow(index, 'description', e.target.value)}
                        placeholder="Описание диапазона"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={handleAddBulkRow} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Добавить строку
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmitBulk}>Создать все</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог поиска */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Найти ставку по доходу</DialogTitle>
            <DialogDescription>
              Введите годовой доход для поиска соответствующей налоговой ставки
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search_income">Годовой доход (руб.)</Label>
              <Input
                id="search_income"
                type="number"
                min="0"
                value={searchIncome}
                onChange={(e) => setSearchIncome(e.target.value)}
                placeholder="Введите доход"
              />
            </div>
            {searchResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Найденная ставка</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Доход:</strong> {formatNumber(searchResult.income_from)} -{' '}
                      {formatNumber(searchResult.income_to)} руб.
                    </div>
                    <div>
                      <strong>Ставка:</strong> {formatRate(searchResult.rate)}
                    </div>
                    <div>
                      <strong>Порядок:</strong> {searchResult.order_index}
                    </div>
                    {searchResult.description && (
                      <div>
                        <strong>Описание:</strong> {searchResult.description}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
              Закрыть
            </Button>
            <Button onClick={handleSearch}>Найти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



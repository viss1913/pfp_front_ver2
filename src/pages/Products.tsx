import { useState, useEffect } from 'react'
import { productsAPI, productTypesAPI, Product, ProductYield, ProductType } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'

export default function Products() {
  const { activeProject } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    product_type: '',
    currency: 'RUB',
    min_term_months: 0,
    max_term_months: 0,
    min_amount: 0,
    max_amount: 0,
    yields: [],
  })
  const [productTypes, setProductTypes] = useState<ProductType[] | null>(null)
  const [typesLoading, setTypesLoading] = useState(false)
  const [typesError, setTypesError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
    loadProductTypes()
  }, [activeProject]) // Перезагружаем при смене проекта

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productsAPI.list({ includeDefaults: !activeProject })
      const filtered = activeProject
        ? data.filter(p => p.project_id === activeProject.id)
        : data
      setProducts(filtered)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      product_type: '',
      currency: 'RUB',
      min_term_months: 0,
      max_term_months: 0,
      min_amount: 0,
      max_amount: 0,
      yields: [],
    })
    loadProductTypes()
    setIsDialogOpen(true)
  }

  const loadProductTypes = async (force = false) => {
    try {
      setTypesError(null)
      const cacheKey = `productTypes_${activeProject?.id || 'global'}`

      if (!force) {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed && parsed.length > 0) {
            setProductTypes(parsed)
            return
          }
        }
      }

      setTypesLoading(true)
      const types = await productTypesAPI.list({ is_active: true })

      if (types && types.length > 0) {
        types.sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name))
        setProductTypes(types)
        sessionStorage.setItem(cacheKey, JSON.stringify(types))
      } else {
        setProductTypes([])
        // Если пришел пустой список, удаляем кэш, чтобы при следующем открытии попробовать снова
        sessionStorage.removeItem(cacheKey)
      }
    } catch (error: any) {
      console.error('Failed to load product types:', error)
      setTypesError(error.response?.data?.error || error.message || 'Ошибка загрузки типов')
      setProductTypes(null)
    } finally {
      setTypesLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    const line = product.lines?.[0]
    setFormData({
      name: product.name,
      product_type: product.product_type,
      currency: product.currency,
      min_term_months: product.min_term_months ?? line?.min_term_months ?? 0,
      max_term_months: product.max_term_months ?? line?.max_term_months ?? 0,
      min_amount: product.min_amount ?? line?.min_amount ?? 0,
      max_amount: product.max_amount ?? line?.max_amount ?? 0,
      yields: product.yields || product.lines?.map(line => ({
        term_from_months: line.min_term_months,
        term_to_months: line.max_term_months,
        amount_from: line.min_amount,
        amount_to: line.max_amount,
        yield_percent: line.yield_percent,
      })) || [],
    })
    loadProductTypes()
    setIsDialogOpen(true)
  }

  const handleClone = async (id: number) => {
    try {
      await productsAPI.clone(id)
      loadProducts()
    } catch (error) {
      console.error('Failed to clone product:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот продукт?')) return
    try {
      await productsAPI.delete(id)
      loadProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const handleSubmit = async () => {
    // Валидация обязательных полей
    if (!formData.name?.trim()) {
      alert('Пожалуйста, укажите название продукта')
      return
    }
    if (!formData.product_type) {
      alert('Пожалуйста, выберите тип продукта')
      return
    }
    if (!formData.currency) {
      alert('Пожалуйста, выберите валюту')
      return
    }

    try {
      // Преобразуем yields в lines для отправки на бэкенд
      const payload = {
        name: formData.name.trim(),
        product_type: formData.product_type,
        currency: formData.currency,
        lines: (formData.yields || []).map(yieldItem => ({
          min_term_months: yieldItem.term_from_months,
          max_term_months: yieldItem.term_to_months,
          min_amount: yieldItem.amount_from,
          max_amount: yieldItem.amount_to,
          yield_percent: yieldItem.yield_percent,
        })),
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload)
      } else {
        await productsAPI.create(payload)
      }
      setIsDialogOpen(false)
      loadProducts()
    } catch (error: any) {
      console.error('Failed to save product:', error)
      console.error('Error details:', error.response?.data)
      alert(error.response?.data?.error || error.response?.data?.message || 'Ошибка сохранения')
    }
  }

  const addYield = () => {
    setFormData({
      ...formData,
      yields: [
        ...(formData.yields || []),
        {
          term_from_months: 0,
          term_to_months: 0,
          amount_from: 0,
          amount_to: 0,
          yield_percent: 0,
        },
      ],
    })
  }

  const updateYield = (index: number, field: keyof ProductYield, value: number) => {
    const yields = [...(formData.yields || [])]
    yields[index] = { ...yields[index], [field]: value }
    setFormData({ ...formData, yields })
  }

  const removeYield = (index: number) => {
    const yields = formData.yields?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, yields })
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Продукты</h1>
          <p className="text-muted-foreground">
            Управление финансовыми продуктами
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Создать продукт
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список продуктов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.product_type}</TableCell>
                  <TableCell>{product.currency}</TableCell>
                  <TableCell>
                    {product.is_default ? (
                      <span className="text-xs text-muted-foreground">По умолчанию</span>
                    ) : (
                      <span className="text-xs">Пользовательский</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {product.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleClone(product.id)}
                          title="Клонировать"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      {!product.is_default && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Редактировать продукт' : 'Создать продукт'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о продукте
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_type">
                  Тип продукта <span className="text-red-500">*</span>
                </Label>
                {typesLoading ? (
                  <div className="text-sm text-muted-foreground">Загрузка типов...</div>
                ) : typesError ? (
                  <div className="space-y-2">
                    <div className="text-sm text-red-600">Ошибка загрузки типов: {typesError}</div>
                    <div>
                      <Button size="sm" variant="outline" onClick={() => loadProductTypes(true)}>
                        Повторить
                      </Button>
                    </div>
                  </div>
                ) : productTypes && productTypes.length > 0 ? (
                  <Select
                    value={formData.product_type || undefined}
                    onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                  >
                    <SelectTrigger className={!formData.product_type ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Выберите тип продукта" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type.id} value={type.code}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                      {/* If the current value is not in active types, show it as disabled */}
                      {formData.product_type && !productTypes.find(t => t.code === formData.product_type) && (
                        <SelectItem value={formData.product_type} disabled>
                          {formData.product_type} (неактивный)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground">Типы продуктов не найдены.</div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Таблица доходностей</Label>
                <Button type="button" variant="outline" size="sm" onClick={addYield}>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить доходность
                </Button>
              </div>
              {formData.yields && formData.yields.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-2 text-sm font-medium">
                    <div>От суммы</div>
                    <div>До суммы</div>
                    <div>От срока (мес.)</div>
                    <div>До срока (мес.)</div>
                    <div>Доходность (%)</div>
                    <div></div>
                  </div>
                  {formData.yields.map((yieldItem, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2">
                      <Input
                        type="number"
                        value={yieldItem.amount_from}
                        onChange={(e) =>
                          updateYield(index, 'amount_from', parseFloat(e.target.value) || 0)
                        }
                      />
                      <Input
                        type="number"
                        value={yieldItem.amount_to}
                        onChange={(e) =>
                          updateYield(index, 'amount_to', parseFloat(e.target.value) || 0)
                        }
                      />
                      <Input
                        type="number"
                        value={yieldItem.term_from_months}
                        onChange={(e) =>
                          updateYield(index, 'term_from_months', parseInt(e.target.value) || 0)
                        }
                      />
                      <Input
                        type="number"
                        value={yieldItem.term_to_months}
                        onChange={(e) =>
                          updateYield(index, 'term_to_months', parseInt(e.target.value) || 0)
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={yieldItem.yield_percent}
                        onChange={(e) =>
                          updateYield(index, 'yield_percent', parseFloat(e.target.value) || 0)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeYield(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}




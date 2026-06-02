import { useState, useEffect } from 'react'
import {
  productsAPI,
  productTypesAPI,
  Product,
  ProductYield,
  ProductType,
  CommissionSchema,
  CommissionSchemaMeta,
  CommissionRuleTypeMeta,
  CommissionRule,
  CommissionRuleType,
  CommissionRuleBase,
  CommissionRuleFrequency,
  CommissionTier,
} from '@/lib/api'
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

type CommissionRuleDraft = CommissionRule & { _key: string }

const BASE_LABELS: Record<CommissionRuleBase, string> = {
  INITIAL: 'Первоначальный взнос',
  FLOW: 'Потоковые взносы',
  INITIAL_PLUS_FLOW: 'Первоначальный + поток',
  AUM_AVG: 'Средний AUM',
}

const FREQUENCY_LABELS: Record<CommissionRuleFrequency, string> = {
  ONE_TIME: 'Разово',
  MONTHLY: 'Ежемесячно',
  YEARLY: 'Ежегодно',
}

function newRuleKey() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function ruleToDraft(rule: CommissionRule): CommissionRuleDraft {
  return { ...rule, _key: newRuleKey() }
}

function schemaToDrafts(schema: CommissionSchema): CommissionRuleDraft[] {
  return schema.rules.map(ruleToDraft)
}

function draftsToSchema(drafts: CommissionRuleDraft[], version: number): CommissionSchema {
  return {
    version,
    rules: drafts.map(({ _key, ...rule }) => {
      const cleaned: CommissionRule = { rule_type: rule.rule_type }
      if (rule.name?.trim()) cleaned.name = rule.name.trim()
      if (rule.base) cleaned.base = rule.base
      if (rule.frequency) cleaned.frequency = rule.frequency
      if (rule.rate_percent != null && !Number.isNaN(rule.rate_percent)) {
        cleaned.rate_percent = rule.rate_percent
      }
      if (rule.fixed_amount_rub != null && !Number.isNaN(rule.fixed_amount_rub)) {
        cleaned.fixed_amount_rub = rule.fixed_amount_rub
      }
      if (rule.years) cleaned.years = { ...rule.years }
      if (rule.tiers?.length) cleaned.tiers = rule.tiers.map((t) => ({ ...t }))
      return cleaned
    }),
  }
}

function defaultRuleForType(meta: CommissionRuleTypeMeta): CommissionRuleDraft {
  const rule: CommissionRule = { rule_type: meta.code }
  if (meta.allowed_base.length === 1) rule.base = meta.allowed_base[0]
  if (meta.allowed_frequency.length === 1) rule.frequency = meta.allowed_frequency[0]
  if (meta.supports_years) rule.years = { start: 1, end: 1 }
  if (meta.supports_tiers) rule.tiers = [{ year_from: 1, year_to: 1, rate_percent: 0 }]
  return ruleToDraft(rule)
}

function fieldAllowed(meta: CommissionRuleTypeMeta, field: string) {
  return meta.required_fields.includes(field) || meta.optional_fields.includes(field)
}

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
  const [commissionMeta, setCommissionMeta] = useState<CommissionSchemaMeta | null>(null)
  const [commissionMetaLoading, setCommissionMetaLoading] = useState(false)
  const [commissionMetaError, setCommissionMetaError] = useState<string | null>(null)
  const [commissionEnabled, setCommissionEnabled] = useState(false)
  const [commissionRules, setCommissionRules] = useState<CommissionRuleDraft[]>([])
  const [commissionTouched, setCommissionTouched] = useState(false)
  const [initialCommissionSchema, setInitialCommissionSchema] = useState<
    CommissionSchema | null | undefined
  >(undefined)
  const [commissionFormError, setCommissionFormError] = useState<string | null>(null)
  const [commissionFieldErrors, setCommissionFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProducts()
    loadProductTypes()
    loadCommissionMeta()
  }, [activeProject]) // Перезагружаем при смене проекта

  const loadCommissionMeta = async () => {
    try {
      setCommissionMetaError(null)
      setCommissionMetaLoading(true)
      const meta = await productsAPI.getCommissionSchemaMeta()
      setCommissionMeta(meta)
    } catch (error: unknown) {
      console.error('Failed to load commission schema meta:', error)
      const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string }
      setCommissionMetaError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Ошибка загрузки метаданных комиссий'
      )
      setCommissionMeta(null)
    } finally {
      setCommissionMetaLoading(false)
    }
  }

  const resetCommissionState = (
    schema: CommissionSchema | null | undefined,
    touched = false
  ) => {
    if (schema?.rules?.length) {
      setCommissionEnabled(true)
      setCommissionRules(schemaToDrafts(schema))
      setInitialCommissionSchema(schema)
    } else {
      setCommissionEnabled(false)
      setCommissionRules([])
      setInitialCommissionSchema(schema ?? undefined)
    }
    setCommissionTouched(touched)
    setCommissionFormError(null)
    setCommissionFieldErrors({})
  }

  const markCommissionTouched = () => {
    setCommissionTouched(true)
    setCommissionFormError(null)
    setCommissionFieldErrors({})
  }

  const getRuleMeta = (ruleType: CommissionRuleType): CommissionRuleTypeMeta | undefined =>
    commissionMeta?.rule_types.find((t) => t.code === ruleType)

  const getFieldError = (fieldPath: string) => commissionFieldErrors[fieldPath]

  const fieldErrorClass = (fieldPath: string) =>
    getFieldError(fieldPath) ? 'border-red-500' : ''

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
    resetCommissionState(undefined)
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
    resetCommissionState(product.commission_schema ?? null)
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

    let commissionPayload: { commission_schema?: CommissionSchema | null } = {}

    if (!commissionTouched && editingProduct?.commission_schema) {
      commissionPayload = { commission_schema: editingProduct.commission_schema }
    } else if (commissionEnabled) {
      if (!commissionMeta) {
        setCommissionFormError('Метаданные комиссий не загружены. Нажмите «Повторить».')
        return
      }
      if (commissionRules.length === 0) {
        setCommissionFormError('Добавьте хотя бы одно правило комиссии')
        return
      }
      commissionPayload = {
        commission_schema: draftsToSchema(
          commissionRules,
          commissionMeta.version ?? initialCommissionSchema?.version ?? 1
        ),
      }
    } else if (commissionTouched && editingProduct && initialCommissionSchema) {
      commissionPayload = { commission_schema: null }
    }

    try {
      const payload = {
        name: formData.name.trim(),
        product_type: formData.product_type,
        currency: formData.currency,
        lines: (formData.yields || []).map((yieldItem) => ({
          min_term_months: yieldItem.term_from_months,
          max_term_months: yieldItem.term_to_months,
          min_amount: yieldItem.amount_from,
          max_amount: yieldItem.amount_to,
          yield_percent: yieldItem.yield_percent,
        })),
        ...commissionPayload,
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload)
      } else {
        await productsAPI.create(payload)
      }
      setIsDialogOpen(false)
      loadProducts()
    } catch (error: unknown) {
      console.error('Failed to save product:', error)
      const err = error as {
        response?: {
          status?: number
          data?: {
            error?: string
            message?: string
            details?: Array<{ field_path?: string; message?: string }>
          }
        }
      }
      const details = err.response?.data?.details
      if (Array.isArray(details) && details.length > 0) {
        const map: Record<string, string> = {}
        for (const item of details) {
          if (item.field_path && item.message) {
            map[item.field_path] = item.message
          }
        }
        if (Object.keys(map).length > 0) {
          setCommissionFieldErrors(map)
          setCommissionFormError(
            err.response?.data?.message || 'Ошибка валидации схемы комиссий'
          )
          return
        }
      }
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Ошибка сохранения'
      )
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

  const setCommissionEnabledState = (enabled: boolean) => {
    markCommissionTouched()
    setCommissionEnabled(enabled)
    if (!enabled) {
      setCommissionRules([])
    } else if (commissionRules.length === 0 && commissionMeta?.rule_types[0]) {
      setCommissionRules([defaultRuleForType(commissionMeta.rule_types[0])])
    }
  }

  const addCommissionRule = () => {
    if (!commissionMeta?.rule_types[0]) return
    markCommissionTouched()
    setCommissionEnabled(true)
    setCommissionRules((prev) => [...prev, defaultRuleForType(commissionMeta.rule_types[0])])
  }

  const removeCommissionRule = (index: number) => {
    markCommissionTouched()
    setCommissionRules((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCommissionRule = (index: number, patch: Partial<CommissionRule>) => {
    markCommissionTouched()
    setCommissionRules((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const changeCommissionRuleType = (index: number, ruleType: CommissionRuleType) => {
    const meta = getRuleMeta(ruleType)
    if (!meta) return
    markCommissionTouched()
    setCommissionRules((prev) => {
      const next = [...prev]
      next[index] = defaultRuleForType(meta)
      return next
    })
  }

  const addCommissionTier = (ruleIndex: number) => {
    markCommissionTouched()
    setCommissionRules((prev) => {
      const next = [...prev]
      const tiers = [...(next[ruleIndex].tiers || [])]
      const last = tiers[tiers.length - 1]
      tiers.push({
        year_from: last ? last.year_to + 1 : 1,
        year_to: last ? last.year_to + 1 : 1,
        rate_percent: 0,
      })
      next[ruleIndex] = { ...next[ruleIndex], tiers }
      return next
    })
  }

  const updateCommissionTier = (
    ruleIndex: number,
    tierIndex: number,
    patch: Partial<CommissionTier>
  ) => {
    markCommissionTouched()
    setCommissionRules((prev) => {
      const next = [...prev]
      const tiers = [...(next[ruleIndex].tiers || [])]
      tiers[tierIndex] = { ...tiers[tierIndex], ...patch }
      next[ruleIndex] = { ...next[ruleIndex], tiers }
      return next
    })
  }

  const removeCommissionTier = (ruleIndex: number, tierIndex: number) => {
    markCommissionTouched()
    setCommissionRules((prev) => {
      const next = [...prev]
      const tiers = (next[ruleIndex].tiers || []).filter((_, i) => i !== tierIndex)
      next[ruleIndex] = { ...next[ruleIndex], tiers: tiers.length ? tiers : undefined }
      return next
    })
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

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="text-base">Схема комиссий</Label>
                  <p className="text-xs text-muted-foreground">
                    Правила прогноза комиссий для CRM по этому продукту
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={commissionEnabled}
                    onChange={(e) => setCommissionEnabledState(e.target.checked)}
                    className="h-4 w-4 rounded border"
                  />
                  Настроить комиссии
                </label>
              </div>

              {commissionMetaLoading && (
                <p className="text-sm text-muted-foreground">Загрузка типов правил…</p>
              )}
              {commissionMetaError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">{commissionMetaError}</p>
                  <Button type="button" size="sm" variant="outline" onClick={loadCommissionMeta}>
                    Повторить
                  </Button>
                </div>
              )}

              {commissionEnabled && commissionMeta && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Версия схемы: {commissionMeta.version}
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={addCommissionRule}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить правило
                    </Button>
                  </div>

                  {commissionRules.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Нет правил. Нажмите «Добавить правило».
                    </p>
                  )}

                  {commissionRules.map((rule, ruleIndex) => {
                    const meta = getRuleMeta(rule.rule_type)
                    const rulePrefix = `rules.${ruleIndex}`
                    return (
                      <div
                        key={rule._key}
                        className="space-y-3 rounded-md border bg-muted/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="grid flex-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label>Тип правила</Label>
                              <Select
                                value={rule.rule_type}
                                onValueChange={(v) =>
                                  changeCommissionRuleType(ruleIndex, v as CommissionRuleType)
                                }
                              >
                                <SelectTrigger
                                  className={fieldErrorClass(`${rulePrefix}.rule_type`)}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {commissionMeta.rule_types.map((rt) => (
                                    <SelectItem key={rt.code} value={rt.code}>
                                      {rt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {meta?.description && (
                                <p className="text-xs text-muted-foreground">{meta.description}</p>
                              )}
                              {getFieldError(`${rulePrefix}.rule_type`) && (
                                <p className="text-xs text-red-600">
                                  {getFieldError(`${rulePrefix}.rule_type`)}
                                </p>
                              )}
                            </div>
                            {meta && fieldAllowed(meta, 'name') && (
                              <div className="space-y-1">
                                <Label>Название</Label>
                                <Input
                                  value={rule.name ?? ''}
                                  onChange={(e) =>
                                    updateCommissionRule(ruleIndex, {
                                      name: e.target.value || undefined,
                                    })
                                  }
                                  className={fieldErrorClass(`${rulePrefix}.name`)}
                                />
                                {getFieldError(`${rulePrefix}.name`) && (
                                  <p className="text-xs text-red-600">
                                    {getFieldError(`${rulePrefix}.name`)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCommissionRule(ruleIndex)}
                            title="Удалить правило"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {meta && (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {meta.allowed_base.length > 0 && fieldAllowed(meta, 'base') && (
                              <div className="space-y-1">
                                <Label>База</Label>
                                <Select
                                  value={rule.base ?? ''}
                                  onValueChange={(v) =>
                                    updateCommissionRule(ruleIndex, {
                                      base: v as CommissionRuleBase,
                                    })
                                  }
                                >
                                  <SelectTrigger
                                    className={fieldErrorClass(`${rulePrefix}.base`)}
                                  >
                                    <SelectValue placeholder="Выберите базу" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {meta.allowed_base.map((b) => (
                                      <SelectItem key={b} value={b}>
                                        {BASE_LABELS[b] ?? b}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {getFieldError(`${rulePrefix}.base`) && (
                                  <p className="text-xs text-red-600">
                                    {getFieldError(`${rulePrefix}.base`)}
                                  </p>
                                )}
                              </div>
                            )}
                            {meta.allowed_frequency.length > 0 &&
                              fieldAllowed(meta, 'frequency') && (
                                <div className="space-y-1">
                                  <Label>Периодичность</Label>
                                  <Select
                                    value={rule.frequency ?? ''}
                                    onValueChange={(v) =>
                                      updateCommissionRule(ruleIndex, {
                                        frequency: v as CommissionRuleFrequency,
                                      })
                                    }
                                  >
                                    <SelectTrigger
                                      className={fieldErrorClass(`${rulePrefix}.frequency`)}
                                    >
                                      <SelectValue placeholder="Выберите периодичность" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {meta.allowed_frequency.map((f) => (
                                        <SelectItem key={f} value={f}>
                                          {FREQUENCY_LABELS[f] ?? f}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {getFieldError(`${rulePrefix}.frequency`) && (
                                    <p className="text-xs text-red-600">
                                      {getFieldError(`${rulePrefix}.frequency`)}
                                    </p>
                                  )}
                                </div>
                              )}
                            {fieldAllowed(meta, 'rate_percent') && (
                              <div className="space-y-1">
                                <Label>Ставка, %</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={rule.rate_percent ?? ''}
                                  onChange={(e) =>
                                    updateCommissionRule(ruleIndex, {
                                      rate_percent:
                                        e.target.value === ''
                                          ? undefined
                                          : parseFloat(e.target.value),
                                    })
                                  }
                                  className={fieldErrorClass(`${rulePrefix}.rate_percent`)}
                                />
                                {getFieldError(`${rulePrefix}.rate_percent`) && (
                                  <p className="text-xs text-red-600">
                                    {getFieldError(`${rulePrefix}.rate_percent`)}
                                  </p>
                                )}
                              </div>
                            )}
                            {fieldAllowed(meta, 'fixed_amount_rub') && (
                              <div className="space-y-1">
                                <Label>Сумма, ₽</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={rule.fixed_amount_rub ?? ''}
                                  onChange={(e) =>
                                    updateCommissionRule(ruleIndex, {
                                      fixed_amount_rub:
                                        e.target.value === ''
                                          ? undefined
                                          : parseFloat(e.target.value),
                                    })
                                  }
                                  className={fieldErrorClass(`${rulePrefix}.fixed_amount_rub`)}
                                />
                                {getFieldError(`${rulePrefix}.fixed_amount_rub`) && (
                                  <p className="text-xs text-red-600">
                                    {getFieldError(`${rulePrefix}.fixed_amount_rub`)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {meta?.supports_years && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label>Годы: с</Label>
                              <Input
                                type="number"
                                min={1}
                                value={rule.years?.start ?? ''}
                                onChange={(e) =>
                                  updateCommissionRule(ruleIndex, {
                                    years: {
                                      start: parseInt(e.target.value, 10) || 1,
                                      end: rule.years?.end ?? 1,
                                    },
                                  })
                                }
                                className={fieldErrorClass(`${rulePrefix}.years.start`)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Годы: по</Label>
                              <Input
                                type="number"
                                min={1}
                                value={rule.years?.end ?? ''}
                                onChange={(e) =>
                                  updateCommissionRule(ruleIndex, {
                                    years: {
                                      start: rule.years?.start ?? 1,
                                      end: parseInt(e.target.value, 10) || 1,
                                    },
                                  })
                                }
                                className={fieldErrorClass(`${rulePrefix}.years.end`)}
                              />
                            </div>
                          </div>
                        )}

                        {meta?.supports_tiers && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Ступени по годам</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addCommissionTier(ruleIndex)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Ступень
                              </Button>
                            </div>
                            {(rule.tiers || []).map((tier, tierIndex) => (
                              <div
                                key={tierIndex}
                                className="grid grid-cols-4 gap-2 items-end"
                              >
                                <div className="space-y-1">
                                  <Label className="text-xs">Год с</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={tier.year_from}
                                    onChange={(e) =>
                                      updateCommissionTier(ruleIndex, tierIndex, {
                                        year_from: parseInt(e.target.value, 10) || 1,
                                      })
                                    }
                                    className={fieldErrorClass(
                                      `${rulePrefix}.tiers.${tierIndex}.year_from`
                                    )}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Год по</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={tier.year_to}
                                    onChange={(e) =>
                                      updateCommissionTier(ruleIndex, tierIndex, {
                                        year_to: parseInt(e.target.value, 10) || 1,
                                      })
                                    }
                                    className={fieldErrorClass(
                                      `${rulePrefix}.tiers.${tierIndex}.year_to`
                                    )}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Ставка %</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={tier.rate_percent}
                                    onChange={(e) =>
                                      updateCommissionTier(ruleIndex, tierIndex, {
                                        rate_percent: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className={fieldErrorClass(
                                      `${rulePrefix}.tiers.${tierIndex}.rate_percent`
                                    )}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCommissionTier(ruleIndex, tierIndex)}
                                  disabled={(rule.tiers?.length ?? 0) <= 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {commissionFormError && (
                <p className="text-sm text-red-600">{commissionFormError}</p>
              )}
              {!commissionEnabled && editingProduct?.commission_schema && !commissionTouched && (
                <p className="text-xs text-muted-foreground">
                  Схема комиссий сохранится без изменений, пока не включите настройку.
                </p>
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




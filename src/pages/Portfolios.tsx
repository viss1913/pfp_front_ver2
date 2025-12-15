import { useState, useEffect } from 'react'
import { portfoliosAPI, productsAPI, Portfolio, Product, PortfolioInstrument, PortfolioInstrumentWithBucket, PortfolioRiskProfile, PortfolioClass, preparePortfolioData } from '@/lib/api'
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
import { Plus, Edit, Trash2, X } from 'lucide-react'

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [classes, setClasses] = useState<PortfolioClass[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [isClassesSelectOpen, setIsClassesSelectOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Portfolio>>({
    name: '',
    currency: 'RUB',
    amount_from: 0,
    amount_to: 0,
    term_from_months: 0,
    term_to_months: 0,
    age_from: undefined,
    age_to: undefined,
    investor_type: undefined,
    gender: undefined,
    classes: [],
    risk_profiles: [
      {
        profile_type: 'CONSERVATIVE',
        instruments: [],
      },
      {
        profile_type: 'BALANCED',
        instruments: [],
      },
      {
        profile_type: 'AGGRESSIVE',
        instruments: [],
      },
    ],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [portfoliosData, productsData, classesData] = await Promise.all([
        portfoliosAPI.list(),
        productsAPI.list(),
        portfoliosAPI.getClasses(),
      ])
      setPortfolios(portfoliosData)
      setProducts(productsData)
      setClasses(classesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const BUCKET_MAP = {
    initial_capital: 'INITIAL_CAPITAL',
    initial_replenishment: 'TOP_UP',
  } as const

  const normalizeRiskProfiles = (profiles: any[] | undefined) => {
    if (!profiles) return undefined
    return profiles.map((p) => {
      if (p?.instruments && Array.isArray(p.instruments)) return p
      const instruments: PortfolioInstrumentWithBucket[] = []
      if (Array.isArray(p?.initial_capital)) {
        instruments.push(
          ...p.initial_capital.map((inst: any, i: number) => ({
            product_id: inst.product_id,
            share_percent: inst.share_percent,
            order_index: inst.order_index ?? i,
            bucket_type: 'INITIAL_CAPITAL',
          }))
        )
      }
      if (Array.isArray(p?.initial_replenishment)) {
        instruments.push(
          ...p.initial_replenishment.map((inst: any, i: number) => ({
            product_id: inst.product_id,
            share_percent: inst.share_percent,
            order_index: inst.order_index ?? i,
            bucket_type: 'TOP_UP',
          }))
        )
      }
      return {
        profile_type: p.profile_type,
        instruments,
      }
    })
  }

  const buildRiskProfilesFromForm = (profiles: any[] | undefined) => {
    if (!profiles) return undefined
    return profiles.map((p: any) => {
      let instruments: any[] = []
      if (p?.instruments && Array.isArray(p.instruments)) {
        instruments = p.instruments
      } else {
        if (Array.isArray(p?.initial_capital)) {
          instruments.push(
            ...p.initial_capital.map((inst: any, i: number) => ({
              product_id: inst.product_id,
              share_percent: inst.share_percent,
              order_index: inst.order_index ?? i,
              bucket_type: 'INITIAL_CAPITAL',
            }))
          )
        }
        if (Array.isArray(p?.initial_replenishment)) {
          instruments.push(
            ...p.initial_replenishment.map((inst: any, i: number) => ({
              product_id: inst.product_id,
              share_percent: inst.share_percent,
              order_index: inst.order_index ?? i,
              bucket_type: 'TOP_UP',
            }))
          )
        }
      }

      const sanitized = (instruments || []).map((inst: any) => {
        const bt = inst.bucket_type ?? inst.bucketType ?? null
        const normalizedBucket = bt ? String(bt).toUpperCase() : null
        return {
          product_id: Number(inst.product_id),
          bucket_type: normalizedBucket === 'INITIAL_CAPITAL' ? 'INITIAL_CAPITAL' : (normalizedBucket === 'TOP_UP' ? 'TOP_UP' : null),
          share_percent: Number(inst.share_percent ?? 0),
          order_index: inst.order_index !== undefined && inst.order_index !== null ? Number(inst.order_index) : null,
        }
      })

      return {
        profile_type: p.profile_type,
        instruments: sanitized,
      }
    })
  }

  const handleCreate = () => {
    setEditingPortfolio(null)
    setFormData({
      name: '',
      currency: 'RUB',
      amount_from: 0,
      amount_to: 0,
      term_from_months: 0,
      term_to_months: 0,
      age_from: undefined,
      age_to: undefined,
      investor_type: undefined,
      gender: undefined,
      classes: [],
      risk_profiles: [
        {
          profile_type: 'CONSERVATIVE',
          instruments: [],
        },
        {
          profile_type: 'BALANCED',
          instruments: [],
        },
        {
          profile_type: 'AGGRESSIVE',
          instruments: [],
        },
      ],
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio)
    setFormData({
      name: portfolio.name,
      currency: portfolio.currency,
      amount_from: portfolio.amount_from,
      amount_to: portfolio.amount_to,
      term_from_months: portfolio.term_from_months,
      term_to_months: portfolio.term_to_months,
      age_from: portfolio.age_from,
      age_to: portfolio.age_to,
      investor_type: portfolio.investor_type,
      gender: portfolio.gender,
      classes: portfolio.classes || [],
      risk_profiles: normalizeRiskProfiles((portfolio as any).riskProfiles ?? portfolio.risk_profiles) || [
        {
          profile_type: 'CONSERVATIVE',
          instruments: [],
        },
        {
          profile_type: 'BALANCED',
          instruments: [],
        },
        {
          profile_type: 'AGGRESSIVE',
          instruments: [],
        },
      ],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот портфель?')) return
    try {
      await portfoliosAPI.delete(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete portfolio:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingPortfolio) {
        const payload: any = { ...formData }
        if (formData.risk_profiles !== undefined) {
          payload.riskProfiles = buildRiskProfilesFromForm(formData.risk_profiles)
          delete payload.risk_profiles
        }

        // Нормализация и логирование
        let normalized: any
        try {
          normalized = preparePortfolioData(payload)
        } catch (err: any) {
          console.error('Normalization error:', err.message || err)
          alert('Ошибка подготовки данных: ' + (err.message || err))
          return
        }

        console.log('=== Отправка портфеля (update) ===')
        console.log('Данные:', JSON.stringify(normalized, null, 2))
        console.log('Типы product_id:', normalized.riskProfiles?.map((p: any) => p.instruments?.map((i: any) => typeof i.product_id)))
        console.log('Типы share_percent:', normalized.riskProfiles?.map((p: any) => p.instruments?.map((i: any) => typeof i.share_percent)))

        await portfoliosAPI.update(editingPortfolio.id, normalized as any)
      } else {
        const payload: any = { ...formData }
        if (formData.risk_profiles !== undefined) {
          payload.riskProfiles = buildRiskProfilesFromForm(formData.risk_profiles)
          delete payload.risk_profiles
        }

        // Нормализация и логирование
        let normalized: any
        try {
          normalized = preparePortfolioData(payload)
        } catch (err: any) {
          console.error('Normalization error:', err.message || err)
          alert('Ошибка подготовки данных: ' + (err.message || err))
          return
        }

        console.log('=== Отправка портфеля (create) ===')
        console.log('Данные:', JSON.stringify(normalized, null, 2))
        console.log('Типы product_id:', normalized.riskProfiles?.map((p: any) => p.instruments?.map((i: any) => typeof i.product_id)))
        console.log('Типы share_percent:', normalized.riskProfiles?.map((p: any) => p.instruments?.map((i: any) => typeof i.share_percent)))

        await portfoliosAPI.create(normalized as any)
      }
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Failed to save portfolio:', error.response?.data || error)
      if (error.response?.status === 400) {
        console.error('Детали валидации:', error.response.data.details)
        alert('Ошибка валидации: ' + JSON.stringify(error.response.data.details))
      } else if (error.response?.status === 500) {
        console.error('Server error:', error.response.data)
        alert('Серверная ошибка при сохранении')
      } else {
        alert(error.response?.data?.error || error.response?.data?.message || 'Ошибка сохранения')
      }
    }
  }

  const addInstrument = (profileType: string, bucketType: 'initial_capital' | 'initial_replenishment') => {
    const bucketName = BUCKET_MAP[bucketType]
    const riskProfiles = formData.risk_profiles?.map((profile) => {
      if (profile.profile_type !== profileType) return profile
      const instruments = profile.instruments || []
      const countInBucket = instruments.filter((i: any) => i.bucket_type === bucketName).length
      return {
        ...profile,
        instruments: [
          ...instruments,
          {
            product_id: products[0]?.id || 0,
            share_percent: 0,
            order_index: countInBucket,
            bucket_type: bucketName,
          },
        ],
      }
    }) || []
    setFormData({ ...formData, risk_profiles: riskProfiles })
  }

  const updateInstrument = (
    profileType: string,
    bucketType: 'initial_capital' | 'initial_replenishment',
    index: number,
    field: keyof PortfolioInstrument | keyof PortfolioInstrumentWithBucket,
    value: any
  ) => {
    const bucketName = BUCKET_MAP[bucketType]
    const riskProfiles = formData.risk_profiles?.map((profile) => {
      if (profile.profile_type !== profileType) return profile
      const instruments = profile.instruments || []
      const indices = instruments.map((_, i) => i).filter(i => instruments[i].bucket_type === bucketName)
      const realIndex = indices[index]
      if (realIndex === undefined) return profile
      const newInstruments = instruments.map((inst, i) => i === realIndex ? { ...inst, [field]: value } : inst)
      return { ...profile, instruments: newInstruments }
    }) || []
    setFormData({ ...formData, risk_profiles: riskProfiles })
  }

  const removeInstrument = (
    profileType: string,
    bucketType: 'initial_capital' | 'initial_replenishment',
    index: number
  ) => {
    const bucketName = BUCKET_MAP[bucketType]
    const riskProfiles = formData.risk_profiles?.map((profile) => {
      if (profile.profile_type !== profileType) return profile
      const instruments = profile.instruments || []
      const indices = instruments.map((_, i) => i).filter(i => instruments[i].bucket_type === bucketName)
      const realIndex = indices[index]
      if (realIndex === undefined) return profile
      return { ...profile, instruments: instruments.filter((_, i) => i !== realIndex) }
    }) || []
    setFormData({ ...formData, risk_profiles: riskProfiles })
  }

  const getRiskProfile = (profileType: string): PortfolioRiskProfile | undefined => {
    return formData.risk_profiles?.find((p) => p.profile_type === profileType)
  }

  const calculateTotalShare = (instruments: { share_percent: number }[]): number => {
    return (instruments || []).reduce((sum, inst) => sum + (inst.share_percent || 0), 0)
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Портфели</h1>
          <p className="text-muted-foreground">
            Управление модельными портфелями
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Создать портфель
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список портфелей</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead>Срок (мес.)</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolios.map((portfolio) => (
                <TableRow key={portfolio.id}>
                  <TableCell className="font-medium">{portfolio.name}</TableCell>
                  <TableCell>{portfolio.currency}</TableCell>
                  <TableCell>
                    {portfolio.term_from_months} - {portfolio.term_to_months}
                  </TableCell>
                  <TableCell>
                    {(portfolio.amount_from ?? 0).toLocaleString()} - {(portfolio.amount_to ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(portfolio)}
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(portfolio.id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPortfolio ? 'Редактировать портфель' : 'Создать портфель'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о портфеле
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
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_term">Мин. срок (мес.)</Label>
                <Input
                  id="min_term"
                  type="number"
                  value={formData.term_from_months}
                  onChange={(e) =>
                    setFormData({ ...formData, term_from_months: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_term">Макс. срок (мес.)</Label>
                <Input
                  id="max_term"
                  type="number"
                  value={formData.term_to_months}
                  onChange={(e) =>
                    setFormData({ ...formData, term_to_months: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_amount">Мин. сумма</Label>
                <Input
                  id="min_amount"
                  type="number"
                  value={formData.amount_from}
                  onChange={(e) =>
                    setFormData({ ...formData, amount_from: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_amount">Макс. сумма</Label>
                <Input
                  id="max_amount"
                  type="number"
                  value={formData.amount_to}
                  onChange={(e) =>
                    setFormData({ ...formData, amount_to: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age_from">Возраст от</Label>
                <Input
                  id="age_from"
                  type="number"
                  value={formData.age_from || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, age_from: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age_to">Возраст до</Label>
                <Input
                  id="age_to"
                  type="number"
                  value={formData.age_to || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, age_to: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investor_type">Тип инвестора</Label>
                <Select
                  value={formData.investor_type || ''}
                  onValueChange={(value) => setFormData({ ...formData, investor_type: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUALIFIED">QUALIFIED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Пол</Label>
                <Select
                  value={formData.gender || ''}
                  onValueChange={(value) => setFormData({ ...formData, gender: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Мужской</SelectItem>
                    <SelectItem value="Female">Женский</SelectItem>
                    <SelectItem value="Any">Любой</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classes">Тип цели *</Label>
              <div className="relative">
                <div
                  className="flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setIsClassesSelectOpen(!isClassesSelectOpen)}
                >
                  {formData.classes && formData.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.classes.map((classId) => {
                        const classItem = classes.find(c => c.id === classId)
                        if (!classItem) return null
                        return (
                          <div
                            key={classId}
                            className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm"
                          >
                            <span>{classItem.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData({
                                  ...formData,
                                  classes: formData.classes?.filter(id => id !== classId) || [],
                                })
                              }}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Выберите типы целей</span>
                  )}
                </div>
                {isClassesSelectOpen && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
                    <div className="p-1">
                      {classes.map((classItem) => {
                        const isSelected = formData.classes?.includes(classItem.id)
                        return (
                          <div
                            key={classItem.id}
                            className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
                              isSelected ? 'bg-accent' : ''
                            }`}
                            onClick={() => {
                              const currentClasses = formData.classes || []
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  classes: currentClasses.filter(id => id !== classItem.id),
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  classes: [...currentClasses, classItem.id],
                                })
                              }
                            }}
                          >
                            {classItem.name}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              {isClassesSelectOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsClassesSelectOpen(false)}
                />
              )}
            </div>

            <div className="space-y-6">
              <Label className="text-lg font-semibold">Риск-профили</Label>
              {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((profileType) => {
                const profile = getRiskProfile(profileType)
                const profileNames = {
                  CONSERVATIVE: 'Консервативный',
                  BALANCED: 'Сбалансированный',
                  AGGRESSIVE: 'Агрессивный',
                }
                return (
                  <div key={profileType} className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-base">Риск-профиль {profileNames[profileType]}</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Первоначальный капитал</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addInstrument(profileType, 'initial_capital')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить
                          </Button>
                        </div>
                        {(() => {
                          const cap = profile?.instruments?.filter((i: any) => i.bucket_type === 'INITIAL_CAPITAL') || []
                          return cap.length > 0 ? (
                            <div className="space-y-2">
                              {cap.map((instrument: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                  <div className="flex-1">
                                    <Select
                                      value={instrument.product_id.toString()}
                                      onValueChange={(value) =>
                                        updateInstrument(profileType, 'initial_capital', index, 'product_id', parseInt(value))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {products.map((product) => (
                                          <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-24">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={instrument.share_percent}
                                      onChange={(e) =>
                                        updateInstrument(
                                          profileType,
                                          'initial_capital',
                                          index,
                                          'share_percent',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="text-right"
                                    />
                                  </div>
                                  <span className="w-8 text-sm">%</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeInstrument(profileType, 'initial_capital', index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <div className="text-sm text-muted-foreground">
                                Итого: {calculateTotalShare(cap).toFixed(2)}%
                                {calculateTotalShare(cap) !== 100 && (
                                  <span className="text-destructive ml-2">(должно быть 100%)</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Нет инструментов</p>
                          )
                        })()}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Пополнение капитала</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addInstrument(profileType, 'initial_replenishment')}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить
                          </Button>
                        </div>
                        {(() => {
                          const topups = profile?.instruments?.filter((i: any) => i.bucket_type === 'TOP_UP') || []
                          return topups.length > 0 ? (
                            <div className="space-y-2">
                              {topups.map((instrument: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                                  <div className="flex-1">
                                    <Select
                                      value={instrument.product_id.toString()}
                                      onValueChange={(value) =>
                                        updateInstrument(profileType, 'initial_replenishment', index, 'product_id', parseInt(value))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {products.map((product) => (
                                          <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="w-24">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={instrument.share_percent}
                                      onChange={(e) =>
                                        updateInstrument(
                                          profileType,
                                          'initial_replenishment',
                                          index,
                                          'share_percent',
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="text-right"
                                    />
                                  </div>
                                  <span className="w-8 text-sm">%</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeInstrument(profileType, 'initial_replenishment', index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <div className="text-sm text-muted-foreground">
                                Итого: {calculateTotalShare(topups).toFixed(2)}%
                                {calculateTotalShare(topups) !== 100 && topups.length > 0 && (
                                  <span className="text-destructive ml-2">(должно быть 100%)</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Нет инструментов</p>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
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

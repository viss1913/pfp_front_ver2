import { useState, useEffect } from 'react'
import { portfoliosAPI, productsAPI, Portfolio, Product, PortfolioInstrument, BucketType } from '@/lib/api'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function Portfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [formData, setFormData] = useState<Partial<Portfolio>>({
    name: '',
    currency: 'RUB',
    amount_from: 0,
    amount_to: 0,
    term_from_months: 0,
    term_to_months: 0,
    classes: [],
    riskProfiles: [
      {
        profile_type: 'CONSERVATIVE',
        potential_yield_percent: 0,
        instruments: [],
      },
      {
        profile_type: 'BALANCED',
        potential_yield_percent: 0,
        instruments: [],
      },
      {
        profile_type: 'AGGRESSIVE',
        potential_yield_percent: 0,
        instruments: [],
      },
    ],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [portfoliosData, productsData] = await Promise.all([
        portfoliosAPI.list(),
        productsAPI.list(),
      ])
      // Нормализуем bucket_type в данных портфелей
      const normalizedPortfolios = portfoliosData.map((portfolio) => ({
        ...portfolio,
        riskProfiles: portfolio.riskProfiles?.map((profile) => ({
          ...profile,
          instruments: profile.instruments.map((inst) => ({
            ...inst,
            bucket_type: (inst.bucket_type === 'INITIAL_CAPITAL' || inst.bucket_type === 'TOP_UP'
              ? inst.bucket_type
              : 'INITIAL_CAPITAL') as BucketType,
          })),
        })),
      }))
      setPortfolios(normalizedPortfolios)
      setProducts(productsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
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
      classes: [],
      riskProfiles: [
        {
          profile_type: 'CONSERVATIVE',
          potential_yield_percent: 0,
          instruments: [],
        },
        {
          profile_type: 'BALANCED',
          potential_yield_percent: 0,
          instruments: [],
        },
        {
          profile_type: 'AGGRESSIVE',
          potential_yield_percent: 0,
          instruments: [],
        },
      ],
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio)
    // Приводим bucket_type к правильному типу при загрузке данных
    const normalizedRiskProfiles = portfolio.riskProfiles?.map((profile) => ({
      ...profile,
      instruments: profile.instruments.map((inst) => ({
        ...inst,
        bucket_type: (inst.bucket_type === 'INITIAL_CAPITAL' || inst.bucket_type === 'TOP_UP'
          ? inst.bucket_type
          : 'INITIAL_CAPITAL') as BucketType,
      })),
    })) || [
      {
        profile_type: 'CONSERVATIVE' as const,
        potential_yield_percent: 0,
        instruments: [],
      },
      {
        profile_type: 'BALANCED' as const,
        potential_yield_percent: 0,
        instruments: [],
      },
      {
        profile_type: 'AGGRESSIVE' as const,
        potential_yield_percent: 0,
        instruments: [],
      },
    ]
    
    setFormData({
      name: portfolio.name,
      currency: portfolio.currency,
      amount_from: portfolio.amount_from,
      amount_to: portfolio.amount_to,
      term_from_months: portfolio.term_from_months,
      term_to_months: portfolio.term_to_months,
      classes: portfolio.classes || [],
      riskProfiles: normalizedRiskProfiles,
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
        await portfoliosAPI.update(editingPortfolio.id, formData)
      } else {
        await portfoliosAPI.create(formData)
      }
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Failed to save portfolio:', error)
      alert(error.response?.data?.error || error.response?.data?.message || 'Ошибка сохранения')
    }
  }

  const updateRiskProfile = (profileType: string, field: string, value: any) => {
    const riskProfiles = formData.riskProfiles?.map((profile) =>
      profile.profile_type === profileType ? { ...profile, [field]: value } : profile
    ) || []
    setFormData({ ...formData, riskProfiles })
  }

  const addInstrument = (profileType: string) => {
    const riskProfiles = formData.riskProfiles?.map((profile) =>
      profile.profile_type === profileType
        ? {
            ...profile,
            instruments: [
              ...profile.instruments,
              {
                product_id: products[0]?.id || 0,
                bucket_type: 'INITIAL_CAPITAL',
                share_percent: 0,
                order_index: profile.instruments.length,
              },
            ],
          }
        : profile
    ) || []
    setFormData({ ...formData, riskProfiles })
  }

  const updateInstrument = (
    profileType: string,
    index: number,
    field: keyof PortfolioInstrument,
    value: any
  ) => {
    const riskProfiles = formData.riskProfiles?.map((profile) =>
      profile.profile_type === profileType
        ? {
            ...profile,
            instruments: profile.instruments.map((inst, i) => {
              if (i === index) {
                // Приводим bucket_type к правильному типу
                if (field === 'bucket_type') {
                  return { ...inst, [field]: (value === 'INITIAL_CAPITAL' || value === 'TOP_UP' ? value : 'INITIAL_CAPITAL') as BucketType }
                }
                return { ...inst, [field]: value }
              }
              return inst
            }),
          }
        : profile
    ) || []
    setFormData({ ...formData, riskProfiles })
  }

  const removeInstrument = (profileType: string, index: number) => {
    const riskProfiles = formData.riskProfiles?.map((profile) =>
      profile.profile_type === profileType
        ? {
            ...profile,
            instruments: profile.instruments.filter((_, i) => i !== index),
          }
        : profile
    ) || []
    setFormData({ ...formData, riskProfiles })
  }

  const getRiskProfile = (profileType: string) => {
    return formData.riskProfiles?.find((p) => p.profile_type === profileType)
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
                    {portfolio.amount_from.toLocaleString()} - {portfolio.amount_to.toLocaleString()}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-4">
              <Label>Риск-профили</Label>
              <Tabs defaultValue="CONSERVATIVE" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="CONSERVATIVE">Консервативный</TabsTrigger>
                  <TabsTrigger value="BALANCED">Сбалансированный</TabsTrigger>
                  <TabsTrigger value="AGGRESSIVE">Агрессивный</TabsTrigger>
                </TabsList>
                {(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((profileType) => {
                  const profile = getRiskProfile(profileType)
                  return (
                    <TabsContent key={profileType} value={profileType} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Потенциальная доходность (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={profile?.potential_yield_percent || 0}
                          onChange={(e) =>
                            updateRiskProfile(
                              profileType,
                              'potential_yield_percent',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Инструменты</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addInstrument(profileType)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить
                          </Button>
                        </div>
                        {profile?.instruments && profile.instruments.length > 0 && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-2 text-sm font-medium">
                              <div>Продукт</div>
                              <div>Тип корзины</div>
                              <div>Доля (%)</div>
                              <div>Порядок</div>
                              <div></div>
                            </div>
                            {profile.instruments.map((instrument, index) => (
                              <div key={index} className="grid grid-cols-5 gap-2">
                                <Select
                                  value={instrument.product_id.toString()}
                                  onValueChange={(value) =>
                                    updateInstrument(profileType, index, 'product_id', parseInt(value))
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
                                <Select
                                  value={instrument.bucket_type}
                                  onValueChange={(value) =>
                                    updateInstrument(profileType, index, 'bucket_type', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="INITIAL_CAPITAL">Начальный капитал</SelectItem>
                                    <SelectItem value="TOP_UP">Пополнение</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={instrument.share_percent}
                                  onChange={(e) =>
                                    updateInstrument(
                                      profileType,
                                      index,
                                      'share_percent',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                />
                                <Input
                                  type="number"
                                  value={instrument.order_index}
                                  onChange={(e) =>
                                    updateInstrument(
                                      profileType,
                                      index,
                                      'order_index',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeInstrument(profileType, index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  )
                })}
              </Tabs>
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


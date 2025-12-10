import { useState, useEffect } from 'react'
import { portfoliosAPI, productsAPI, Portfolio, Product, PortfolioInstrument, PortfolioRiskProfile } from '@/lib/api'
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
    age_from: undefined,
    age_to: undefined,
    investor_type: undefined,
    gender: undefined,
    classes: [],
    risk_profiles: [
      {
        profile_type: 'CONSERVATIVE',
        initial_capital: [],
        initial_replenishment: [],
      },
      {
        profile_type: 'BALANCED',
        initial_capital: [],
        initial_replenishment: [],
      },
      {
        profile_type: 'AGGRESSIVE',
        initial_capital: [],
        initial_replenishment: [],
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
      setPortfolios(portfoliosData)
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
      age_from: undefined,
      age_to: undefined,
      investor_type: undefined,
      gender: undefined,
      classes: [],
      risk_profiles: [
        {
          profile_type: 'CONSERVATIVE',
          initial_capital: [],
          initial_replenishment: [],
        },
        {
          profile_type: 'BALANCED',
          initial_capital: [],
          initial_replenishment: [],
        },
        {
          profile_type: 'AGGRESSIVE',
          initial_capital: [],
          initial_replenishment: [],
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
      risk_profiles: portfolio.risk_profiles || [
        {
          profile_type: 'CONSERVATIVE',
          initial_capital: [],
          initial_replenishment: [],
        },
        {
          profile_type: 'BALANCED',
          initial_capital: [],
          initial_replenishment: [],
        },
        {
          profile_type: 'AGGRESSIVE',
          initial_capital: [],
          initial_replenishment: [],
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

  const addInstrument = (profileType: string, bucketType: 'initial_capital' | 'initial_replenishment') => {
    const riskProfiles = formData.risk_profiles?.map((profile) =>
      profile.profile_type === profileType
        ? {
            ...profile,
            [bucketType]: [
              ...profile[bucketType],
              {
                product_id: products[0]?.id || 0,
                share_percent: 0,
                order_index: profile[bucketType].length,
              },
            ],
          }
        : profile
    ) || []
    setFormData({ ...formData, risk_profiles: riskProfiles })
  }

  const updateInstrument = (
    profileType: string,
    bucketType: 'initial_capital' | 'initial_replenishment',
    index: number,
    field: keyof PortfolioInstrument,
    value: any
  ) => {
    const riskProfiles = formData.risk_profiles?.map((profile) =>
      profile.profile_type === profileType
        ? {
            ...profile,
            [bucketType]: profile[bucketType].map((inst, i) =>
              i === index ? { ...inst, [field]: value } : inst
            ),
          }
        : profile
    ) || []
    setFormData({ ...formData, risk_profiles: riskProfiles })
  }

  const removeInstrument = (
    profileType: string,
    bucketType: 'initial_capital' | 'initial_replenishment',
    index: number
  ) => {
    const riskProfiles = formData.risk_profiles?.map((profile) =>
      profile.profile_type === profileType
        ? {
            ...profile,
            [bucketType]: profile[bucketType].filter((_, i) => i !== index),
          }
        : profile
    ) || []
    setFormData({ ...formData, risk_profiles: riskProfiles })
  }

  const getRiskProfile = (profileType: string): PortfolioRiskProfile | undefined => {
    return formData.risk_profiles?.find((p) => p.profile_type === profileType)
  }

  const calculateTotalShare = (instruments: PortfolioInstrument[]): number => {
    return instruments.reduce((sum, inst) => sum + inst.share_percent, 0)
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
                        {profile?.initial_capital && profile.initial_capital.length > 0 ? (
                          <div className="space-y-2">
                            {profile.initial_capital.map((instrument, index) => {
                              return (
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
                              )
                            })}
                            <div className="text-sm text-muted-foreground">
                              Итого: {calculateTotalShare(profile.initial_capital).toFixed(2)}%
                              {calculateTotalShare(profile.initial_capital) !== 100 && (
                                <span className="text-destructive ml-2">
                                  (должно быть 100%)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Нет инструментов</p>
                        )}
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
                        {profile?.initial_replenishment && profile.initial_replenishment.length > 0 ? (
                          <div className="space-y-2">
                            {profile.initial_replenishment.map((instrument, index) => {
                              const product = products.find(p => p.id === instrument.product_id)
                              return (
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
                              )
                            })}
                            <div className="text-sm text-muted-foreground">
                              Итого: {calculateTotalShare(profile.initial_replenishment).toFixed(2)}%
                              {calculateTotalShare(profile.initial_replenishment) !== 100 && profile.initial_replenishment.length > 0 && (
                                <span className="text-destructive ml-2">
                                  (должно быть 100%)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Нет инструментов</p>
                        )}
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

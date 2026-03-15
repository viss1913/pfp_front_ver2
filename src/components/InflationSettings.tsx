import { useEffect, useState } from 'react'
import {
  settingsAPI,
  InflationRateMatrix,
  InflationRateRange,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'

const INFLATION_YEAR_KEY = 'inflation_rate_year'
const INFLATION_MATRIX_KEY = 'inflation_rate_matrix'
const INVESTMENT_GROWTH_ANNUAL_KEY = 'investment_expense_growth_annual'
const INVESTMENT_GROWTH_MONTHLY_KEY = 'investment_expense_growth_monthly'

async function getSettingValue<T>(key: string): Promise<T | null> {
  try {
    const s = await settingsAPI.get(key)
    return (s.value as T) ?? null
  } catch {
    return null
  }
}

interface Props {
  isAdmin: boolean
}

export default function InflationSettings({ isAdmin }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  const [inflationYear, setInflationYear] = useState<string>('')
  const [matrix, setMatrix] = useState<InflationRateMatrix>({ ranges: [] })
  const [investmentGrowthAnnual, setInvestmentGrowthAnnual] = useState<string>('')
  const [investmentGrowthMonthly, setInvestmentGrowthMonthly] = useState<string>('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [yearVal, matrixVal, growthAnnualVal, growthMonthlyVal] = await Promise.all([
        getSettingValue<number>(INFLATION_YEAR_KEY),
        getSettingValue<InflationRateMatrix>(INFLATION_MATRIX_KEY),
        getSettingValue<number>(INVESTMENT_GROWTH_ANNUAL_KEY),
        getSettingValue<number>(INVESTMENT_GROWTH_MONTHLY_KEY),
      ])
      setInflationYear(yearVal != null ? String(yearVal) : '')
      setMatrix(matrixVal && Array.isArray(matrixVal.ranges) ? { ranges: matrixVal.ranges } : { ranges: [] })
      setInvestmentGrowthAnnual(growthAnnualVal != null ? String(growthAnnualVal) : '')
      setInvestmentGrowthMonthly(growthMonthlyVal != null ? String(growthMonthlyVal) : '')
    } catch (e) {
      console.error('Failed to load inflation settings', e)
      setError('Не удалось загрузить настройки')
    } finally {
      setLoading(false)
    }
  }

  const updateRange = (index: number, field: keyof InflationRateRange, value: number) => {
    const next = { ...matrix, ranges: matrix.ranges.map((r, i) => (i === index ? { ...r, [field]: value } : r)) }
    setMatrix(next)
  }

  const addRange = () => {
    const last = matrix.ranges[matrix.ranges.length - 1]
    const fromMonth = last ? last.toMonthExcl : 0
    const toMonthExcl = fromMonth + 12
    setMatrix({
      ranges: [...matrix.ranges, { fromMonth, toMonthExcl, rateAnnual: 0 }],
    })
  }

  const removeRange = (index: number) => {
    setMatrix({ ranges: matrix.ranges.filter((_, i) => i !== index) })
  }

  const handleSave = async () => {
    if (!isAdmin) return
    setSaving(true)
    setError('')
    try {
      if (inflationYear.trim() !== '') {
        const num = parseFloat(inflationYear.replace(',', '.'))
        if (!Number.isFinite(num) || num < 0) throw new Error('Годовая инфляция должна быть неотрицательным числом')
        await settingsAPI.update(INFLATION_YEAR_KEY, num)
      }

      if (matrix.ranges.length > 0) {
        const valid = matrix.ranges.every(
          (r) =>
            Number.isInteger(r.fromMonth) &&
            r.fromMonth >= 0 &&
            Number.isInteger(r.toMonthExcl) &&
            r.toMonthExcl > r.fromMonth &&
            Number.isFinite(r.rateAnnual) &&
            r.rateAnnual >= 0
        )
        if (!valid) throw new Error('Проверьте диапазоны матрицы: fromMonth < toMonthExcl, ставки ≥ 0')
        await settingsAPI.update(INFLATION_MATRIX_KEY, matrix)
      }

      if (investmentGrowthAnnual.trim() !== '') {
        const num = parseFloat(investmentGrowthAnnual.replace(',', '.'))
        if (!Number.isFinite(num)) throw new Error('Рост расходов (годовой) должен быть числом')
        await settingsAPI.update(INVESTMENT_GROWTH_ANNUAL_KEY, num)
      }

      if (investmentGrowthMonthly.trim() !== '') {
        const num = parseFloat(investmentGrowthMonthly.replace(',', '.'))
        if (!Number.isFinite(num)) throw new Error('Рост расходов (месячный) должен быть числом')
        await settingsAPI.update(INVESTMENT_GROWTH_MONTHLY_KEY, num)
      }

      await load()
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Инфляция и рост расходов на инвестиции</CardTitle>
        <p className="text-sm text-muted-foreground">
          Годовая инфляция и матрица по месяцам; приоритет у матрицы. Рост расходов — годовая или месячная ставка (%).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-2">
          <Label>Годовая инфляция по умолчанию (%)</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Напр. 7.5"
            value={inflationYear}
            onChange={(e) => setInflationYear(e.target.value)}
            disabled={!isAdmin}
          />
          <p className="text-xs text-muted-foreground">
            Используется, если не задана матрица инфляции по месяцам.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Матрица инфляции по месяцам</Label>
            {isAdmin && (
              <Button type="button" variant="outline" size="sm" onClick={addRange}>
                <Plus className="h-4 w-4 mr-1" />
                Диапазон
              </Button>
            )}
          </div>
          {matrix.ranges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет диапазонов. Добавьте диапазон месяцев и годовую ставку (%) для каждого.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">С месяца (0-based)</th>
                    <th className="text-left p-2">По месяц (не вкл.)</th>
                    <th className="text-left p-2">Годовая %</th>
                    {isAdmin && <th className="w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {matrix.ranges.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={r.fromMonth}
                          onChange={(e) => updateRange(i, 'fromMonth', parseInt(e.target.value, 10) || 0)}
                          disabled={!isAdmin}
                          className="h-8 w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          value={r.toMonthExcl}
                          onChange={(e) => updateRange(i, 'toMonthExcl', parseInt(e.target.value, 10) || 0)}
                          disabled={!isAdmin}
                          className="h-8 w-24"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={r.rateAnnual}
                          onChange={(e) => updateRange(i, 'rateAnnual', parseFloat(e.target.value.replace(',', '.')) || 0)}
                          disabled={!isAdmin}
                          className="h-8 w-20"
                        />
                      </td>
                      {isAdmin && (
                        <td className="p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeRange(i)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Рост расходов на инвестиции — годовая (%)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Напр. 5"
              value={investmentGrowthAnnual}
              onChange={(e) => setInvestmentGrowthAnnual(e.target.value)}
              disabled={!isAdmin}
            />
            <p className="text-xs text-muted-foreground">Приоритет над месячной ставкой.</p>
          </div>
          <div className="space-y-2">
            <Label>Рост расходов на инвестиции — месячная (%)</Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Напр. 0.4"
              value={investmentGrowthMonthly}
              onChange={(e) => setInvestmentGrowthMonthly(e.target.value)}
              disabled={!isAdmin}
            />
            <p className="text-xs text-muted-foreground">Используется, если годовая не задана.</p>
          </div>
        </div>

        {isAdmin && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

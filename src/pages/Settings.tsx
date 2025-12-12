import { useState, useEffect } from 'react'
import { settingsAPI, SystemSetting } from '@/lib/api'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Edit } from 'lucide-react'
import TaxBrackets from '@/components/TaxBrackets'

export default function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN'

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.list()
      setSettings(data)
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting)
    setEditValue(
      typeof setting.value === 'object'
        ? JSON.stringify(setting.value, null, 2)
        : String(setting.value)
    )
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!editingSetting) return

    try {
      let value: string | number | object = editValue

      // Попытка распарсить как JSON, если не получится - оставляем как строку
      try {
        value = JSON.parse(editValue)
      } catch {
        // Если это число, конвертируем
        if (!isNaN(Number(editValue)) && editValue.trim() !== '') {
          value = Number(editValue)
        }
      }

      await settingsAPI.update(editingSetting.key, value)
      setIsDialogOpen(false)
      loadSettings()
    } catch (error: any) {
      console.error('Failed to update setting:', error)
      alert(error.response?.data?.error || error.response?.data?.message || 'Ошибка сохранения')
    }
  }

  const formatValue = (value: string | number | object): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  if (loading) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки системы</h1>
        <p className="text-muted-foreground">
          Управление глобальными параметрами системы
        </p>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">Системные настройки</TabsTrigger>
          <TabsTrigger value="tax">Налоги 2НДФЛ</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Список настроек</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ключ</TableHead>
                    <TableHead>Значение</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.key}>
                      <TableCell className="font-medium">{setting.key}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {formatValue(setting.value)}
                      </TableCell>
                      <TableCell>{setting.description || '-'}</TableCell>
                      <TableCell>{setting.category || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(setting)}
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <TaxBrackets isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать настройку</DialogTitle>
            <DialogDescription>
              Измените значение настройки "{editingSetting?.key}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Ключ</Label>
              <Input value={editingSetting?.key || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Значение</Label>
              {typeof editingSetting?.value === 'object' ? (
                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : (
                <Input
                  type={typeof editingSetting?.value === 'number' ? 'number' : 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              )}
            </div>
            {editingSetting?.description && (
              <div className="space-y-2">
                <Label>Описание</Label>
                <p className="text-sm text-muted-foreground">{editingSetting.description}</p>
              </div>
            )}
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






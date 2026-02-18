import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Map, Plus, Loader2, Trash2, Save } from 'lucide-react'
import { useState, useEffect, ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aiB2cAPI, B2cStageContext, STAGE_KEY_OPTIONS } from '@/lib/api'

export default function B2cStageContexts() {
    const [stages, setStages] = useState<B2cStageContext[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newStage, setNewStage] = useState<Partial<B2cStageContext>>({
        stage_key: '',
        title: '',
        content: '',
        is_active: true,
        priority: 0
    })

    useEffect(() => {
        fetchStages()
    }, [])

    const fetchStages = async () => {
        try {
            setLoading(true)
            const data = await aiB2cAPI.listStages()
            setStages(data)
        } catch (error) {
            console.error('Не удалось загрузить Stage Contexts', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLocalUpdate = (id: number, updatedData: Partial<B2cStageContext>) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s))
    }

    const handleAdd = async () => {
        if (!newStage.stage_key || !newStage.title || !newStage.content) {
            alert('Заполните ключ этапа, название и контент')
            return
        }
        try {
            await aiB2cAPI.createStage(newStage)
            alert('Этап добавлен')
            await fetchStages()
            setIsAddDialogOpen(false)
            setNewStage({ stage_key: '', title: '', content: '', is_active: true, priority: 0 })
        } catch (error: any) {
            console.error('Не удалось добавить этап', error)
            if (error?.response?.status === 400) {
                alert('Ошибка: этот stage_key уже используется')
            } else {
                alert('Ошибка при добавлении')
            }
        }
    }

    const handleSave = async (stage: B2cStageContext) => {
        if (!stage.id) return
        try {
            await aiB2cAPI.updateStage(stage.id, {
                stage_key: stage.stage_key,
                title: stage.title,
                content: stage.content,
                is_active: stage.is_active,
                priority: stage.priority,
            })
            alert('Изменения сохранены')
        } catch (error) {
            console.error('Не удалось сохранить изменения', error)
            alert('Ошибка при сохранении')
        }
    }

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            await aiB2cAPI.updateStage(id, { is_active: !currentStatus })
            setStages(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s))
        } catch (error) {
            console.error('Не удалось обновить статус', error)
            alert('Ошибка обновления статуса')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить этот этап?')) return
        try {
            await aiB2cAPI.deleteStage(id)
            setStages(prev => prev.filter(s => s.id !== id))
            alert('Этап удален')
        } catch (error) {
            console.error('Не удалось удалить этап', error)
            alert('Ошибка при удалении')
        }
    }

    const getStageLabel = (key: string) => {
        const option = STAGE_KEY_OPTIONS.find(o => o.value === key)
        return option ? option.label : key
    }

    // Вычисляем, какие stage_key уже заняты
    const usedStageKeys = stages.map(s => s.stage_key)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Stage Contexts (Этапы)
                </h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Создать этап
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Новый Stage Context</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Ключ этапа (stage_key)</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={newStage.stage_key}
                                    onChange={(e) => {
                                        const key = e.target.value
                                        const option = STAGE_KEY_OPTIONS.find(o => o.value === key)
                                        setNewStage({
                                            ...newStage,
                                            stage_key: key,
                                            title: option ? option.label : newStage.title || '',
                                        })
                                    }}
                                >
                                    <option value="">Выберите этап...</option>
                                    {STAGE_KEY_OPTIONS.map(opt => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                            disabled={usedStageKeys.includes(opt.value)}
                                        >
                                            {opt.value} — {opt.label} {usedStageKeys.includes(opt.value) ? '(уже создан)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Название</Label>
                                <Input
                                    value={newStage.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewStage({ ...newStage, title: e.target.value })}
                                    placeholder="Человекочитаемое название"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Приоритет (выше = важнее)</Label>
                                <Input
                                    type="number"
                                    value={newStage.priority}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewStage({ ...newStage, priority: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Контент (инструкция для ИИ)</Label>
                                <Textarea
                                    value={newStage.content}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewStage({ ...newStage, content: e.target.value })}
                                    placeholder="Промпт-инструкция для ИИ на этом этапе..."
                                    className="min-h-[150px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Отмена</Button>
                            <Button onClick={handleAdd}>Создать</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {stages.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Этапы не найдены</p>
                    )}
                    {stages.map((stage) => (
                        <Card key={stage.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{stage.stage_key}</code>
                                            {stage.title}
                                        </CardTitle>
                                        <CardDescription>
                                            {getStageLabel(stage.stage_key)} · Приоритет: {stage.priority}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-8 w-8"
                                            onClick={() => stage.id && handleDelete(stage.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={stage.is_active}
                                            onCheckedChange={() => stage.id && handleToggleActive(stage.id, stage.is_active)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    className="font-mono text-sm min-h-[100px] bg-muted/30 focus:bg-background transition-colors"
                                    value={stage.content}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => stage.id && handleLocalUpdate(stage.id, { content: e.target.value })}
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" variant="outline" className="gap-2" onClick={() => handleSave(stage)}>
                                        <Save className="h-4 w-4" />
                                        Сохранить
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

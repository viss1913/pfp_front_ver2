import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Plus, Loader2, Trash2, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { constructorAPI, BrainContext } from '@/lib/api'

export default function BrainContexts() {
    const [contexts, setContexts] = useState<BrainContext[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchContexts()
    }, [])

    const fetchContexts = async () => {
        try {
            setLoading(true)
            const data = await constructorAPI.listBrainContexts()
            setContexts(data)
        } catch (error) {
            console.error('Не удалось загрузить контексты мозга', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLocalUpdate = (id: number, updatedData: Partial<BrainContext>) => {
        setContexts(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c))
    }

    const handleSave = async (context: BrainContext) => {
        if (!context.id) return
        try {
            await constructorAPI.updateBrainContext(context.id, context)
            alert('Изменения сохранены')
        } catch (error) {
            console.error('Не удалось сохранить изменения', error)
            alert('Ошибка при сохранении')
        }
    }

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            await constructorAPI.updateBrainContext(id, { is_active: !currentStatus })
            setContexts(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c))
            alert('Статус контекста изменен')
        } catch (error) {
            console.error('Не удалось обновить статус', error)
            alert('Ошибка обновления статуса')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить этот контекст?')) return
        try {
            await constructorAPI.deleteBrainContext(id)
            setContexts(prev => prev.filter(c => c.id !== id))
            alert('Контекст удален')
        } catch (error) {
            console.error('Не удалось удалить контекст', error)
            alert('Ошибка при удалении')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Глобальный контекст ("Мозг")
                </h2>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить контекст
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {contexts.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Контексты не найдены</p>
                    )}
                    {contexts.map((context) => (
                        <Card key={context.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{context.title}</CardTitle>
                                        <CardDescription>Приоритет: {context.priority}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive h-8 w-8"
                                            onClick={() => context.id && handleDelete(context.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={context.is_active}
                                            onCheckedChange={() => context.id && handleToggleActive(context.id, context.is_active)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    className="font-mono text-sm min-h-[100px] bg-muted/30 focus:bg-background transition-colors"
                                    value={context.content}
                                    onChange={(e) => context.id && handleLocalUpdate(context.id, { content: e.target.value })}
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" variant="outline" className="gap-2" onClick={() => handleSave(context)}>
                                        <Save className="h-4 w-4" />
                                        Сохранить текст
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

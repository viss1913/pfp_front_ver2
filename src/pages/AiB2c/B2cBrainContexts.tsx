import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Plus, Loader2, Trash2, Save } from 'lucide-react'
import { useState, useEffect, ChangeEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aiB2cAPI, B2cBrainContext } from '@/lib/api'

export default function B2cBrainContexts() {
    const [contexts, setContexts] = useState<B2cBrainContext[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newContext, setNewContext] = useState<Partial<B2cBrainContext>>({
        title: '',
        content: '',
        is_active: true,
        priority: 0
    })

    useEffect(() => {
        fetchContexts()
    }, [])

    const fetchContexts = async () => {
        try {
            setLoading(true)
            const data = await aiB2cAPI.listBrainContexts()
            setContexts(data)
        } catch (error) {
            console.error('Не удалось загрузить Brain Contexts', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLocalUpdate = (id: number, updatedData: Partial<B2cBrainContext>) => {
        setContexts(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c))
    }

    const handleAdd = async () => {
        if (!newContext.title || !newContext.content) {
            alert('Заполните заголовок и контент')
            return
        }
        try {
            await aiB2cAPI.createBrainContext(newContext)
            alert('Контекст добавлен')
            await fetchContexts()
            setIsAddDialogOpen(false)
            setNewContext({ title: '', content: '', is_active: true, priority: 0 })
        } catch (error) {
            console.error('Не удалось добавить контекст', error)
            alert('Ошибка при добавлении')
        }
    }

    const handleSave = async (context: B2cBrainContext) => {
        if (!context.id) return
        try {
            await aiB2cAPI.updateBrainContext(context.id, {
                title: context.title,
                content: context.content,
                is_active: context.is_active,
                priority: context.priority,
            })
            alert('Изменения сохранены')
        } catch (error) {
            console.error('Не удалось сохранить изменения', error)
            alert('Ошибка при сохранении')
        }
    }

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            await aiB2cAPI.updateBrainContext(id, { is_active: !currentStatus })
            setContexts(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c))
        } catch (error) {
            console.error('Не удалось обновить статус', error)
            alert('Ошибка обновления статуса')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить этот контекст?')) return
        try {
            await aiB2cAPI.deleteBrainContext(id)
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
                    Brain Contexts (Главный Мозг)
                </h2>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Создать контекст
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Новый Brain Context</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Название</Label>
                                <Input
                                    value={newContext.title}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewContext({ ...newContext, title: e.target.value })}
                                    placeholder="Например: Роль и поведение"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Приоритет (выше = важнее)</Label>
                                <Input
                                    type="number"
                                    value={newContext.priority}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewContext({ ...newContext, priority: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Контент</Label>
                                <Textarea
                                    value={newContext.content}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewContext({ ...newContext, content: e.target.value })}
                                    placeholder="Инструкции для ИИ..."
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
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => context.id && handleLocalUpdate(context.id, { content: e.target.value })}
                                />
                                <div className="flex justify-end">
                                    <Button size="sm" variant="outline" className="gap-2" onClick={() => handleSave(context)}>
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

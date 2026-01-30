import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Plus, Trash2, Edit2, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'

export default function CJMTemplates() {
    const [templates, setTemplates] = useState([
        {
            id: 1,
            command: '/start',
            section: 'ДИАГНОСТИКА',
            classifier: 'Ты — ИИ-адаптолог. Если пользователь поздоровался или выразил желание начать — напиши команду /start',
            response: "Не здоровайся. Спроси как зовут будущего финансового консультанта. Твоя цель — получить ответ 'да' на вопрос о готовности начать путь."
        },
        {
            id: 2,
            command: '/meeting',
            section: 'ДИАГНОСТИКА',
            classifier: 'Если пользователь хочет назначить встречу или созвон — напиши команду /meeting',
            response: 'Узнай удобное время для звонка. Предложи два слота на завтра.'
        }
    ])

    const [activeTabId, setActiveTabId] = useState(1)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newStage, setNewStage] = useState({ command: '', section: 'ДИАГНОСТИКА', classifier: '', response: '' })

    const activeTemplate = templates.find(t => t.id === activeTabId) || templates[0]

    const handleSave = (updatedData: any) => {
        setTemplates(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updatedData } : t))
    }

    const handleAddStage = () => {
        const nextId = Math.max(...templates.map(t => t.id)) + 1
        setTemplates([...templates, { ...newStage, id: nextId }])
        setActiveTabId(nextId)
        setIsAddDialogOpen(false)
        setNewStage({ command: '', section: 'ДИАГНОСТИКА', classifier: '', response: '' })
    }

    const handleDelete = (id: number) => {
        const filtered = templates.filter(t => t.id !== id)
        setTemplates(filtered)
        if (activeTabId === id && filtered.length > 0) {
            setActiveTabId(filtered[0].id)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Шаблоны CJM (Диагностика)
                </h2>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить стадию
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Новая стадия диалога</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Команда (например, /auto)</Label>
                                <Input
                                    value={newStage.command}
                                    onChange={e => setNewStage({ ...newStage, command: e.target.value })}
                                    placeholder="/command"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Секция</Label>
                                <Select
                                    value={newStage.section}
                                    onValueChange={v => setNewStage({ ...newStage, section: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ДИАГНОСТИКА">ДИАГНОСТИКА</SelectItem>
                                        <SelectItem value="ПРОДАЖИ">ПРОДАЖИ</SelectItem>
                                        <SelectItem value="ПОДДЕРЖКА">ПОДДЕРЖКА</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Отмена</Button>
                            <Button onClick={handleAddStage}>Создать</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {templates.map(t => (
                    <Badge
                        key={t.id}
                        variant={activeTabId === t.id ? "default" : "secondary"}
                        className="px-3 py-1 cursor-pointer transition-all hover:opacity-80"
                        onClick={() => setActiveTabId(t.id)}
                    >
                        {t.command}
                    </Badge>
                ))}
            </div>

            {activeTemplate && (
                <Card key={activeTemplate.id} className="shadow-lg border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 pb-4">
                        <div className="flex-1">
                            <Input
                                value={activeTemplate.command}
                                onChange={(e) => handleSave({ command: e.target.value })}
                                className="text-lg font-bold bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
                                placeholder="Название команды (например, /start)"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-primary" onClick={() => { }}>
                                <Save className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(activeTemplate.id)} className="text-destructive">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Секция *</Label>
                            <Select
                                value={activeTemplate.section}
                                onValueChange={(v) => handleSave({ section: v })}
                            >
                                <SelectTrigger className="bg-muted/20">
                                    <SelectValue placeholder="Выберите секцию..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ДИАГНОСТИКА">ДИАГНОСТИКА</SelectItem>
                                    <SelectItem value="ПРОДАЖИ">ПРОДАЖИ</SelectItem>
                                    <SelectItem value="ПОДДЕРЖКА">ПОДДЕРЖКА</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Классификатор *</Label>
                            <Textarea
                                className="font-mono text-sm min-h-[120px] bg-muted/10 focus:bg-background transition-colors"
                                placeholder="Контекст для определения намерения пользователя..."
                                value={activeTemplate.classifier}
                                onChange={(e) => handleSave({ classifier: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Ответ *</Label>
                            <Textarea
                                className="font-mono text-sm min-h-[180px] bg-muted/10 focus:bg-background transition-colors"
                                placeholder="Контекст для генерации ответа..."
                                value={activeTemplate.response}
                                onChange={(e) => handleSave({ response: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end pt-2 border-t mt-6">
                            <Button className="gap-2 px-8">
                                <Save className="h-4 w-4" />
                                Сохранить стадию
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

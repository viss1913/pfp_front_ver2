import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { AiAssistant, AiAssistantCreate, aiAssistantsAPI } from '@/lib/api'

interface AiAssistantDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assistant: AiAssistant | null
    onSuccess: () => void
}

const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free'

export function AiAssistantDialog({
    open,
    onOpenChange,
    assistant,
    onSuccess,
}: AiAssistantDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<AiAssistantCreate>({
        name: '',
        slug: '',
        model: DEFAULT_MODEL,
        context_template: '',
        is_active: true,
    })

    useEffect(() => {
        if (open) {
            if (assistant) {
                setFormData({
                    name: assistant.name,
                    slug: assistant.slug,
                    model: assistant.model,
                    context_template: assistant.context_template,
                    is_active: assistant.is_active
                })
            } else {
                setFormData({
                    name: '',
                    slug: '',
                    model: DEFAULT_MODEL,
                    context_template: '',
                    is_active: true,
                })
            }
            setError(null)
        }
    }, [open, assistant])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (assistant) {
                await aiAssistantsAPI.update(assistant.id, formData)
            } else {
                await aiAssistantsAPI.create(formData)
            }
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error(err)
            setError(
                err.response?.data?.message || err.message || 'Ошибка при сохранении'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {assistant ? 'Редактировать ассистента' : 'Создать ассистента'}
                    </DialogTitle>
                    <DialogDescription>
                        Заполните параметры AI ассистента. Slug должен быть уникальным.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Название</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="Помощник по продуктам"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (код)</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) =>
                                    setFormData({ ...formData, slug: e.target.value })
                                }
                                placeholder="product-helper"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="model">Модель</Label>
                        <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) =>
                                setFormData({ ...formData, model: e.target.value })
                            }
                            placeholder="google/gemini-2.0-flash-exp:free"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            ID модели (например, google/gemini-2.0-flash-exp:free)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="context">Системный контекст</Label>
                        <textarea
                            id="context"
                            className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.context_template}
                            onChange={(e) =>
                                setFormData({ ...formData, context_template: e.target.value })
                            }
                            placeholder="Ты опытный наставник..."
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Используйте <code>{'{{agent_name}}'}</code> для подстановки имени
                            агента.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.is_active}
                            onChange={(e) =>
                                setFormData({ ...formData, is_active: e.target.checked })
                            }
                        />
                        <Label htmlFor="is_active">Активен</Label>
                    </div>

                    {error && <div className="text-sm text-red-500">{error}</div>}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

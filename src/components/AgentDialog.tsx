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
import { Agent, AgentCreate, AgentUpdate, agentsAPI } from '@/lib/api'
import { Switch } from '@/components/ui/switch'

interface AgentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    agent: Agent | null
    onSuccess: () => void
}

export function AgentDialog({
    open,
    onOpenChange,
    agent,
    onSuccess,
}: AgentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<any>({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        password: '',
        phone: '',
        telegram_bot: '',
        telegram_channel: '',
        is_active: true,
        region: '',
        city: '',
        position_title: '',
        specialization: '',
        experience_years: 0,
    })

    useEffect(() => {
        if (open) {
            if (agent) {
                setFormData({
                    first_name: agent.first_name || '',
                    last_name: agent.last_name || '',
                    middle_name: agent.middle_name || '',
                    email: agent.email || '',
                    password: '', // Password might be required by backend even for patch?
                    phone: agent.phone || '',
                    telegram_bot: agent.telegram_bot || '',
                    telegram_channel: agent.telegram_channel || '',
                    is_active: agent.is_active,
                    region: agent.region || '',
                    city: agent.city || '',
                    position_title: agent.position_title || '',
                    specialization: agent.specialization || '',
                    experience_years: agent.experience_years || 0,
                })
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    middle_name: '',
                    email: '',
                    password: '',
                    phone: '',
                    telegram_bot: '',
                    telegram_channel: '',
                    is_active: true,
                    region: '',
                    city: '',
                    position_title: '',
                    specialization: '',
                    experience_years: 0,
                })
            }
            setError(null)
        }
    }, [open, agent])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const dataToSubmit = { ...formData }
            if (agent) {
                // If editing and password is empty, maybe we shouldn't send it?
                // But the user said "при редактировании обязательно нужно передавать email и password"
                await agentsAPI.update(agent.id, dataToSubmit)
            } else {
                await agentsAPI.create(dataToSubmit as AgentCreate)
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

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {agent ? 'Редактировать агента' : 'Создать агента'}
                    </DialogTitle>
                    <DialogDescription>
                        Заполните данные агента. Все поля профиля будут доступны в личном кабинете агента.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">Основные данные</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Фамилия</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => handleChange('last_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="first_name">Имя</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => handleChange('first_name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="middle_name">Отчество</Label>
                                <Input
                                    id="middle_name"
                                    value={formData.middle_name}
                                    onChange={(e) => handleChange('middle_name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Логин)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Пароль</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder={agent ? "Введите новый для смены" : "Введите пароль"}
                                    required={!agent}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Активен (может входить в систему)</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">География и специализация</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="region">Регион</Label>
                                <Input
                                    id="region"
                                    value={formData.region}
                                    onChange={(e) => handleChange('region', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Город</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="position_title">Должность</Label>
                                <Input
                                    id="position_title"
                                    value={formData.position_title}
                                    onChange={(e) => handleChange('position_title', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="specialization">Специализация</Label>
                                <Input
                                    id="specialization"
                                    value={formData.specialization}
                                    onChange={(e) => handleChange('specialization', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 col-span-1">
                                <Label htmlFor="experience_years">Стаж (лет)</Label>
                                <Input
                                    id="experience_years"
                                    type="number"
                                    value={formData.experience_years}
                                    onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">Telegram Интеграция</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telegram_bot">Telegram Бот (@bot_username)</Label>
                                <Input
                                    id="telegram_bot"
                                    value={formData.telegram_bot}
                                    onChange={(e) => handleChange('telegram_bot', e.target.value)}
                                    placeholder="@my_pfp_bot"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telegram_channel">Telegram Канал (ID или @channel)</Label>
                                <Input
                                    id="telegram_channel"
                                    value={formData.telegram_channel}
                                    onChange={(e) => handleChange('telegram_channel', e.target.value)}
                                    placeholder="@my_pfp_channel"
                                />
                            </div>
                        </div>
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

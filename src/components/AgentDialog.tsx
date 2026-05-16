import React, { useEffect, useState } from 'react'
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
import {
    Agent,
    AgentCreate,
    AgentGender,
    AgentUpdate,
    agentsAPI,
    authAPI,
} from '@/lib/api'
import { usePartnerAgentConfig } from '@/hooks/usePartnerAgentConfig'
import {
    formatAgentSaveError,
    isPartnerRefUrl,
    validatePartnerAgentId,
} from '@/lib/partnerAgent'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const SIGNATURE_MAX_BYTES = 8 * 1024 * 1024
const GENDER_NONE = '__none__'

function buildAgentPayload(formData: Record<string, unknown>, isEdit: boolean): AgentCreate | AgentUpdate {
    const keys = [
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'email_corp',
        'password',
        'phone',
        'telegram_bot',
        'telegram_channel',
        'telegram_channel_id',
        'is_active',
        'region',
        'city',
        'position_title',
        'specialization',
        'experience_years',
        'passport_series',
        'passport_number',
        'birth_date',
        'gender',
        'signature_image_url',
        'partner_agent_id',
    ] as const

    const out: Record<string, unknown> = {}
    for (const k of keys) {
        const v = formData[k]
        if (v === undefined) continue
        if (k === 'partner_agent_id') continue
        if (typeof v === 'string' && v.trim() === '' && k !== 'password') {
            continue
        }
        if (k === 'gender' && (v === '' || v === GENDER_NONE)) {
            continue
        }
        out[k] = v
    }

    const partnerRaw = String(formData.partner_agent_id ?? '').trim()
    if (isEdit) {
        out.partner_agent_id = partnerRaw === '' ? null : partnerRaw
    } else if (partnerRaw) {
        if (isPartnerRefUrl(partnerRaw)) {
            out.partner_ref_url = partnerRaw
        } else {
            out.partner_agent_id = partnerRaw
        }
    }

    if (isEdit && (!out.password || String(out.password).trim() === '')) {
        delete out.password
    }

    return out as AgentCreate | AgentUpdate
}

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
    const partnerConfig = usePartnerAgentConfig()
    const [loading, setLoading] = useState(false)
    const [signatureUploading, setSignatureUploading] = useState(false)
    const [parsingRef, setParsingRef] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [partnerRefUrl, setPartnerRefUrl] = useState('')
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        email_corp: '',
        password: '',
        phone: '',
        telegram_bot: '',
        telegram_channel: '',
        telegram_channel_id: '',
        is_active: true,
        region: '',
        city: '',
        position_title: '',
        specialization: '',
        experience_years: 0,
        passport_series: '',
        passport_number: '',
        birth_date: '',
        gender: '' as '' | AgentGender,
        signature_image_url: '',
        partner_agent_id: '',
    })

    useEffect(() => {
        if (open) {
            if (agent) {
                setFormData({
                    first_name: agent.first_name || '',
                    last_name: agent.last_name || '',
                    middle_name: agent.middle_name || '',
                    email: agent.email || '',
                    email_corp: agent.email_corp || '',
                    password: '',
                    phone: agent.phone || '',
                    telegram_bot: agent.telegram_bot || '',
                    telegram_channel: agent.telegram_channel || '',
                    telegram_channel_id: agent.telegram_channel_id || '',
                    is_active: agent.is_active,
                    region: agent.region || '',
                    city: agent.city || '',
                    position_title: agent.position_title || '',
                    specialization: agent.specialization || '',
                    experience_years: agent.experience_years || 0,
                    passport_series: agent.passport_series || '',
                    passport_number: agent.passport_number || '',
                    birth_date: agent.birth_date || '',
                    gender: (agent.gender as AgentGender | undefined) || '',
                    signature_image_url: agent.signature_image_url || '',
                    partner_agent_id: agent.partner_agent_id || '',
                })
            } else {
                setFormData({
                    first_name: '',
                    last_name: '',
                    middle_name: '',
                    email: '',
                    email_corp: '',
                    password: '',
                    phone: '',
                    telegram_bot: '',
                    telegram_channel: '',
                    telegram_channel_id: '',
                    is_active: true,
                    region: '',
                    city: '',
                    position_title: '',
                    specialization: '',
                    experience_years: 0,
                    passport_series: '',
                    passport_number: '',
                    birth_date: '',
                    gender: '',
                    signature_image_url: '',
                    partner_agent_id: '',
                })
            }
            setPartnerRefUrl('')
            setError(null)
        }
    }, [open, agent])

    const parsePartnerRefToId = async (ref: string): Promise<string> => {
        const projectKey = localStorage.getItem('project_key')
        if (!projectKey) {
            throw new Error('Не выбран проект — нельзя распознать ссылку')
        }
        const res = await authAPI.parsePartnerAgent({
            project_key: projectKey,
            partner_ref_url: ref,
        })
        return res.partner_agent_id
    }

    const handleParsePartnerRef = async () => {
        const ref = partnerRefUrl.trim()
        if (!ref) {
            setError('Вставьте ссылку партнёра')
            return
        }

        setParsingRef(true)
        setError(null)
        try {
            const partnerAgentId = await parsePartnerRefToId(ref)
            setFormData((prev) => ({
                ...prev,
                partner_agent_id: partnerAgentId,
            }))
            setPartnerRefUrl('')
        } catch (err: unknown) {
            console.error(err)
            setError(formatAgentSaveError(err))
        } finally {
            setParsingRef(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const partnerValue = formData.partner_agent_id.trim()
        if (partnerConfig.requiredOnCreate && !agent && !partnerValue) {
            setError(`Требуется ${partnerConfig.label}`)
            setLoading(false)
            return
        }
        let partnerAgentId = partnerValue
        if (partnerValue && isPartnerRefUrl(partnerValue)) {
            try {
                partnerAgentId = await parsePartnerRefToId(partnerValue)
            } catch (err: unknown) {
                console.error(err)
                setError(formatAgentSaveError(err))
                setLoading(false)
                return
            }
        }

        if (partnerAgentId) {
            const validationError = validatePartnerAgentId(partnerAgentId)
            if (validationError) {
                setError(validationError)
                setLoading(false)
                return
            }
        }

        const payloadFormData = {
            ...formData,
            partner_agent_id: partnerAgentId,
        }

        try {
            if (agent) {
                await agentsAPI.update(
                    agent.id,
                    buildAgentPayload(payloadFormData as unknown as Record<string, unknown>, true) as AgentUpdate
                )
            } else {
                await agentsAPI.create(
                    buildAgentPayload(payloadFormData as unknown as Record<string, unknown>, false) as AgentCreate
                )
            }
            onSuccess()
            onOpenChange(false)
        } catch (err: unknown) {
            console.error(err)
            setError(formatAgentSaveError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSignatureFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !agent) return

        const okType =
            file.type === 'image/jpeg' ||
            file.type === 'image/png' ||
            file.type === 'image/webp'
        if (!okType) {
            setError('Подпись: только JPEG, PNG или WebP')
            return
        }
        if (file.size > SIGNATURE_MAX_BYTES) {
            setError('Файл подписи не больше 8 МБ')
            return
        }

        setSignatureUploading(true)
        setError(null)
        try {
            const res = await agentsAPI.uploadSignature(agent.id, file)
            const url = res.signature_image_url || res.url
            setFormData((prev) => ({
                ...prev,
                signature_image_url: url,
            }))
            onSuccess()
        } catch (err: unknown) {
            console.error(err)
            const ax = err as { response?: { data?: { message?: string } }; message?: string }
            setError(ax.response?.data?.message || ax.message || 'Не удалось загрузить подпись')
        } finally {
            setSignatureUploading(false)
        }
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

                        <div className="space-y-2">
                            <Label htmlFor="email_corp">
                                Корпоративный ящик (только имя до @), для исходящей почты с домена банка
                            </Label>
                            <Input
                                id="email_corp"
                                type="text"
                                autoComplete="off"
                                value={formData.email_corp}
                                onChange={(e) => handleChange('email_corp', e.target.value)}
                                placeholder="например vissarov или полный адрес"
                            />
                            <p className="text-xs text-muted-foreground">
                                Необязательно. Если ввести адрес целиком, сервер возьмёт только часть до @.
                            </p>
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
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.is_active}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('is_active', e.target.checked)}
                                />
                                <Label htmlFor="is_active">Активен (может входить в систему)</Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">Партнёр</h3>
                        <div className="space-y-2">
                            <Label htmlFor="partner_agent_id">
                                {partnerConfig.label}
                                {partnerConfig.requiredOnCreate && !agent ? (
                                    <span className="text-destructive"> *</span>
                                ) : null}
                            </Label>
                            <Input
                                id="partner_agent_id"
                                value={formData.partner_agent_id}
                                onChange={(e) => handleChange('partner_agent_id', e.target.value)}
                                placeholder="Например FIN12345"
                                autoComplete="off"
                                required={partnerConfig.requiredOnCreate && !agent}
                            />
                            <p className="text-xs text-muted-foreground">
                                Латиница, цифры, _ и -, 1–64 символа. Пустое поле при сохранении сбрасывает значение.
                                Можно вставить ссылку в поле выше — распознаем при сохранении.
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="partner_ref_url" className="text-xs text-muted-foreground">
                                            Или ссылка партнёра
                                        </Label>
                                        <Input
                                            id="partner_ref_url"
                                            value={partnerRefUrl}
                                            onChange={(e) => setPartnerRefUrl(e.target.value)}
                                            placeholder="https://…?agent_id=123"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        disabled={parsingRef || loading || !partnerRefUrl.trim()}
                                        onClick={handleParsePartnerRef}
                                    >
                                        {parsingRef ? 'Распознаём…' : 'Распознать из ссылки'}
                                    </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">Паспорт и подпись</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="passport_series">Серия паспорта</Label>
                                <Input
                                    id="passport_series"
                                    value={formData.passport_series}
                                    onChange={(e) => handleChange('passport_series', e.target.value)}
                                    placeholder="Необязательно"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="passport_number">Номер паспорта</Label>
                                <Input
                                    id="passport_number"
                                    value={formData.passport_number}
                                    onChange={(e) => handleChange('passport_number', e.target.value)}
                                    placeholder="Необязательно"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Дата рождения</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => handleChange('birth_date', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Пол</Label>
                                <Select
                                    value={formData.gender || GENDER_NONE}
                                    onValueChange={(v) =>
                                        handleChange('gender', v === GENDER_NONE ? '' : (v as AgentGender))
                                    }
                                >
                                    <SelectTrigger id="gender">
                                        <SelectValue placeholder="Не указано" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={GENDER_NONE}>Не указано</SelectItem>
                                        <SelectItem value="male">Мужской</SelectItem>
                                        <SelectItem value="female">Женский</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="signature_image_url">URL изображения подписи</Label>
                            <Input
                                id="signature_image_url"
                                type="url"
                                value={formData.signature_image_url}
                                onChange={(e) => handleChange('signature_image_url', e.target.value)}
                                placeholder="https://… или загрузите файл ниже (после сохранения агента)"
                            />
                            {formData.signature_image_url ? (
                                <div className="mt-2 rounded-md border p-2 inline-block max-w-full">
                                    <img
                                        src={formData.signature_image_url}
                                        alt="Подпись"
                                        className="max-h-24 max-w-full object-contain"
                                    />
                                </div>
                            ) : null}
                        </div>
                        {agent ? (
                            <div className="space-y-2">
                                <Label htmlFor="signature_file">Загрузить файл подписи</Label>
                                <Input
                                    id="signature_file"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    disabled={signatureUploading || loading}
                                    onChange={handleSignatureFile}
                                />
                                <p className="text-xs text-muted-foreground">
                                    JPEG, PNG или WebP, до 8 МБ. Сохраняется на сервере, в профиль пишется только
                                    ссылка.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Чтобы загрузить файл подписи, сначала создайте агента — нужен ID для загрузки.
                            </p>
                        )}
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
                        <div className="space-y-2">
                            <Label htmlFor="telegram_channel_id">Telegram Channel ID</Label>
                            <Input
                                id="telegram_channel_id"
                                value={formData.telegram_channel_id}
                                onChange={(e) => handleChange('telegram_channel_id', e.target.value)}
                                placeholder="-1001234567890"
                            />
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

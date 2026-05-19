import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Users, Search, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Agent, agentsAPI } from '@/lib/api'
import { AgentDialog } from '@/components/AgentDialog'
import { Input } from '@/components/ui/input'
import { usePartnerAgentConfig } from '@/hooks/usePartnerAgentConfig'

type AgentsListTab = 'active' | 'inactive'

export default function Agents() {
    const partnerConfig = usePartnerAgentConfig()
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [listTab, setListTab] = useState<AgentsListTab>('active')

    const loadAgents = useCallback(async () => {
        try {
            setIsLoading(true)
            const data = await agentsAPI.list({ is_active: listTab === 'active' })
            setAgents(data)
        } catch (error) {
            console.error('Failed to load agents:', error)
        } finally {
            setIsLoading(false)
        }
    }, [listTab])

    useEffect(() => {
        loadAgents()
    }, [loadAgents])

    const handleCreate = () => {
        setSelectedAgent(null)
        setDialogOpen(true)
    }

    const handleEdit = (agent: Agent) => {
        setSelectedAgent(agent)
        setDialogOpen(true)
    }

    const handleDelete = async (agent: Agent) => {
        const name = [agent.last_name, agent.first_name].filter(Boolean).join(' ')
        if (
            !window.confirm(
                `Деактивировать агента${name ? ` «${name}»` : ''}?\n\n` +
                    'Вход в систему будет заблокирован. Клиенты и субагенты не затрагиваются.'
            )
        ) {
            return
        }

        try {
            await agentsAPI.delete(agent.id)
            loadAgents()
        } catch (error: unknown) {
            console.error('Failed to delete agent:', error)
            const err = error as { response?: { status?: number } }
            if (err.response?.status === 403) {
                alert('Недостаточно прав для удаления агента')
            } else if (err.response?.status === 404) {
                alert('Агент не найден')
            } else {
                alert('Ошибка при деактивации агента')
            }
        }
    }

    const handleRestore = async (agent: Agent) => {
        const name = [agent.last_name, agent.first_name].filter(Boolean).join(' ')
        if (
            !window.confirm(
                `Восстановить агента${name ? ` «${name}»` : ''}? Снова сможет входить в систему.`
            )
        ) {
            return
        }

        try {
            await agentsAPI.update(agent.id, { is_active: true })
            loadAgents()
        } catch (error) {
            console.error('Failed to restore agent:', error)
            alert('Ошибка при восстановлении агента')
        }
    }

    const filteredAgents = agents.filter(agent => {
        const fullSearch = `${agent.first_name} ${agent.last_name} ${agent.email} ${agent.city} ${agent.phone} ${agent.partner_agent_id || ''}`.toLowerCase()
        return fullSearch.includes(searchQuery.toLowerCase())
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Агенты</h1>
                </div>
                {listTab === 'active' && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить агента
                    </Button>
                )}
            </div>

            <Tabs
                value={listTab}
                onValueChange={(value) => setListTab(value as AgentsListTab)}
            >
                <TabsList>
                    <TabsTrigger value="active">Активные</TabsTrigger>
                    <TabsTrigger value="inactive">Деактивированные</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск агента..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">ID</TableHead>
                            <TableHead>ФИО</TableHead>
                            <TableHead>Email / Телефон</TableHead>
                            <TableHead>{partnerConfig.label}</TableHead>
                            <TableHead>Город / Регион</TableHead>
                            <TableHead>Telegram</TableHead>
                            <TableHead className="w-[100px]">Статус</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : filteredAgents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    {searchQuery
                                        ? 'Ничего не найдено'
                                        : listTab === 'active'
                                          ? 'Нет активных агентов'
                                          : 'Нет деактивированных агентов'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAgents.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell>{agent.id}</TableCell>
                                    <TableCell className="font-medium">
                                        {agent.last_name} {agent.first_name} {agent.middle_name}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{agent.email}</div>
                                        <div className="text-xs text-muted-foreground">{agent.phone}</div>
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">
                                        {agent.partner_agent_id || (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {agent.city}{agent.region ? `, ${agent.region}` : ''}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {agent.telegram_bot && (
                                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                    🤖 {agent.telegram_bot}
                                                </span>
                                            )}
                                            {agent.telegram_channel && (
                                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                    📢 {agent.telegram_channel}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {agent.is_active ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                Активен
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                Отключен
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(agent)}
                                                title="Редактировать"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {listTab === 'active' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(agent)}
                                                    title="Деактивировать"
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRestore(agent)}
                                                    title="Восстановить"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AgentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                agent={selectedAgent}
                onSuccess={loadAgents}
            />
        </div>
    )
}

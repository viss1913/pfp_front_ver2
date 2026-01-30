import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, History, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { constructorAPI, BotInfo } from '@/lib/api'

export default function BotSessions() {
    const [bots, setBots] = useState<BotInfo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBots()
    }, [])

    const fetchBots = async () => {
        try {
            setLoading(true)
            const data = await constructorAPI.listBots()
            setBots(data)
        } catch (error) {
            console.error('Не удалось загрузить список ботов', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Активные сессии и боты
                </h2>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Название бота</TableHead>
                            <TableHead>Агент (Владелец)</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата создания</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Загрузка ботов...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : bots.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Боты не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            bots.map((bot) => (
                                <TableRow key={bot.id}>
                                    <TableCell className="font-medium">{bot.name}</TableCell>
                                    <TableCell>{bot.agent_email || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={bot.status === 'active' ? "default" : "secondary"}>
                                            {bot.status === 'active' ? 'Активен' : bot.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(bot.created_at).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">
                                            <History className="mr-2 h-4 w-4" />
                                            Логи
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}

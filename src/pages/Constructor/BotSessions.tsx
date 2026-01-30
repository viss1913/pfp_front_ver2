import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, History } from 'lucide-react'

export default function BotSessions() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Активные сессии и боты
                </h2>
            </div>

            <Card>
                <TableHeader>
                    <TableRow>
                        <TableHead>Название бота</TableHead>
                        <TableHead>Агент (Владелец)</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Последняя активность</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">PFP Helper Bot</TableCell>
                        <TableCell>agent@pfp.ru</TableCell>
                        <TableCell>
                            <Badge variant="default">Активен</Badge>
                        </TableCell>
                        <TableCell>Сегодня, 12:45</TableCell>
                        <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                                <History className="mr-2 h-4 w-4" />
                                Логи
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Card>
        </div>
    )
}

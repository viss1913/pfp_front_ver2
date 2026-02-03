import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import { pfpAPI, PfpCalculation } from '@/lib/api'
import { Search, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Clients() {
    const [calculations, setCalculations] = useState<PfpCalculation[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 20

    const fetchCalculations = async () => {
        try {
            setLoading(true)
            const response = await pfpAPI.listCalculations({
                page,
                limit,
                search,
            })
            setCalculations(response.data)
            setTotalPages(response.pagination.totalPages)
        } catch (error) {
            console.error('Error fetching calculations:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCalculations()
        }, 500)
        return () => clearTimeout(timer)
    }, [page, search])

    const getStatusBadge = (status: PfpCalculation['status']) => {
        const statusMap = {
            THINKING: { label: 'Думает', color: 'bg-blue-100 text-blue-800 border-blue-200' },
            BOUGHT: { label: 'Купил', color: 'bg-green-100 text-green-800 border-green-200' },
            REFUSED: { label: 'Отказ', color: 'bg-red-100 text-red-800 border-red-200' },
        }
        const { label, color } = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
        return <Badge variant="outline" className={color}>{label}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Клиенты</h1>
                    <p className="text-muted-foreground">Мониторинг всех расчетов ПФП</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по ФИО или Email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Клиент</TableHead>
                            <TableHead>Агент</TableHead>
                            <TableHead>Email агента</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="text-center">Расчет</TableHead>
                            <TableHead>Дата создания</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : calculations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Расчеты не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            calculations.map((calc) => (
                                <TableRow
                                    key={calc.pfp_id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => window.open(`/clients/${calc.pfp_id}`, '_blank')}
                                >
                                    <TableCell className="font-medium">#{calc.pfp_id}</TableCell>
                                    <TableCell>{calc.client_fio}</TableCell>
                                    <TableCell>{calc.agent_fio || <span className="text-muted-foreground italic">Не привязан</span>}</TableCell>
                                    <TableCell>{calc.agent_email}</TableCell>
                                    <TableCell>{getStatusBadge(calc.status)}</TableCell>
                                    <TableCell className="text-center">
                                        {calc.has_calculation ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" title="Расчет готов" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-300 mx-auto" title="Нет расчета" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(calc.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (page > 1) setPage(page - 1)
                                }}
                                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <PaginationItem key={p}>
                                <PaginationLink
                                    href="#"
                                    isActive={p === page}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setPage(p)
                                    }}
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (page < totalPages) setPage(page + 1)
                                }}
                                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { AiAssistant, aiAssistantsAPI } from '@/lib/api'
import { AiAssistantDialog } from '@/components/AiAssistantDialog'

export default function AiAssistants() {
    const [assistants, setAssistants] = useState<AiAssistant[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedAssistant, setSelectedAssistant] = useState<AiAssistant | null>(
        null
    )

    const loadAssistants = async () => {
        try {
            setIsLoading(true)
            const data = await aiAssistantsAPI.list()
            setAssistants(data)
        } catch (error) {
            console.error('Failed to load assistants:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadAssistants()
    }, [])

    const handleCreate = () => {
        setSelectedAssistant(null)
        setDialogOpen(true)
    }

    const handleEdit = (assistant: AiAssistant) => {
        setSelectedAssistant(assistant)
        setDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (
            !window.confirm(
                'Вы уверены? Это действие нельзя отменить. История переписки с этим ассистентом может быть потеряна для агентов.'
            )
        ) {
            return
        }

        try {
            await aiAssistantsAPI.delete(id)
            loadAssistants()
        } catch (error) {
            console.error('Failed to delete assistant:', error)
            alert('Ошибка при удалении')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">AI Ассистенты</h1>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать ассистента
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">ID</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Модель</TableHead>
                            <TableHead className="w-[100px]">Статус</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : assistants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Нет добавленных ассистентов
                                </TableCell>
                            </TableRow>
                        ) : (
                            assistants.map((assistant) => (
                                <TableRow key={assistant.id}>
                                    <TableCell>{assistant.id}</TableCell>
                                    <TableCell className="font-medium">{assistant.name}</TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {assistant.slug}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {assistant.model}
                                    </TableCell>
                                    <TableCell>
                                        {assistant.is_active ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                Активен
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                Неактивен
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(assistant)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(assistant.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AiAssistantDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                assistant={selectedAssistant}
                onSuccess={loadAssistants}
            />
        </div>
    )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Brain, Plus } from 'lucide-react'

export default function BrainContexts() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Глобальный контекст ("Мозг")
                </h2>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить контекст
                </Button>
            </div>

            <div className="grid gap-4">
                {/* Placeholder for list */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>Основные правила этикета</CardTitle>
                                <CardDescription>Приоритет: 100</CardDescription>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono">
                            Вы — вежливый финансовый ассистент. Всегда обращайтесь к пользователю на "Вы".
                            Не используйте жаргон. Старайтесь отвечать лаконично, но дружелюбно.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

import { Outlet, Link, useLocation } from 'react-router-dom'
import { Brain, MessageSquare, Activity } from 'lucide-react'

export default function Constructor() {
    const location = useLocation()

    const tabs = [
        { name: 'МОЗГ', href: '/constructor/brain', icon: Brain },
        { name: 'ДИАГНОСТИКА', href: '/constructor/cjm', icon: MessageSquare },
        { name: 'СЕССИИ', href: '/constructor/sessions', icon: Activity },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Конструктор ботов</h1>
                <p className="text-muted-foreground">
                    Управление глобальной логикой, сценариями и мониторинг работы ИИ
                </p>
            </div>

            <div className="border-b">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = location.pathname === tab.href
                        return (
                            <Link
                                key={tab.name}
                                to={tab.href}
                                className={`flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors ${isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="mt-6">
                <Outlet />
            </div>
        </div>
    )
}

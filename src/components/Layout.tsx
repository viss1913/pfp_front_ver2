import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { adminManagementAPI, Project } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  Briefcase,
  Settings,
  LogOut,
  Bot,
  Users,
  Shield,
  Building2,
  ChevronDown,
  Globe
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'

export default function Layout() {
  const { user, logout, activeProject, selectProject } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      adminManagementAPI.listProjects().then(setProjects).catch(console.error)
    }
  }, [user])

  const navigation = [
    { name: 'Дашборд', href: '/', icon: LayoutDashboard },
    { name: 'Продукты', href: '/products', icon: Package },
    { name: 'Портфели', href: '/portfolios', icon: Briefcase },
    { name: 'Страхование Имущества', href: '/insurance/home-owners', icon: Package },
    { name: 'AI Ассистенты', href: '/ai-assistants', icon: Bot },
    { name: 'Агенты', href: '/agents', icon: Users },
    { name: 'AI B2C Site', href: '/ai-b2c', icon: Globe },
    { name: 'Конструктор бота', href: '/constructor', icon: Bot },
    { name: 'Настройки', href: '/settings', icon: Settings },
  ]

  const superAdminNavigation = [
    { name: 'Проекты', href: '/super-admin', icon: Globe },
    { name: 'Пользователи', href: '/admin/users', icon: Shield },
  ]

  const handleProjectSwitch = (project: Project) => {
    selectProject(project)
    window.location.reload() // Reload to reset all API states with new X-Project-Key
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <h1 className="text-xl font-bold">PFP Admin</h1>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}

              {user?.role === 'super_admin' && (
                <>
                  <div className="mt-6 mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                    Super Admin
                  </div>
                  {superAdminNavigation.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>
            <div className="border-t p-4">
              <div className="mb-2 px-3 text-sm">
                <p className="font-medium truncate">{user?.name || user?.email}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground uppercase">{user?.role}</p>
                  {activeProject && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {activeProject.slug}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header */}
          <header className="flex h-16 items-center border-b bg-card px-8 gap-4 justify-between">
            <div className="flex items-center gap-4">
              {user?.role === 'super_admin' && activeProject && (
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>В контексте:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-2 px-3 border-primary/50 bg-primary/5">
                        <span className="font-bold text-foreground">{activeProject.name}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Переключить проект</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {projects.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => handleProjectSwitch(p)}
                          className={activeProject.id === p.id ? 'bg-accent' : ''}
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          <span>{p.name}</span>
                          {activeProject.id === p.id && <ChevronDown className="ml-auto h-3 w-3 rotate-180" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/super-admin')}>
                        <Globe className="mr-2 h-4 w-4" />
                        <span>Все проекты</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {user?.role !== 'super_admin' && activeProject && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Проект: <span className="font-bold">{activeProject.name}</span></span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {/* Reserved for more header items like notifications etc */}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}












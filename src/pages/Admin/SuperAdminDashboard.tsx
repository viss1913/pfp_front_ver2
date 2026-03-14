import { useState, useEffect } from 'react'
import { adminManagementAPI, Project } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, CheckCircle2, Shield, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function SuperAdminDashboard() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [editProject, setEditProject] = useState<Project | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [agentsSeeAllClients, setAgentsSeeAllClients] = useState(false)
    const [isSavingProject, setIsSavingProject] = useState(false)

    const { selectProject, activeProject } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            const data = await adminManagementAPI.listProjects()
            setProjects(data)
        } catch (error) {
            console.error('Failed to load projects', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            const slug = newProjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            await adminManagementAPI.createProject({ name: newProjectName, slug })
            setNewProjectName('')
            setIsDialogOpen(false)
            loadProjects()
        } catch (error) {
            console.error('Failed to create project', error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleSelectProject = (project: Project) => {
        selectProject(project)
        navigate('/')
    }

    const openEditProject = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation()
        try {
            const full = await adminManagementAPI.getProject(project.id)
            setEditProject(full)
            setAgentsSeeAllClients(Boolean(full.settings?.agents_see_all_clients))
            setEditDialogOpen(true)
        } catch (err) {
            console.error('Failed to load project', err)
        }
    }

    const handleSaveProjectSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editProject) return
        setIsSavingProject(true)
        try {
            await adminManagementAPI.updateProject(editProject.id, {
                settings: { agents_see_all_clients: agentsSeeAllClients },
            })
            setEditDialogOpen(false)
            setEditProject(null)
            loadProjects()
        } catch (err) {
            console.error('Failed to update project', err)
        } finally {
            setIsSavingProject(false)
        }
    }

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center">Загрузка проектов...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Панель управления Super Admin</h2>
                    <p className="text-muted-foreground">
                        Выберите проект для управления или создайте новый
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Новый проект
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateProject}>
                            <DialogHeader>
                                <DialogTitle>Создать новый проект</DialogTitle>
                                <DialogDescription>
                                    Введите название для нового партнерского проекта.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Название проекта</Label>
                                    <Input
                                        id="name"
                                        value={newProjectName}
                                        onChange={(e) => setNewProjectName(e.target.value)}
                                        placeholder="Напр. Мой Партнер"
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? 'Создание...' : 'Создать'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${activeProject?.id === project.id ? 'border-primary ring-1 ring-primary' : ''}`}
                        onClick={() => handleSelectProject(project)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {project.name}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => openEditProject(e, project)}
                                    title="Настройки проекта"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                                <Shield className={`h-4 w-4 ${project.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground mb-4">
                                Slug: {project.slug}
                            </div>
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">
                                    {project.public_key}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant={activeProject?.id === project.id ? "default" : "outline"} className="w-full">
                                {activeProject?.id === project.id ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Выбрано
                                    </>
                                ) : (
                                    'Выбрать проект'
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditProject(null) }}>
                <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                    <form onSubmit={handleSaveProjectSettings}>
                        <DialogHeader>
                            <DialogTitle>Настройки проекта</DialogTitle>
                            <DialogDescription>
                                {editProject?.name && (
                                    <span className="font-medium text-foreground">{editProject.name}</span>
                                )}
                                {' — видимость клиентов для агентов.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="agents-see-all" className="text-base">
                                        Все агенты видят всех клиентов проекта
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Включено: у агентов в списке клиентов отображаются все клиенты проекта с пометкой B2C или агент-владелец. Выключено: каждый агент видит только своих клиентов.
                                    </p>
                                </div>
                                <Switch
                                    id="agents-see-all"
                                    checked={agentsSeeAllClients}
                                    onCheckedChange={setAgentsSeeAllClients}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditDialogOpen(false)}
                            >
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isSavingProject}>
                                {isSavingProject ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

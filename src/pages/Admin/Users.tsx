import { useState, useEffect } from 'react'
import { adminManagementAPI, AdminUser, Project } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Mail, Shield, Building2 } from 'lucide-react'

export default function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'admin' as AdminUser['role'],
        projectId: '' as string
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [usersData, projectsData] = await Promise.all([
                adminManagementAPI.listUsers(),
                adminManagementAPI.listProjects()
            ])
            setUsers(usersData)
            setProjects(projectsData)
        } catch (error) {
            console.error('Failed to load users/projects', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        try {
            await adminManagementAPI.createUser({
                ...formData,
                projectId: formData.projectId ? parseInt(formData.projectId) : null
            })
            setIsDialogOpen(false)
            setFormData({ email: '', password: '', name: '', role: 'admin', projectId: '' })
            loadData()
        } catch (error) {
            console.error('Failed to create user', error)
        } finally {
            setIsCreating(false)
        }
    }

    const getProjectName = (projectId: number | null) => {
        if (!projectId) return '-'
        const project = projects.find(p => p.id === projectId)
        return project ? project.name : `ID: ${projectId}`
    }

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center">Загрузка данных...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Управление пользователями</h2>
                    <p className="text-muted-foreground">
                        Создание и управление учетными записями администраторов и агентов
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Новый пользователь
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleCreateUser}>
                            <DialogHeader>
                                <DialogTitle>Создать пользователя</DialogTitle>
                                <DialogDescription>
                                    Добавьте нового администратора или агента в систему.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Имя</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Пароль</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Роль</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите роль" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="super_admin">Super Admin</SelectItem>
                                            <SelectItem value="admin">Admin (Партнер)</SelectItem>
                                            <SelectItem value="agent">Agent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.role !== 'super_admin' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="project">Проект</Label>
                                        <Select
                                            value={formData.projectId}
                                            onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите проект" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {projects.map(p => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? 'Создание...' : 'Создать пользователя'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Имя / Email</TableHead>
                            <TableHead>Роль</TableHead>
                            <TableHead>Проект</TableHead>
                            <TableHead>Статус</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.name}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {user.email}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                                        <Shield className="h-3 w-3" />
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {getProjectName(user.projectId)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                                        {user.is_active ? 'Активен' : 'Заблокирован'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Пользователи не найдены.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

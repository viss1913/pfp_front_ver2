import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Briefcase, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground">
          Добро пожаловать в административную панель PFP
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Продукты
            </CardTitle>
            <CardDescription>
              Управление финансовыми продуктами
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/products">
              <Button variant="outline" className="w-full">
                Перейти к продуктам
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Портфели
            </CardTitle>
            <CardDescription>
              Управление модельными портфелями
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/portfolios">
              <Button variant="outline" className="w-full">
                Перейти к портфелям
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки
            </CardTitle>
            <CardDescription>
              Системные настройки и параметры
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/settings">
              <Button variant="outline" className="w-full">
                Перейти к настройкам
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}











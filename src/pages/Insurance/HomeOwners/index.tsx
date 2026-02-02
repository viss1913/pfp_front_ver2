import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductsList from "./ProductsList"
import TariffList from "./TariffList"

export default function HomeOwnersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Страхование Имущества</h1>
                <p className="text-muted-foreground">
                    Управление продуктами и тарифной сеткой (Home Owners)
                </p>
            </div>

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="products">Продукты</TabsTrigger>
                    <TabsTrigger value="tariffs">Тарифы</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="mt-6">
                    <ProductsList />
                </TabsContent>

                <TabsContent value="tariffs" className="mt-6">
                    <TariffList />
                </TabsContent>
            </Tabs>
        </div>
    )
}

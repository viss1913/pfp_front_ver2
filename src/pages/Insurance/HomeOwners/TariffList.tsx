import { useEffect, useState } from "react"
import { homeOwnersAPI, HomeOwnersTariff, HomeOwnersProduct } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit2, Loader2, Filter, Trash2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import TariffFormDialog from "./TariffFormDialog"

export default function TariffList() {
    const [tariffs, setTariffs] = useState<HomeOwnersTariff[]>([])
    const [products, setProducts] = useState<HomeOwnersProduct[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>("all")
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedTariff, setSelectedTariff] = useState<HomeOwnersTariff | null>(null)

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const productsData = await homeOwnersAPI.listProducts()
            setProducts(productsData)
            // If we have products and none is selected, select the first one to avoid 400
            if (productsData.length > 0 && selectedProductId === "all") {
                setSelectedProductId(String(productsData[0].id))
            }
        } catch (error) {
            console.error("Failed to fetch products:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTariffs = async () => {
        if (selectedProductId === "all") return
        try {
            setLoading(true)
            const data = await homeOwnersAPI.listTariffs(Number(selectedProductId))
            setTariffs(data)
        } catch (error) {
            console.error("Failed to fetch tariffs:", error)
            setTariffs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        if (selectedProductId !== "all") {
            fetchTariffs()
        }
    }, [selectedProductId])

    const handleAdd = () => {
        setSelectedTariff(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (tariff: HomeOwnersTariff) => {
        setSelectedTariff(tariff)
        setIsDialogOpen(true)
    }

    const handleSave = async (data: HomeOwnersTariff) => {
        try {
            await homeOwnersAPI.upsertTariff(data)
            setIsDialogOpen(false)
            fetchTariffs()
        } catch (error) {
            console.error("Failed to save tariff:", error)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Вы уверены, что хотите удалить этот коэффициент?")) return
        try {
            await homeOwnersAPI.deleteTariff(id)
            fetchTariffs()
        } catch (error) {
            console.error("Failed to delete tariff:", error)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <CardTitle>Тарифная сетка</CardTitle>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Все продукты" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все продукты</SelectItem>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить тариф
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Продукт</TableHead>
                                <TableHead>Параметр</TableHead>
                                <TableHead>Значение</TableHead>
                                <TableHead>Название</TableHead>
                                <TableHead>Коэффициент</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tariffs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Тарифы не найдены
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tariffs.map((tariff) => (
                                    <TableRow key={tariff.id}>
                                        <TableCell>
                                            {products.find(p => p.id === tariff.product_id)?.name || `ID: ${tariff.product_id}`}
                                        </TableCell>
                                        <TableCell><code>{tariff.parameter_name}</code></TableCell>
                                        <TableCell><code>{tariff.parameter_value}</code></TableCell>
                                        <TableCell>{tariff.label}</TableCell>
                                        <TableCell className="font-mono">{tariff.coefficient}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(tariff)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-white hover:bg-destructive"
                                                    onClick={() => tariff.id && handleDelete(tariff.id)}
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
                )}
            </CardContent>

            <TariffFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                tariff={selectedTariff}
                products={products}
                onSave={handleSave}
            />
        </Card>
    )
}

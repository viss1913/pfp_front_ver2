import { useEffect, useState } from "react"
import { homeOwnersAPI, HomeOwnersProduct } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
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
import { Plus, Edit2, Loader2, Trash2 } from "lucide-react"
import ProductFormDialog from "./ProductFormDialog"
import { Badge } from "@/components/ui/badge"

export default function ProductsList() {
    const { activeProject } = useAuth()
    const [products, setProducts] = useState<HomeOwnersProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<HomeOwnersProduct | null>(null)

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const data = await homeOwnersAPI.listProducts()
            const filtered = activeProject
                ? data.filter(p => p.project_id === activeProject.id)
                : data
            setProducts(filtered)
        } catch (error) {
            console.error("Failed to fetch products:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleAdd = () => {
        setSelectedProduct(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (product: HomeOwnersProduct) => {
        setSelectedProduct(product)
        setIsDialogOpen(true)
    }

    const handleSave = async (data: HomeOwnersProduct) => {
        try {
            await homeOwnersAPI.upsertProduct(data)
            setIsDialogOpen(false)
            fetchProducts()
        } catch (error) {
            console.error("Failed to save product:", error)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Вы уверены, что хотите удалить этот продукт и все связанные с ним данные?")) return
        try {
            await homeOwnersAPI.deleteProduct(id)
            fetchProducts()
        } catch (error) {
            console.error("Failed to delete product:", error)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Продукты страхования</CardTitle>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить продукт
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
                                <TableHead>Название</TableHead>
                                <TableHead>Описание</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Продукты не найдены
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell className="max-w-xs truncate">{product.description || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.is_active ? "default" : "secondary"}>
                                                {product.is_active ? "Активен" : "Неактивен"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-white hover:bg-destructive"
                                                    onClick={() => product.id && handleDelete(product.id)}
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

            <ProductFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                product={selectedProduct}
                onSave={handleSave}
            />
        </Card>
    )
}

import { useEffect, useState } from "react"
import { HomeOwnersProduct } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface ProductFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: HomeOwnersProduct | null
    onSave: (product: HomeOwnersProduct) => Promise<void>
}

export default function ProductFormDialog({
    open,
    onOpenChange,
    product,
    onSave,
}: ProductFormDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isActive, setIsActive] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (product) {
            setName(product.name || "")
            setDescription(product.description || "")
            setIsActive(product.is_active ?? true)
        } else {
            setName("")
            setDescription("")
            setIsActive(true)
        }
    }, [product, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave({
                id: product?.id,
                name,
                description,
                is_active: isActive,
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{product ? "Редактировать продукт" : "Добавить продукт"}</DialogTitle>
                        <DialogDescription>
                            Заполните данные продукта для страхования недвижимости.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Название</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Страхование Квартиры"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Полное описание продукта..."
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="active">Активен</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={isSaving || !name}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

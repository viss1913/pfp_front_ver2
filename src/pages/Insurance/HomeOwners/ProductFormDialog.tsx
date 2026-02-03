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
    const [rateConstructive, setRateConstructive] = useState("")
    const [rateFinish, setRateFinish] = useState("")
    const [rateProperty, setRateProperty] = useState("")
    const [rateCivil, setRateCivil] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (product) {
            setName(product.name || "")
            setDescription(product.description || "")
            setIsActive(product.is_active ?? true)
            setRateConstructive(String(product.rate_constructive ?? ""))
            setRateFinish(String(product.rate_finish ?? ""))
            setRateProperty(String(product.rate_property ?? ""))
            setRateCivil(String(product.rate_civil ?? ""))
        } else {
            setName("")
            setDescription("")
            setIsActive(true)
            setRateConstructive("0.0010")
            setRateFinish("0.0010")
            setRateProperty("0.0010")
            setRateCivil("0.0010")
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
                rate_constructive: Number(rateConstructive),
                rate_finish: Number(rateFinish),
                rate_property: Number(rateProperty),
                rate_civil: Number(rateCivil),
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{product ? "Редактировать продукт" : "Добавить продукт"}</DialogTitle>
                        <DialogDescription>
                            Заполните данные продукта и базовые ставки (в долях).
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="rate_c">База: Конструктив</Label>
                                <Input
                                    id="rate_c"
                                    type="number"
                                    step="0.0001"
                                    value={rateConstructive}
                                    onChange={(e) => setRateConstructive(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rate_f">База: Отделка</Label>
                                <Input
                                    id="rate_f"
                                    type="number"
                                    step="0.0001"
                                    value={rateFinish}
                                    onChange={(e) => setRateFinish(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="rate_p">База: Имущество</Label>
                                <Input
                                    id="rate_p"
                                    type="number"
                                    step="0.0001"
                                    value={rateProperty}
                                    onChange={(e) => setRateProperty(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rate_civ">База: ГО</Label>
                                <Input
                                    id="rate_civ"
                                    type="number"
                                    step="0.0001"
                                    value={rateCivil}
                                    onChange={(e) => setRateCivil(e.target.value)}
                                    required
                                />
                            </div>
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

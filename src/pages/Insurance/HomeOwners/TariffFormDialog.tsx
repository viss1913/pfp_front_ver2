import { useEffect, useState } from "react"
import { HomeOwnersTariff, HomeOwnersProduct } from "@/lib/api"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TariffFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tariff: HomeOwnersTariff | null
    products: HomeOwnersProduct[]
    onSave: (tariff: HomeOwnersTariff) => Promise<void>
}

export default function TariffFormDialog({
    open,
    onOpenChange,
    tariff,
    products,
    onSave,
}: TariffFormDialogProps) {
    const [productId, setProductId] = useState<string>("")
    const [parameterName, setParameterName] = useState("")
    const [parameterValue, setParameterValue] = useState("")
    const [label, setLabel] = useState("")
    const [coefficient, setCoefficient] = useState("")
    const [coefficientType, setCoefficientType] = useState<'base' | 'multiplier'>('multiplier')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (tariff) {
            setProductId(String(tariff.product_id))
            setParameterName(tariff.parameter_name)
            setParameterValue(tariff.parameter_value)
            setLabel(tariff.label)
            setCoefficient(String(tariff.coefficient))
            setCoefficientType(tariff.coefficient_type)
        } else {
            setProductId(products.length > 0 ? String(products[0].id) : "")
            setParameterName("")
            setParameterValue("")
            setLabel("")
            setCoefficient("")
            setCoefficientType('multiplier')
        }
    }, [tariff, open, products])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave({
                id: tariff?.id,
                product_id: Number(productId),
                parameter_name: parameterName,
                parameter_value: parameterValue,
                label,
                coefficient: Number(coefficient),
                coefficient_type: coefficientType,
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
                        <DialogTitle>{tariff ? "Редактировать тариф" : "Добавить тариф"}</DialogTitle>
                        <DialogDescription>
                            Настройте коэффициенты для расчета страховой премии.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Продукт</Label>
                            <Select value={productId} onValueChange={setProductId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите продукт" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="param_name">Ключ параметра</Label>
                                <Input
                                    id="param_name"
                                    value={parameterName}
                                    onChange={(e) => setParameterName(e.target.value)}
                                    placeholder="wall_material"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="param_value">Значение</Label>
                                <Input
                                    id="param_value"
                                    value={parameterValue}
                                    onChange={(e) => setParameterValue(e.target.value)}
                                    placeholder="wood"
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="label">Название для отображения</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="Деревянные стены"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="coeff">Коэффициент (множитель)</Label>
                            <Input
                                id="coeff"
                                type="number"
                                step="0.0001"
                                value={coefficient}
                                onChange={(e) => setCoefficient(e.target.value)}
                                placeholder="1.0"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Например: 1.8 для повышения цены на 80% или 0.9 для скидки 10%.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={isSaving || !productId || !parameterName || !parameterValue || !coefficient}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

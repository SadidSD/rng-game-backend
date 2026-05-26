"use client"

import { useState } from "react"
import { Plus, Trash2, Copy } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Variant {
    id: string; // temp id for UI
    condition: string;
    isFoil: boolean;
    price: number;
    costPrice?: number;
    quantity: number;
}

interface VariantManagerProps {
    variants: Variant[];
    onChange: (variants: Variant[]) => void;
}

const CONDITIONS = ["NM", "LP", "MP", "HP", "DAMAGED", "SEALED"];

export function VariantManager({ variants, onChange }: VariantManagerProps) {
    const [template, setTemplate] = useState<Partial<Variant>>({
        condition: "NM",
        isFoil: false,
        price: 0,
        costPrice: 0,
        quantity: 1
    });

    const addVariant = () => {
        const newVariant: Variant = {
            id: Math.random().toString(36).substr(2, 9),
            condition: template.condition || "NM",
            isFoil: template.isFoil || false,
            price: Number(template.price) || 0,
            costPrice: Number(template.costPrice) || 0,
            quantity: Number(template.quantity) || 1,
        };
        onChange([...variants, newVariant]);
    };

    const removeVariant = (id: string) => {
        onChange(variants.filter(v => v.id !== id));
    };

    const updateVariant = (id: string, field: keyof Variant, value: any) => {
        onChange(variants.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ));
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Inventory Matrix</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Quick Add Form */}
                <div className="flex flex-wrap items-end gap-3 mb-6 p-4 border rounded-lg bg-muted/20">
                    <div className="w-32">
                        <Label className="text-xs mb-1.5 block">Condition</Label>
                        <Select
                            value={template.condition}
                            onValueChange={(v) => setTemplate({ ...template, condition: v })}
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CONDITIONS.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 pb-2">
                        <Checkbox
                            id="foil-template"
                            checked={template.isFoil}
                            onCheckedChange={(c) => setTemplate({ ...template, isFoil: !!c })}
                        />
                        <Label htmlFor="foil-template" className="text-sm cursor-pointer">Foil/Holo</Label>
                    </div>

                    <div className="w-24">
                        <Label className="text-xs mb-1.5 block">Price ($)</Label>
                        <Input
                            type="number"
                            className="h-8"
                            step="0.01"
                            value={template.price}
                            onChange={(e) => setTemplate({ ...template, price: Number(e.target.value) })}
                        />
                    </div>

                    <div className="w-24">
                        <Label className="text-xs mb-1.5 block">Cost ($)</Label>
                        <Input
                            type="number"
                            className="h-8"
                            step="0.01"
                            value={template.costPrice}
                            onChange={(e) => setTemplate({ ...template, costPrice: Number(e.target.value) })}
                        />
                    </div>

                    <div className="w-20">
                        <Label className="text-xs mb-1.5 block">Qty</Label>
                        <Input
                            type="number"
                            className="h-8"
                            value={template.quantity}
                            onChange={(e) => setTemplate({ ...template, quantity: Number(e.target.value) })}
                        />
                    </div>

                    <Button onClick={addVariant} size="sm" type="button" className="gap-1">
                        <Plus className="h-3 w-3" /> Add
                    </Button>
                </div>

                {/* Variants List */}
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Condition</TableHead>
                                <TableHead>Finish</TableHead>
                                <TableHead className="w-24">Price</TableHead>
                                <TableHead className="w-24">Buying Price</TableHead>
                                <TableHead className="w-20">Stock</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {variants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                                        No variants added. Add one above.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                variants.map((v) => (
                                    <TableRow key={v.id}>
                                        <TableCell>
                                            <div className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold bg-background ${v.condition === 'NM' ? 'text-green-600 border-green-200 bg-green-50' :
                                                    v.condition === 'LP' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                                        'text-gray-600'
                                                }`}>
                                                {v.condition}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {v.isFoil && (
                                                <div className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                                    ✨ Foil
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-7 w-20"
                                                value={v.price}
                                                step="0.01"
                                                onChange={(e) => updateVariant(v.id, 'price', Number(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-7 w-20"
                                                value={v.costPrice || 0}
                                                step="0.01"
                                                onChange={(e) => updateVariant(v.id, 'costPrice', Number(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-7 w-16"
                                                value={v.quantity}
                                                onChange={(e) => updateVariant(v.id, 'quantity', Number(e.target.value))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => removeVariant(v.id)}
                                                type="button"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

const lowStockItems = [
    { id: 1, name: "Pikachu V", game: "Pokémon", stock: 3, threshold: 10 },
    { id: 2, name: "Lillie Full Art", game: "Pokémon", stock: 1, threshold: 5 },
    { id: 3, name: "Force of Will", game: "MTG", stock: 2, threshold: 8 },
    { id: 4, name: "Ash Blossom", game: "Yu-Gi-Oh!", stock: 4, threshold: 10 },
]

export function InventoryAlerts() {
    return (
        <div className="space-y-3">
            {lowStockItems.map((item) => (
                <Link
                    key={item.id}
                    href={`/inventory?search=${item.name}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <div>
                            <p className="text-sm font-medium leading-none">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.game}</p>
                        </div>
                    </div>
                    <Badge variant="destructive">
                        {item.stock} left
                    </Badge>
                </Link>
            ))}
        </div>
    )
}

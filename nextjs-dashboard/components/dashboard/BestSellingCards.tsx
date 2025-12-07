"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const bestSellers = [
    { rank: 1, name: "Charizard VMAX", game: "Pokémon", sales: 45, revenue: 4500 },
    { rank: 2, name: "Black Lotus", game: "MTG", sales: 2, revenue: 8000 },
    { rank: 3, name: "Pikachu V", game: "Pokémon", sales: 38, revenue: 1900 },
    { rank: 4, name: "Mox Ruby", game: "MTG", sales: 3, revenue: 4200 },
    { rank: 5, name: "Mewtwo GX", game: "Pokémon", sales: 32, revenue: 1600 },
]

export function BestSellingCards() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Card Name</TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bestSellers.map((card) => (
                    <TableRow key={card.rank}>
                        <TableCell className="font-medium">#{card.rank}</TableCell>
                        <TableCell className="font-medium">{card.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{card.game}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{card.sales}</TableCell>
                        <TableCell className="text-right">
                            ${card.revenue.toLocaleString()}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

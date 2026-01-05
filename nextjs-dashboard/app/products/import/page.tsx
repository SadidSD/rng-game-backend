'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Loader2, Plus } from "lucide-react"
import Image from 'next/image';

export default function ImportPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleImport = async (card: any) => {
        try {
            // Map Manapool card query to our Product Schema
            // Note: Adjust fields based on actual Manapool API response structure
            const productData = {
                name: card.name,
                description: `Imported from Manapool. Set: ${card.set}`,
                // If Manapool gives 'game' or 'category', map it here. Defaulting to 'Pokemon' for now based on context.
                description: `Set: ${card.set} | Rarity: ${card.rarity}`,
                price: card.price || 0, // Use average sell price or 0
                stock: 0,
                categoryId: 'pokemon-singles', // You might want this dynamic or selectable
                images: [card.imageLarge || card.image] // Use high-res image
            }

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/products`, productData)
            alert('Product imported successfully!')
        } catch (error) {
            console.error('Import failed', error)
            alert('Import failed. See console for details.')
        } finally {
            setImporting(null)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Import Products</h1>
                <p className="text-muted-foreground">Search and import cards from PokemonTCG API.</p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-4">
                <Input
                    placeholder="Search for cards (e.g. Charizard)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="max-w-md"
                />
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search
                </Button>
            </form>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.id} className="overflow-hidden">
                        <div className="aspect-[3/4] relative bg-muted">
                            {/* Use normalized 'image' field from backend */}
                            <img
                                src={card.image}
                                alt={card.name}
                                className="object-contain w-full h-full"
                            />
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg truncate">{card.name}</CardTitle>
                            <CardDescription>{card.set} - {card.rarity}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                            <Button
                                className="w-full"
                                variant="secondary"
                                onClick={() => handleImport(card)}
                                disabled={importing === card.id}
                            >
                                {importing === card.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                )}
                                Import Product
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}

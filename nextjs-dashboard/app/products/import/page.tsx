'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, Loader2, DownloadCloud } from "lucide-react"
import axios from 'axios';

export default function ImportPage() {
    const [query, setQuery] = useState('')
    const [cards, setCards] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState<string | null>(null)

    const router = useRouter()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Using PokemonTCG endpoint
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/integrations/pokemon-tcg/search`, {
                params: { query }
            })
            setCards(res.data.data)
        } catch (error) {
            console.error('Search failed', error)
            alert('Search failed. See console for details.')
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async (card: any) => {
        setImporting(card.id)
        try {
            // Map PokemonTCG data to local Product schema
            const productData = {
                name: card.name,
                description: `Set: ${card.set} | Rarity: ${card.rarity || 'Unknown'}`,
                price: card.price || 0,
                stock: 0,
                categoryId: 'pokemon-singles', // Ensure this category exists or is handled
                images: [card.imageLarge || card.image]
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
                    <Card key={card.id} className="overflow-hidden flex flex-col">
                        <div className="aspect-[3/4] relative bg-muted">
                            <img
                                src={card.image}
                                alt={card.name}
                                className="object-contain w-full h-full"
                            />
                        </div>
                        <CardHeader className="p-4 flex-1">
                            <CardTitle className="text-lg truncate" title={card.name}>{card.name}</CardTitle>
                            <CardDescription>{card.set} - {card.rarity}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0 mt-auto">
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

            {!loading && cards.length === 0 && query && (
                <div className="text-center text-muted-foreground py-12">No results found.</div>
            )}
        </div>
    )
}

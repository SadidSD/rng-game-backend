'use client';

import { useState, useEffect } from 'react';
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
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

    const router = useRouter()

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
                if (res.data && res.data.length > 0) {
                    setCategories(res.data)
                    setSelectedCategoryId(res.data[0].id)
                }
            } catch (error) {
                console.error('Failed to fetch categories', error)
            }
        }
        fetchCategories()
    }, [])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Smart Query Construction:
            // 1. If spaces exist, use quotes for exact phrase match (faster)
            // 2. If single word, use wildcard for prefix match
            const hasSpaces = query.includes(' ')
            const queryString = hasSpaces ? `name:"${query}"` : `name:${query}*`

            const res = await axios.get(`https://api.pokemontcg.io/v2/cards`, {
                params: {
                    q: queryString,
                    pageSize: 12, // Reduced to speed up response
                    orderBy: '-set.releaseDate', // Show newest cards first
                    select: 'id,name,set,rarity,images,cardmarket,tcgplayer'
                }
            })

            // Map raw response to our app schema
            const mappedCards = res.data.data.map((card: any) => ({
                id: card.id,
                name: card.name,
                set: card.set.name,
                setId: card.set.id,
                rarity: card.rarity,
                image: card.images.small,
                imageLarge: card.images.large,
                price: card.cardmarket?.prices?.averageSellPrice,
                tcgplayerUrl: card.tcgplayer?.url
            }))

            setCards(mappedCards)
        } catch (error) {
            console.error('Search failed', error)
            alert('Search failed. See console for details.')
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async (card: any) => {
        if (!selectedCategoryId) {
            alert('Please select a category first.')
            return
        }
        setImporting(card.id)
        try {
            // Map PokemonTCG data to local Product schema
            const productData = {
                name: card.name,
                description: `Set: ${card.set} | Rarity: ${card.rarity || 'Unknown'}`,
                price: card.price || 0,
                stock: 0,
                categoryId: selectedCategoryId,
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

            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/3">
                    <label className="text-sm font-medium mb-1 block">Target Category</label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <form onSubmit={handleSearch} className="flex gap-4 w-full md:w-2/3 items-end">
                    <Input
                        placeholder="Search for cards (e.g. Charizard)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
            </div>

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

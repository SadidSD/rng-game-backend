'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Search, Loader2, DownloadCloud } from "lucide-react";
import axios from 'axios';

interface CardData {
    id: string;
    name: string;
    set: string;
    setId: string;
    rarity: string;
    image: string;
    imageLarge: string;
    price?: number;
    tcgplayerUrl?: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ImportPage() {
    const [query, setQuery] = useState('');
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [availableSets, setAvailableSets] = useState<string[]>([]);
    const [selectedSet, setSelectedSet] = useState<string>('');

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
                if (res.data && res.data.length > 0) {
                    setCategories(res.data);
                    setSelectedCategoryId(res.data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch categories', error);
            }
        };
        fetchCategories();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        try {
            const res = await axios.get(`/api/proxy/pokemon`, {
                params: { query }
            });

            const mappedCards: CardData[] = res.data.data.map((card: any) => ({
                id: card.id,
                name: card.name,
                set: card.set.name,
                setId: card.set.id,
                rarity: card.rarity,
                image: card.images.small,
                imageLarge: card.images.large,
                price: card.cardmarket?.prices?.averageSellPrice,
                tcgplayerUrl: card.tcgplayer?.url
            }));

            setCards(mappedCards);

            // Extract unique sets for set selection
            const sets: string[] = Array.from(
                new Set(mappedCards.map(c => c.set).filter(Boolean))
            );
            setAvailableSets(sets);
            if (sets.length > 0) setSelectedSet(sets[0]);
        } catch (error) {
            console.error('Search failed', error);
            alert('Search failed. See console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (card: CardData) => {
        if (!selectedCategoryId) {
            alert('Please select a category first.');
            return;
        }
        setImporting(card.id);

        try {
            const productData = {
                name: card.name,
                description: `Set: ${card.set} | Rarity: ${card.rarity || 'Unknown'}`,
                price: card.price || 0,
                stock: 0,
                categoryId: selectedCategoryId,
                images: [card.imageLarge || card.image],
                set: card.set
            };

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/products`, productData);
            alert('Product imported successfully!');
        } catch (error) {
            console.error('Import failed', error);
            alert('Import failed. See console for details.');
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Import Products</h1>
                <p className="text-muted-foreground">Search and import cards from PokemonTCG API.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/4 flex flex-col gap-4">
                    {/* Category Selection */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Target Category</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Set Selection */}
                    {availableSets.length > 0 && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Set</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedSet}
                                onChange={(e) => setSelectedSet(e.target.value)}
                            >
                                {availableSets.map(setName => (
                                    <option key={setName} value={setName}>{setName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-4 w-full md:w-3/4 items-end">
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

            {/* Cards Grid */}
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
    );
}

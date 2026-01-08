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
    // Expanded prices object
    prices?: {
        usd?: number;
        usd_foil?: number;
        usd_etched?: number;
    };
    price?: number; // Keep for backward compat / initial sort
    tcgplayerUrl?: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ImportPage() {
    const [selectedGame, setSelectedGame] = useState<'pokemon' | 'mtg'>('pokemon');
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

    const [manapoolPrices, setManapoolPrices] = useState<any[]>([]);

    const fetchManapoolPrices = async (query: string) => {
        // [REFINE] Manapool is MTG Only. Do not fetch for Pokemon.
        if (selectedGame !== 'mtg') {
            setManapoolPrices([]);
            return;
        }

        try {
            // Fetch relevant prices from our Manapool Proxy
            const res = await axios.get('/api/proxy/manapool', {
                params: { query }
            });
            setManapoolPrices(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch Manapool prices', error);
        }
    };

    const getManapoolPrice = (card: CardData) => {
        if (!manapoolPrices.length || selectedGame !== 'mtg') return null;

        // Strategy 1: Exact Scryfall ID Match (Most Accurate)
        let match = manapoolPrices.find(p => p.scryfall_id === card.id);

        // Strategy 2: Name + Set Code Match (Fallback)
        // Scryfall 'set' is usually lowercase code (e.g. 'lea'). Manapool 'set_code' is usually uppercase ('LEA').
        if (!match) {
            match = manapoolPrices.find(p =>
                p.name === card.name &&
                p.set_code?.toLowerCase() === card.setId?.toLowerCase()
            );
        }

        return match ? match.price : null;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;

        setLoading(true);
        setCards([]); // Clear previous results
        setAvailableSets([]); // Clear sets
        setManapoolPrices([]); // Clear old prices

        // Trigger Manapool Fetch in parallel
        fetchManapoolPrices(query);

        try {
            let mappedCards: CardData[] = [];

            if (selectedGame === 'pokemon') {
                const res = await axios.get(`/api/proxy/pokemon`, {
                    params: { query }
                });

                mappedCards = res.data.data.map((card: any) => ({
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
            } else {
                // MTG / Scryfall Search
                const res = await axios.get(`/api/proxy/mtg`, {
                    params: { query }
                });

                // Scryfall returns object with { object: "list", data: [...] }
                const rawData = res.data.data || [];

                mappedCards = rawData.map((card: any) => {
                    // Start: Handle Scryfall's image logic (some cards are double-faced)
                    let image = card.image_uris?.normal;
                    let imageLarge = card.image_uris?.large;
                    if (!image && card.card_faces && card.card_faces[0].image_uris) {
                        image = card.card_faces[0].image_uris.normal;
                        imageLarge = card.card_faces[0].image_uris.large;
                    }
                    // End: Image Logic

                    return {
                        id: card.id,
                        name: card.name,
                        set: card.set_name,
                        setId: card.set,
                        rarity: card.rarity,
                        image: image || '/placeholder.png', // Fallback
                        imageLarge: imageLarge || image || '/placeholder.png',
                        prices: {
                            usd: card.prices?.usd ? parseFloat(card.prices.usd) : undefined,
                            usd_foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : undefined,
                            usd_etched: card.prices?.usd_etched ? parseFloat(card.prices.usd_etched) : undefined,
                        },
                        price: card.prices?.usd ? parseFloat(card.prices.usd) :
                            (card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) :
                                (card.prices?.usd_etched ? parseFloat(card.prices.usd_etched) : undefined)),
                        tcgplayerUrl: card.purchase_uris?.tcgplayer
                    };
                });
            }

            setCards(mappedCards);

            // Extract unique sets for set selection
            const sets: string[] = Array.from(
                new Set(mappedCards.map(c => c.set).filter(Boolean))
            );
            setAvailableSets(sets);
            // Fix: Do NOT auto-select the first set. Default to showing all.
            setSelectedSet('');
        } catch (error) {
            console.error('Search failed', error);
            alert('Search failed. See console for details.');
        } finally {
            setLoading(false);
        }
    };

    const [selectedFinishes, setSelectedFinishes] = useState<{ [key: string]: string }>({});

    const getSelectedFinish = (cardId: string) => {
        return selectedFinishes[cardId] || 'usd'; // Default to non-foil (usd)
    };

    const handleFinishChange = (cardId: string, finish: string) => {
        setSelectedFinishes(prev => ({ ...prev, [cardId]: finish }));
    };

    const getPriceForFinish = (card: CardData, finish: string) => {
        if (finish === 'usd') return card.prices?.usd;
        if (finish === 'usd_foil') return card.prices?.usd_foil;
        if (finish === 'usd_etched') return card.prices?.usd_etched;
        return undefined;
    };

    // ...

    const handleImport = async (card: CardData) => {
        if (!selectedCategoryId) {
            alert('Please select a category first.');
            return;
        }
        setImporting(card.id);

        const finish = getSelectedFinish(card.id);
        const selectedPrice = getPriceForFinish(card, finish);

        // Append finish to name if not standard
        let name = card.name;
        if (finish === 'usd_foil') name += ' (Foil)';
        if (finish === 'usd_etched') name += ' (Etched)';

        try {
            const productData = {
                name: name,
                description: `Game: ${selectedGame.toUpperCase()} | Set: ${card.set} | Rarity: ${card.rarity || 'Unknown'} | Finish: ${finish}`,
                price: getManapoolPrice(card) ?? selectedPrice ?? 0, // Prefer Manapool if available (Logic Check: Manapool price might not match finish? For now keeping preference but user might want TCG price if they selected specific finish)
                // actually, if user selects "Foil", we should probably use TCG Foil Price unless Manapool has a foil price?
                // Providing Manapool price blindly might be wrong if Manapool only has Non-Foil.
                // For safety: If Manapool price exists, use it? No, Manapool data doesn't specify finish clearly in my reduced interface.
                // Let's stick to: If Manapool is N/A, use TCG Price. If Manapool is found, use Manapool (assuming Manapool links to best stock).
                // Or better: Use the `selectedPrice` from TCGPlayer as the primary for "Import" if Manapool is just a reference check.
                // The user asked "per card include all prices ... give dropdown to select". This implies importing THAT price.
                // So I will use `selectedPrice` (TCG) as the base price. Manapool is just valid for reference.
                // WAIT. If I use `selectedPrice`, I ignore Manapool.
                // But the user *wanted* Manapool.
                // Compromise: I'll use `selectedPrice` (TCG) but if Manapool is present, I'll assume that matches likely Non-Foil.
                // If user selects Foil, I should probably rely on TCG Foil Price.
                stock: 0,
                categoryId: selectedCategoryId,
                images: [card.imageLarge || card.image],
                set: card.set
            };

            // Refined Logic: If Manapool is present, using it overrides TCG. 
            // But Manapool might be Non-Foil. If user selects Foil, they expect Foil price.
            // I'll prioritize `selectedPrice` (TCG) if the user explicitly picked a finish, UNLESS Manapool is the intent.
            // Given the recent conversation, user wants Scryfall data.
            // I will use `selectedPrice` as the source of truth for the import price.
            productData.price = selectedPrice ?? 0;

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/products`, productData);
            alert(`[${selectedGame.toUpperCase()}] Product imported successfully!`);
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
                <p className="text-muted-foreground">Search and import cards from PokemonTCG or Scryfall (MTG) with Manapool Pricing.</p>
            </div>

            {/* Game Selector */}
            <div className="flex gap-2">
                <Button
                    variant={selectedGame === 'pokemon' ? 'default' : 'outline'}
                    onClick={() => setSelectedGame('pokemon')}
                >
                    Pokemon TCG
                </Button>
                <Button
                    variant={selectedGame === 'mtg' ? 'default' : 'outline'}
                    onClick={() => setSelectedGame('mtg')}
                >
                    Magic: The Gathering
                </Button>
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
                            <label className="text-sm font-medium mb-1 block">Filter by Set</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedSet}
                                onChange={(e) => {
                                    setSelectedSet(e.target.value);
                                }}
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
                        placeholder={`Search ${selectedGame === 'pokemon' ? 'Pokemon' : 'Magic'} cards...`}
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
                {cards
                    // Simple client-side set filtering if a set is selected
                    .filter(card => !selectedSet || card.set === selectedSet)
                    .map((card) => {
                        const mpPrice = getManapoolPrice(card);
                        const selectedFinish = getSelectedFinish(card.id);
                        const currentPrice = getPriceForFinish(card, selectedFinish);

                        // Check availability for dropdown
                        const hasNonFoil = card.prices?.usd !== undefined;
                        const hasFoil = card.prices?.usd_foil !== undefined;
                        const hasEtched = card.prices?.usd_etched !== undefined;

                        return (
                            <Card key={card.id} className="overflow-hidden flex flex-col">
                                <div className="aspect-[3/4] relative bg-muted">
                                    <img
                                        src={card.image}
                                        alt={card.name}
                                        className="object-contain w-full h-full"
                                        loading="lazy"
                                    />
                                </div>
                                <CardHeader className="p-4 flex-1">
                                    <CardTitle className="text-lg truncate" title={card.name}>{card.name}</CardTitle>
                                    <CardDescription className="flex flex-col gap-1">
                                        <span>{card.set}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary w-fit">
                                            {card.rarity}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-2">

                                    {/* Finish Selector */}
                                    <select
                                        className="w-full text-sm border rounded p-1 mb-2"
                                        value={selectedFinish}
                                        onChange={(e) => handleFinishChange(card.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {hasNonFoil && <option value="usd">Non-Foil</option>}
                                        {hasFoil && <option value="usd_foil">Foil</option>}
                                        {hasEtched && <option value="usd_etched">Etched</option>}
                                        {!hasNonFoil && !hasFoil && !hasEtched && <option value="usd">Unknown</option>}
                                    </select>

                                    <div className="flex w-full flex-col gap-1 text-sm font-semibold">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">TCG/Market:</span>
                                            <span>${currentPrice?.toFixed(2) || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600">
                                            <span>Manapool:</span>
                                            <span>{mpPrice ? `$${mpPrice.toFixed(2)}` : 'N/A'}</span>
                                        </div>
                                    </div>
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
                                        Import
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })
                }
            </div >

            {!loading && cards.length === 0 && query && (
                <div className="text-center text-muted-foreground py-12">No results found.</div>
            )}
        </div >
    );
}

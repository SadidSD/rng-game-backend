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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, DownloadCloud, FileSpreadsheet } from "lucide-react";
import axios from 'axios';
import Cookies from 'js-cookie';
import CsvImport from './csv-import';

interface CardData {
    id: string;
    name: string;
    set: string;
    setId: string;
    rarity: string;
    image: string;
    imageLarge: string;
    collectorNumber?: string;
    // Expanded prices object
    prices?: {
        usd?: number;
        usd_foil?: number;
        usd_etched?: number;
    };
    price?: number; // Keep for backward compat / initial sort
    tcgplayerUrl?: string;
    finishes?: string[];
    // Identity Fields
    oracleId?: string;
    oracleText?: string;
    legalities?: any;
    manaCost?: string;
    manaValue?: number;
    colors?: string[];
    colorIdentity?: string[];
    typeLine?: string;
    supertypes?: string[];
    subtypes?: string[];
    power?: string;
    toughness?: string;
    loyalty?: string;
}

interface Category {
    id: string;
    name: string;
}

export default function ImportPage() {
    const selectedGame: 'pokemon' | 'mtg' = 'mtg';
    const [query, setQuery] = useState('');
    const [cards, setCards] = useState<CardData[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [availableSets, setAvailableSets] = useState<string[]>([]);
    const [selectedSet, setSelectedSet] = useState<string>('');

    // Fetch categories on mount and auto-select MTG
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = Cookies.get('tcg-auth-token');
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data && res.data.length > 0) {
                    setCategories(res.data);

                    // Auto-select MTG
                    const mtgCat = res.data.find((c: Category) =>
                        c.name.toLowerCase() === 'mtg' ||
                        c.name.toLowerCase().includes('magic')
                    );

                    if (mtgCat) {
                        setSelectedCategoryId(mtgCat.id);
                    } else {
                        // Fallback: If categories exist but no MTG, select first (or create? let's stick to simple selection first)
                        setSelectedCategoryId(res.data[0].id);
                    }
                } else {
                    // [Auto-Create] No categories found? Create MTG immediately.
                    console.log('No categories found. Auto-creating Magic: The Gathering...');
                    try {
                        const createRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
                            name: 'Magic: The Gathering',
                            slug: 'magic-the-gathering'
                        }, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (createRes.data && createRes.data.id) {
                            setCategories([createRes.data]);
                            setSelectedCategoryId(createRes.data.id);
                            console.log('Auto-created MTG Category:', createRes.data);
                        }
                    } catch (createError) {
                        console.error('Failed to auto-create MTG category on init', createError);
                    }
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
        setCards([]); // Clear previous results
        setAvailableSets([]); // Clear sets

        console.log(`[Import] Searching for: ${query}`);

        try {
            let mappedCards: CardData[] = [];

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

                // Handle faces for oracle text/mana cost if split
                const oracleText = card.oracle_text || card.card_faces?.map((f: any) => f.oracle_text).join('\n//\n') || '';
                const manaCost = card.mana_cost || card.card_faces?.map((f: any) => f.mana_cost).join(' // ') || '';
                const typeLine = card.type_line || card.card_faces?.map((f: any) => f.type_line).join(' // ') || '';

                return {
                    id: card.id,
                    name: card.name,
                    set: card.set_name,
                    setId: card.set,
                    rarity: card.rarity,
                    collectorNumber: card.collector_number,
                    image: image || '/placeholder.png',
                    imageLarge: imageLarge || image || '/placeholder.png',

                    // Identity Mappings
                    oracleId: card.oracle_id,
                    oracleText: oracleText,
                    legalities: card.legalities,
                    manaCost: manaCost,
                    manaValue: card.cmc,
                    colors: card.colors || card.card_faces?.[0]?.colors || [],
                    colorIdentity: card.color_identity || [],
                    typeLine: typeLine,
                    power: card.power,
                    toughness: card.toughness,
                    loyalty: card.loyalty,

                    prices: {
                        usd: card.prices?.usd ? parseFloat(card.prices.usd) : undefined,
                        usd_foil: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : undefined,
                        usd_etched: card.prices?.usd_etched ? parseFloat(card.prices.usd_etched) : undefined,
                    },
                    price: card.prices?.usd ? parseFloat(card.prices.usd) :
                        (card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) :
                            (card.prices?.usd_etched ? parseFloat(card.prices.usd_etched) : undefined)),
                    finishes: card.finishes || [],
                    tcgplayerUrl: card.purchase_uris?.tcgplayer
                };
            });

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

    // Auto-detect best default finish
    const getDefaultFinish = (card: CardData) => {
        if (card.prices?.usd) return 'usd';
        if (card.prices?.usd_foil) return 'usd_foil';
        if (card.prices?.usd_etched) return 'usd_etched';
        // Fallback to finishes array if no price is available
        if (card.finishes?.includes('nonfoil')) return 'usd';
        if (card.finishes?.includes('foil')) return 'usd_foil';
        if (card.finishes?.includes('etched')) return 'usd_etched';
        return 'usd';
    };

    const getSelectedFinish = (card: CardData) => {
        // Use updated logic defined above, but keep this wrapper if needed or remove if redundant
        // Wait, I defined getSelectedFinish twice in previous step? 
        // No, I defined it inside the component body, replacing lines 89-114.
        // But the Original Code had getSelectedFinish at line 217.
        // I should remove the old one or merge.
        // I will replace this block with nothing/comment since I moved it up or update calls?
        // Actually, the previous step inserted `getSelectedFinish` near line 115.
        // So I should DELETE this old definition to avoid duplicates.
        return selectedFinishes[card.id] || getDefaultFinish(card);
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

    const handleImport = async (card: CardData, quantity: number = 1, price: number = 0, costPrice: number = 0) => {
        // [Refined Logic] Auto-detect category from available list if not already selected
        let targetCategoryId = selectedCategoryId;

        if (!targetCategoryId && categories.length > 0) {
            const mtgCat = categories.find(c =>
                c.name.toLowerCase() === 'mtg' ||
                c.name.toLowerCase().includes('magic')
            );
            if (mtgCat) {
                targetCategoryId = mtgCat.id;
                setSelectedCategoryId(mtgCat.id); // Sync state
            }
        }

        if (!targetCategoryId) {
            // Last-ditch effort: Create silently if missing (e.g. initial fetch failed)
            try {
                const token = Cookies.get('tcg-auth-token');
                const createRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
                    name: 'Magic: The Gathering',
                    slug: 'magic-the-gathering'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (createRes.data && createRes.data.id) {
                    targetCategoryId = createRes.data.id;
                    setCategories(prev => [...prev, createRes.data]);
                    setSelectedCategoryId(createRes.data.id);
                }
            } catch (e) {
                console.error('Failed to auto-create category in handleImport', e);
                alert('System Error: Could not find or create "Magic: The Gathering" category. Please check your connection or create it manually.');
                return;
            }
        }

        if (!targetCategoryId) {
            alert('Please select or create a category (e.g., Magic: The Gathering) before importing.');
            return;
        }

        setImporting(card.id);

        const finish = getSelectedFinish(card);
        const selectedPrice = getPriceForFinish(card, finish);

        // Append finish to name if not standard
        let name = card.name;
        if (finish === 'usd_foil') name += ' (Foil)';
        if (finish === 'usd_etched') name += ' (Etched)';

        try {
            const productData = {
                name: name,
                description: `Game: MTG | Set: ${card.set} | Rarity: ${card.rarity || 'Unknown'} | Finish: ${finish} | Num: ${card.collectorNumber}`,
                game: 'MTG',
                categoryId: targetCategoryId,
                set: card.set,
                rarity: card.rarity,
                collectorNumber: card.collectorNumber,
                oracleId: card.oracleId,
                oracleText: card.oracleText,
                legalities: card.legalities,
                manaCost: card.manaCost,
                manaValue: card.manaValue,
                colors: card.colors,
                colorIdentity: card.colorIdentity,
                typeLine: card.typeLine,
                power: card.power,
                toughness: card.toughness,
                loyalty: card.loyalty,

                price: price,
                images: [card.imageLarge || card.image],
                variants: [
                    {
                        condition: 'NM',
                        price: price,
                        costPrice: costPrice,
                        quantity: quantity,
                        isFoil: finish === 'usd_foil' || finish === 'usd_etched',
                        language: 'English'
                    }
                ]
            };

            console.log('[Import] Sending Product Data:', productData);

            const token = Cookies.get('tcg-auth-token');
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/products`, productData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('[Import] Success:', res.data);
            alert(`[${selectedGame.toUpperCase()}] Product imported successfully!`);
        } catch (error: any) {
            console.error('Import failed', error);
            const errMsg = error.response?.data?.message || error.message;
            alert(`Import failed: ${errMsg}. Check console for full details.`);
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Import Products</h1>
                <p className="text-muted-foreground">Search individual cards or bulk import from CSV.</p>
            </div>

            <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                    <TabsTrigger value="search" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Search Import
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV Bulk Import
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="mt-6">
                    <CsvImport categories={categories} selectedCategoryId={selectedCategoryId} />
                </TabsContent>

                <TabsContent value="search" className="mt-6 flex flex-col gap-6">

            {/* Search */}
            <div className="w-full max-w-4xl mx-auto">
                <form onSubmit={handleSearch} className="flex gap-3 w-full items-end p-6 bg-muted/30 rounded-xl border border-border shadow-sm">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-semibold text-foreground/80">Search by Card Name</label>
                        <Input
                            placeholder="e.g. Black Lotus, Sol Ring..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-12 text-lg border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-2"
                        />
                    </div>
                    <Button type="submit" disabled={loading} size="lg" className="h-12 px-8 text-base font-semibold">
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                        Search
                    </Button>
                </form>
            </div>



            {/* Set Selection */}
            {
                availableSets.length > 0 && (
                    <div className="w-full md:w-1/3">
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
                )
            }

            {/* Cards Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cards
                    .filter(card => !selectedSet || card.set === selectedSet)
                    .map((card) => {
                        const selectedFinish = getSelectedFinish(card);
                        const currentPrice = getPriceForFinish(card, selectedFinish);

                        // Check availability for dropdown from finishes array if present, fallback to price presence
                        const hasNonFoil = card.finishes ? card.finishes.includes('nonfoil') : card.prices?.usd !== undefined;
                        const hasFoil = card.finishes ? card.finishes.includes('foil') : card.prices?.usd_foil !== undefined;
                        const hasEtched = card.finishes ? card.finishes.includes('etched') : card.prices?.usd_etched !== undefined;

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
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-semibold">{card.set}</span>
                                            <span className="bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground mr-2">
                                                #{card.collectorNumber}
                                            </span>
                                        </div>
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

                                    <div className="flex w-full flex-col gap-1 text-xs text-muted-foreground mb-2">
                                        <div className="flex justify-between">
                                            <span>TCG/Market Price:</span>
                                            <span>{currentPrice !== undefined ? `$${currentPrice.toFixed(2)}` : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Price Input */}
                                    <div className="flex w-full items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-muted-foreground w-16">Price ($):</span>
                                        <Input
                                            key={`price-${card.id}-${selectedFinish}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            defaultValue={currentPrice !== undefined ? currentPrice.toFixed(2) : "0.00"}
                                            className="h-8"
                                            id={`price-${card.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    {/* Cost/Buying Price Selector */}
                                    <div className="flex w-full items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-muted-foreground w-16">Cost ($):</span>
                                        <Input
                                            key={`cost-${card.id}-${selectedFinish}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            defaultValue={currentPrice !== undefined ? (currentPrice * 0.5).toFixed(2) : "0.00"}
                                            className="h-8"
                                            id={`cost-${card.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    {/* Quantity Selector */}
                                    <div className="flex w-full items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-muted-foreground w-16">Qty:</span>
                                        <Input
                                            type="number"
                                            min="1"
                                            defaultValue="1"
                                            className="h-8"
                                            id={`qty-${card.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        onClick={() => {
                                            const qtyInput = document.getElementById(`qty-${card.id}`) as HTMLInputElement;
                                            const rawQty = qtyInput ? parseInt(qtyInput.value) : 1;
                                            const qty = isNaN(rawQty) ? 1 : rawQty;

                                            const priceInput = document.getElementById(`price-${card.id}`) as HTMLInputElement;
                                            const rawPrice = priceInput ? parseFloat(priceInput.value) : 0;
                                            const price = isNaN(rawPrice) ? 0 : rawPrice;

                                            const costInput = document.getElementById(`cost-${card.id}`) as HTMLInputElement;
                                            const rawCost = costInput ? parseFloat(costInput.value) : 0;
                                            const cost = isNaN(rawCost) ? 0 : rawCost;

                                            handleImport(card, qty, price, cost);
                                        }}
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

            {
                !loading && cards.length === 0 && query && (
                    <div className="text-center text-muted-foreground py-12">No results found.</div>
                )
            }
                </TabsContent>
            </Tabs>
        </div >
    );
}

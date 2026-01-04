'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Loader2, Plus } from "lucide-react"
import Image from 'next/image';
import { useToast } from "@/components/ui/use-toast"

export default function ImportPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleImport = async (card: any) => {
        try {
            // Map Manapool card query to our Product Schema
            // Note: Adjust fields based on actual Manapool API response structure
            const productData = {
                name: card.name,
                description: `Imported from Manapool. Set: ${card.set}`,
                // If Manapool gives 'game' or 'category', map it here. Defaulting to 'Pokemon' for now based on context.
                game: 'Pokemon',
                categoryId: undefined, // Or try to match category by name if possible
                set: card.set,
                images: card.image ? [card.image] : [],
                storeId: 'store-123', // TODO: Dynamic Store ID
                variants: [
                    {
                        condition: 'NM',
                        price: 0, // Default price, user updates later
                        quantity: 0
                    }
                ]
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            if (!res.ok) throw new Error('Failed to import');

            toast({
                title: "Success",
                description: `Imported ${card.name}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create product",
                variant: "destructive",
            });
        }
    };

    const handleSearch = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/integrations/manapool/search?query=${query}`);
            const data = await res.json();
            // Assuming data is an array of cards. Adjust based on actual API response.
            setResults(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error("Search failed", error);
            toast({
                title: "Error",
                description: "Failed to fetch from Manapool",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Import from Manapool</h1>

            <div className="flex gap-4 mb-8">
                <Input
                    placeholder="Search for cards (e.g. Charizard)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="max-w-md"
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {results.map((card: any) => (
                    <Card key={card.id || Math.random()} className="overflow-hidden">
                        <div className="relative aspect-[3/4] w-full">
                            {/* Use a placeholder if no image, or optimize image loading */}
                            <Image
                                src={card.image || card.imageUrl || "/placeholder.svg"}
                                alt={card.name}
                                fill
                                className="object-cover transition-transform hover:scale-105"
                            />
                        </div>
                        <CardContent className="p-3">
                            <h3 className="font-bold truncate" title={card.name}>{card.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{card.set}</p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0">
                            <Button size="sm" className="w-full" variant="secondary" onClick={() => handleImport(card)}>
                                <Plus className="mr-2 h-4 w-4" /> Import
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {!loading && results.length === 0 && query && (
                <div className="text-center text-gray-500 py-12">No results found.</div>
            )}
        </div>
    );
}

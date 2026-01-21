"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Upload, X } from "lucide-react"
import Image from "next/image"
import Cookies from 'js-cookie';

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { VariantManager, Variant } from "./variant-manager"

interface ProductFormProps {
    categories: any[];
    initialData?: any; // If editing
}

export default function ProductForm({ categories, initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialData?.images?.[0] || initialData?.image || "");

    // Card Identity State
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        categoryId: initialData?.categoryId || "",
        game: initialData?.game || "Pokemon",
        set: initialData?.set || "",
        rarity: initialData?.rarity || "",
        collectorNumber: initialData?.collectorNumber || "",
    });

    // Variants State
    // Map initial variants to our UI model if they exist
    const [variants, setVariants] = useState<Variant[]>(
        initialData?.variants?.map((v: any) => ({
            id: v.id,
            condition: v.condition,
            isFoil: v.isFoil,
            price: Number(v.price),
            quantity: Number(v.quantity || v.inventory?.quantity || 0)
        })) || []
    );

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const form = new FormData();
        form.append('file', file);

        try {
            // Clean trailing slash from base URL
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
            const uploadUrl = baseUrl.endsWith('/api') ? `${baseUrl}/uploads` : `${baseUrl}/api/uploads`;

            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: form
            });

            if (res.ok) {
                const data = await res.json();
                // Construct full URL if backend returns relative path
                const fullUrl = data.url.startsWith('http')
                    ? data.url
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${data.url}`;
                setImageUrl(fullUrl);
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            console.error(error);
            alert("Upload error");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (variants.length === 0) {
            alert("Please add at least one variant (e.g. NM Non-Foil).");
            return;
        }

        setLoading(true);

        // Calculate aggregates
        const totalStock = variants.reduce((acc, v) => acc + v.quantity, 0);
        const minPrice = Math.min(...variants.map(v => v.price));

        const payload = {
            name: formData.name,
            description: formData.description,
            game: formData.game,
            categoryId: formData.categoryId,
            set: formData.set,
            rarity: formData.rarity,
            collectorNumber: formData.collectorNumber,
            price: minPrice, // Base display price
            images: imageUrl ? [imageUrl] : [],
            variants: variants.map(v => ({
                id: v.id, // Include ID for updates
                condition: v.condition,
                isFoil: v.isFoil,
                price: v.price,
                quantity: v.quantity
            }))
        };

        try {
            // Clean trailing slash from base URL
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

            const url = initialData?.id
                ? `${apiUrl}/products/${initialData.id}`
                : `${apiUrl}/products`;

            const method = initialData?.id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('tcg-auth-token')}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/products');
                router.refresh();
            } else {
                const err = await res.json();
                alert(`Failed to create product: ${err.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error creating product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max gap-4 lg:col-span-2 lg:gap-8">
                {/* 1. Card Identity Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Card Identity</CardTitle>
                        <CardDescription>
                            Static details about the card itself (Set, Rarity, Number).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Card Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Charizard ex"
                                    type="text"
                                    className="w-full"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="set">Set Name</Label>
                                    <Input
                                        id="set"
                                        placeholder="e.g. Obsidian Flames"
                                        type="text"
                                        value={formData.set}
                                        onChange={e => setFormData({ ...formData, set: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="number">Card Number</Label>
                                    <Input
                                        id="number"
                                        placeholder="e.g. 125/197"
                                        type="text"
                                        value={formData.collectorNumber}
                                        onChange={e => setFormData({ ...formData, collectorNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="rarity">Rarity</Label>
                                    <Input
                                        id="rarity"
                                        placeholder="e.g. Illustration Rare"
                                        type="text"
                                        value={formData.rarity}
                                        onChange={e => setFormData({ ...formData, rarity: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="game">Game</Label>
                                    <Select
                                        value={formData.game}
                                        onValueChange={(val) => setFormData({ ...formData, game: val })}
                                    >
                                        <SelectTrigger id="game">
                                            <SelectValue placeholder="Select Game" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pokemon">Pokemon</SelectItem>
                                            <SelectItem value="MTG">Magic: The Gathering</SelectItem>
                                            <SelectItem value="YuGiOh">Yu-Gi-Oh!</SelectItem>
                                            <SelectItem value="Lorcana">Lorcana</SelectItem>
                                            <SelectItem value="OnePiece">One Piece</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    className="min-h-20"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Inventory Matrix */}
                <VariantManager variants={variants} onChange={setVariants} />

                {/* 3. Category (Hidden/Auto or Explicit) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Organization</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <Label htmlFor="category">Store Category</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(val) => {
                                    setFormData({ ...formData, categoryId: val })
                                }}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Images & Actions */}
            <div className="grid auto-rows-max gap-4">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Card Image</CardTitle>
                        <CardDescription>
                            Upload the main card image.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {imageUrl ? (
                                <div className="relative aspect-[2/3] w-full rounded-md object-cover bg-gray-100">
                                    <Image
                                        alt="Product image"
                                        className="aspect-[2/3] w-full rounded-md object-contain"
                                        height="400"
                                        src={imageUrl}
                                        width="300"
                                        style={{ objectFit: 'contain' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md border border-dashed text-gray-400">
                                    <div className="text-center">
                                        <Upload className="h-8 w-8 mx-auto mb-2" />
                                        <span className="text-sm">Upload Card</span>
                                    </div>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="image-upload" className="cursor-pointer bg-black text-white py-2 px-4 rounded text-center hover:bg-gray-800 transition-all">
                                    {loading ? "Uploading..." : "Choose Image"}
                                </Label>
                                <Input
                                    id="image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUpload}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" type="button" onClick={() => router.back()}>
                        Discard
                    </Button>
                    <Button size="sm" type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Card"}
                    </Button>
                </div>
            </div>
        </form>
    )
}

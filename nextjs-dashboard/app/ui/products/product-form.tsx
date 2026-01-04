"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Upload, X } from "lucide-react"
import Image from "next/image"

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
import { Badge } from "@/components/ui/badge"

interface ProductFormProps {
    categories: any[];
    initialData?: any; // If editing
}

export default function ProductForm({ categories, initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState(initialData?.image || "");
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        description: initialData?.description || "",
        price: initialData?.price || "",
        stock: initialData?.inventory?.quantity || 0,
        categoryId: initialData?.categoryId || "",
        game: initialData?.game || "Pokemon Cards", // Default/Fallback
        status: initialData?.status || "active",
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const form = new FormData();
        form.append('file', file);

        try {
            // Retrieve API URL from env or use default localhost if undefined (for client side usually env needs NEXT_PUBLIC)
            // But we are in Dashboard which is Next.js too.
            const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads`;
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
        setLoading(true);

        const payload = {
            name: formData.name,
            description: formData.description,
            game: formData.game, // Using legacy game field too
            categoryId: formData.categoryId,
            images: imageUrl ? [imageUrl] : [],
            variants: [
                {
                    condition: "NM", // Default
                    price: Number(formData.price),
                    quantity: Number(formData.stock)
                }
            ]
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer ...' // Add auth if needed later
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/products');
                router.refresh(); // Refresh server data
            } else {
                alert("Failed to create product");
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
                <Card>
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                        <CardDescription>
                            Enter the basic information for your product.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    className="w-full"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    className="min-h-32"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Stock & Pricing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="grid gap-3">
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="stock">Stock Quantity</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    required
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(val) => {
                                        // Also update 'game' fallback name if possible, or just id
                                        const cat = categories.find(c => c.id === val);
                                        setFormData({ ...formData, categoryId: val, game: cat ? cat.name : formData.game })
                                    }}
                                >
                                    <SelectTrigger id="category" aria-label="Select category">
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
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid auto-rows-max gap-4">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Product Images</CardTitle>
                        <CardDescription>
                            Upload an image for the product.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {imageUrl ? (
                                <div className="relative aspect-square w-full rounded-md object-cover bg-gray-100">
                                    <Image
                                        alt="Product image"
                                        className="aspect-square w-full rounded-md object-cover"
                                        height="300"
                                        src={imageUrl}
                                        width="300"
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
                                <div className="flex aspect-square w-full items-center justify-center rounded-md border border-dashed text-gray-400">
                                    <Upload className="h-8 w-8" />
                                    <span className="sr-only">Upload</span>
                                    {/* Hidden Input triggered by label or overlay? 
                                        For simplicity let's put an input here */}
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="image-upload" className="cursor-pointer bg-black text-white py-2 px-4 rounded text-center hover:bg-gray-800">
                                    {loading ? "Uploading..." : "Upload Image"}
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
                        {loading ? "Saving..." : "Save Product"}
                    </Button>
                </div>
            </div>
        </form>
    )
}

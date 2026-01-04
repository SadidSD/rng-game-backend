"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CreateCategoryForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const form = new FormData();
        form.append('file', file);

        try {
            const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads`;
            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: form
            });

            if (res.ok) {
                const data = await res.json();
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
            slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
            description: formData.description,
            image: imageUrl,
        };

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/categories');
                router.refresh();
            } else {
                alert("Failed to create category");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="grid auto-rows-max gap-4 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                    <CardDescription>
                        Create a new category for your products.
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
                            <Label htmlFor="slug">Slug (Optional)</Label>
                            <Input
                                id="slug"
                                type="text"
                                className="w-full"
                                placeholder="Auto-generated if empty"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                className="min-h-32"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Category Image</Label>
                            {imageUrl ? (
                                <div className="relative aspect-video w-full rounded-md object-cover bg-gray-100 overflow-hidden">
                                    <Image
                                        alt="Category image"
                                        className="object-cover"
                                        fill
                                        src={imageUrl}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed text-gray-400">
                                    <Upload className="h-8 w-8" />
                                    <span className="sr-only">Upload</span>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="cat-image-upload" className="cursor-pointer bg-black text-white py-2 px-4 rounded text-center hover:bg-gray-800">
                                    {loading ? "Uploading..." : "Upload Image"}
                                </Label>
                                <Input
                                    id="cat-image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUpload}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-between border-t p-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Category"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}

'use client';

import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Cookies from 'js-cookie';

export function ProductActions({ product }: { product: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        setLoading(true);
        try {
            const token = Cookies.get('tcg-auth-token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('Failed to delete product');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-haspopup="true"
                    size="icon"
                    variant="ghost"
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/products/${product.id}/edit`)}>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500 font-medium">
                    {loading ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import Cookies from 'js-cookie';

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function ProductActions({ product }: { product: any }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);

    const isLoading = isDeleting || isPending;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const token = Cookies.get('tcg-auth-token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                startTransition(() => {
                    router.refresh();
                    setDialogOpen(false);
                });
            } else {
                alert('Failed to delete product. Please try again.');
                setIsDeleting(false);
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting product');
            setIsDeleting(false);
        }
    };

    return (
        <>
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
                    <DropdownMenuItem onClick={() => router.push(`/products/${product.id}`)}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => setDialogOpen(true)} 
                        className="text-red-500 font-medium focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={dialogOpen} onOpenChange={(open) => !isLoading && setDialogOpen(open)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Delete Product
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-muted-foreground">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{product.name}"</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 flex gap-2 justify-end">
                        <Button 
                            variant="outline" 
                            onClick={() => setDialogOpen(false)} 
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete} 
                            disabled={isLoading}
                            className="min-w-[110px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

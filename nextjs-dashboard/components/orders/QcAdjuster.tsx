"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Minus, X, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface OrderItem {
    id: string;
    productName: string;
    variantSku: string | null;
    quantity: number;
    price: string;
    variantId: string | null;
}

interface QcAdjusterProps {
    orderId: string;
    items: OrderItem[];
    orderStatus: string;
}

export default function QcAdjuster({ orderId, items, orderStatus }: QcAdjusterProps) {
    const router = useRouter();
    const [qcModalOpen, setQcModalOpen] = useState(false);
    const [editItems, setEditItems] = useState<{ variantId: string; productName: string; sku: string; price: number; quantity: number }[]>([]);
    const [qcUpdating, setQcUpdating] = useState(false);

    // Initialize items when modal opens
    const openQcModal = () => {
        const mapped = items
            .map(item => ({
                variantId: item.variantId || "",
                productName: item.productName,
                sku: item.variantSku || "N/A",
                price: Number(item.price),
                quantity: item.quantity
            }))
            .filter(item => item.variantId !== "");
        setEditItems(mapped);
        setQcModalOpen(true);
    };

    const handleQtyChange = (variantId: string, diff: number) => {
        setEditItems(prev =>
            prev.map(item => {
                if (item.variantId === variantId) {
                    const newQty = Math.max(0, item.quantity + diff);
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const handleRemoveItem = (variantId: string) => {
        setEditItems(prev => prev.filter(item => item.variantId !== variantId));
    };

    const saveQcAdjustments = async () => {
        setQcUpdating(true);
        try {
            const token = Cookies.get("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rng-game-backend-cx6f.onrender.com/api';
            
            const formattedItems = editItems
                .filter(item => item.quantity > 0)
                .map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                }));

            await axios.patch(
                `${apiUrl}/orders/${orderId}/items`,
                { items: formattedItems },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setQcModalOpen(false);
            router.refresh();
            alert("QC order items adjustments successfully saved and synchronized!");
        } catch (error: any) {
            console.error("QC save failed:", error);
            alert(error.response?.data?.message || "Failed to save adjustments.");
        } finally {
            setQcUpdating(false);
        }
    };

    const qcTotal = editItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Only allow adjustments for non-fulfilled / active orders
    if (!["PENDING", "PAID"].includes(orderStatus.toUpperCase())) {
        return null;
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={openQcModal}
                className="border-purple-500/30 bg-purple-950/10 hover:bg-purple-900/20 text-purple-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
                <Edit className="h-3.5 w-3.5" />
                <span>QC Adjust Items</span>
            </Button>

            {qcModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto text-white">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Edit className="text-purple-400" size={20} />
                                    <span>QC Quantity & Grade Adjustments</span>
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Modify quantities, remove damaged cards, and re-compute order totals. Inventory counts will be updated.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setQcModalOpen(false)}
                                className="h-9 w-9 p-0 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Items list */}
                        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
                            {editItems.length === 0 ? (
                                <div className="py-10 text-center text-zinc-500 text-sm">
                                    No modifiable items found.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {editItems.map((item) => (
                                        <div 
                                            key={item.variantId} 
                                            className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-900/60 rounded-xl border border-zinc-800/80 gap-4 transition-all
                                                ${item.quantity === 0 ? "opacity-40 bg-rose-950/5 border-rose-500/10" : ""}
                                            `}
                                        >
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-semibold text-white">{item.productName}</p>
                                                <p className="text-[10px] font-mono text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                                                <p className="text-xs text-purple-400 font-bold mt-1">${item.price.toFixed(2)}</p>
                                            </div>

                                            {/* Count Adjustment controls */}
                                            <div className="flex items-center gap-4 justify-between md:justify-end">
                                                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-9">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQtyChange(item.variantId, -1)}
                                                        className="w-9 h-full hover:bg-white/5 flex items-center justify-center text-zinc-400 transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-12 text-center text-sm font-bold text-white">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQtyChange(item.variantId, 1)}
                                                        className="w-9 h-full hover:bg-white/5 flex items-center justify-center text-zinc-400 transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleRemoveItem(item.variantId)}
                                                    className="h-9 w-9 bg-rose-950/30 hover:bg-rose-600 text-rose-450 hover:text-white border border-rose-900/30 transition-colors"
                                                    title="Remove Item"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer / Total summary */}
                        <div className="p-6 border-t border-zinc-800/80 bg-zinc-900/20 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-center md:text-left">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Adjusted Total</span>
                                <span className="text-xl font-black text-purple-400 mt-1 block">${qcTotal.toFixed(2)}</span>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setQcModalOpen(false)}
                                    className="flex-1 md:flex-none border-zinc-800 hover:bg-zinc-900 text-zinc-400"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={saveQcAdjustments}
                                    disabled={qcUpdating}
                                    className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/20"
                                >
                                    {qcUpdating ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={14} />
                                    )}
                                    <span>Save QC Adjustments</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Download, Printer, X, Loader2, CheckSquare } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import Cookies from "js-cookie";
import { format } from "date-fns";

interface Order {
    id: string;
    customer: { firstName: string; lastName: string; email: string };
    items: any[];
    total: number;
    status: string;
    createdAt: string;
}

function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
        case "completed": return "default";
        case "shipped": return "secondary";
        case "processing": return "outline";
        case "pending": return "destructive";
        default: return "outline";
    }
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Batch Action & Pull List States
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [pullListOpen, setPullListOpen] = useState(false);
    const [pullListItems, setPullListItems] = useState<any[]>([]);
    const [pullListLoading, setPullListLoading] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = Cookies.get('tcg-auth-token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rng-game-backend-cx6f.onrender.com/api';
                const res = await axios.get(`${apiUrl}/orders`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrders(res.data);
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getFilteredOrders = (status: string) => {
        let result = orders;
        if (status !== 'all') {
            result = result.filter(o => o.status.toLowerCase() === status.toLowerCase());
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(o => 
                o.id.toLowerCase().includes(term) || 
                (o.customer?.firstName && o.customer.firstName.toLowerCase().includes(term)) ||
                (o.customer?.lastName && o.customer.lastName.toLowerCase().includes(term)) ||
                (o.customer?.email && o.customer.email.toLowerCase().includes(term))
            );
        }
        return result;
    };

    const currentTabOrders = getFilteredOrders(activeTab);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(currentTabOrders.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(rowId => rowId !== id));
        }
    };

    const generatePullList = async () => {
        if (selectedIds.length === 0) return;
        setPullListLoading(true);
        setPullListOpen(true);
        try {
            const token = Cookies.get("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rng-game-backend-cx6f.onrender.com/api';
            const res = await axios.get(
                `${apiUrl}/orders/pull-list?ids=${selectedIds.join(",")}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPullListItems(res.data);
        } catch (error) {
            console.error("Failed to generate pull list:", error);
            alert("Failed to generate pull list.");
            setPullListOpen(false);
        } finally {
            setPullListLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 print:hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage and track your store orders
                    </p>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="text-purple-400 h-5 w-5" />
                        <span className="text-sm font-semibold text-purple-200">{selectedIds.length} orders selected</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={generatePullList}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-500/20"
                        >
                            <Printer className="h-4 w-4" />
                            <span>Generate Pull List</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedIds([])}
                            className="border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={(val) => {
                setActiveTab(val);
                setSelectedIds([]);
            }} className="w-full">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="all">All Orders</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="processing">Processing</TabsTrigger>
                        <TabsTrigger value="shipped">Shipped</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[300px]"
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {['all', 'pending', 'processing', 'shipped', 'completed'].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{tab.charAt(0).toUpperCase() + tab.slice(1)} Orders</CardTitle>
                                <CardDescription>
                                    View and manage {tab} customer orders
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">
                                                <Checkbox
                                                    checked={currentTabOrders.length > 0 && selectedIds.length === currentTabOrders.length}
                                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                                />
                                            </TableHead>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-24">Loading...</TableCell>
                                            </TableRow>
                                        ) : currentTabOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-24">No orders found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            currentTabOrders.map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedIds.includes(order.id)}
                                                            onCheckedChange={(checked) => handleSelectRow(order.id, !!checked)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-mono font-medium">
                                                        <Link href={`/orders/${order.id}`} className="hover:underline text-purple-400">
                                                            {order.id.slice(0, 8).toUpperCase()}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.customer?.firstName} {order.customer?.lastName}
                                                        <div className="text-xs text-muted-foreground">{order.customer?.email}</div>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={order.items?.map(i => `${i.productName} (${i.quantity})`).join(', ')}>
                                                        {order.items?.map(i => `${i.productName} (x${i.quantity})`).join(', ') || 'No Items'}
                                                    </TableCell>
                                                    <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusColor(order.status)}>
                                                            {order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/orders/${order.id}`}>View</Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Pull List Overlay (Printable Modal) */}
            {pullListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto print:fixed print:inset-0 print:p-0 print:bg-white print:backdrop-blur-none">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col backdrop-blur-md shadow-2xl overflow-hidden print:border-none print:bg-white print:max-h-none print:shadow-none print:w-full text-white print:text-black">
                        {/* Header */}
                        <div className="p-6 border-b border-neutral-850 flex items-center justify-between print:hidden">
                            <div>
                                <h3 className="text-lg font-bold">Batch Pull List (Pick List)</h3>
                                <p className="text-xs text-neutral-400 mt-1">Aggregated and sorted for inventory box retrieval.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.print()}
                                    className="bg-white hover:bg-neutral-200 text-black font-bold flex items-center gap-1.5"
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Print List</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPullListOpen(false)}
                                    className="h-9 w-9 p-0 border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Printable Content */}
                        <div className="p-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible print:text-black">
                            {pullListLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-3" />
                                    <span>Aggregating pull list data...</span>
                                </div>
                            ) : pullListItems.length === 0 ? (
                                <div className="py-20 text-center text-neutral-500">
                                    No cards to pull.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Print Title Header */}
                                    <div className="hidden print:block mb-6 border-b border-neutral-350 pb-3">
                                        <h1 className="text-xl font-bold tracking-wider text-black">RNG GAMEZ — COMBINED PULL LIST</h1>
                                        <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1">
                                            <span>Generated: {new Date().toLocaleString()}</span>
                                            <span>Orders Included: {selectedIds.length}</span>
                                        </div>
                                    </div>

                                    <div className="border border-neutral-800 print:border-black rounded-xl overflow-hidden print:rounded-none">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-950 text-neutral-450 uppercase tracking-wider font-bold text-[10px] border-b border-neutral-800 print:bg-neutral-100 print:text-black print:border-black">
                                                    <th className="py-3 px-4">Game</th>
                                                    <th className="py-3 px-4">Set Name</th>
                                                    <th className="py-3 px-4">Card Name</th>
                                                    <th className="py-3 px-4 text-center">Cond / Foil</th>
                                                    <th className="py-3 px-4 text-center">SKU</th>
                                                    <th className="py-3 px-4 text-center">Box Location</th>
                                                    <th className="py-3 px-4 text-right">Pull Qty</th>
                                                    <th className="py-3 px-4 text-center print:table-cell hidden w-16">Pulled</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-800 print:divide-neutral-300 text-neutral-300 print:text-black">
                                                {pullListItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-white/[0.01] print:bg-white print:border-b print:border-neutral-200">
                                                        <td className="py-3 px-4 font-bold text-white print:text-black uppercase">{item.game}</td>
                                                        <td className="py-3 px-4 font-medium text-neutral-300 print:text-black">{item.set}</td>
                                                        <td className="py-3 px-4 font-semibold text-white print:text-black">{item.productName}</td>
                                                        <td className="py-3 px-4 text-center font-medium">
                                                            <span className="text-purple-300 print:text-black">{item.condition}</span>
                                                            {item.isFoil && <span className="ml-1 text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1 py-0.5 rounded print:border print:border-black print:text-black">FOIL</span>}
                                                        </td>
                                                        <td className="py-3 px-4 text-center font-mono text-[10px] text-neutral-500 print:text-black">{item.sku}</td>
                                                        <td className="py-3 px-4 text-center text-emerald-400 print:text-black font-semibold">{item.location}</td>
                                                        <td className="py-3 px-4 text-right font-black text-white print:text-black text-sm">{item.quantity}</td>
                                                        <td className="py-3 px-4 text-center print:table-cell hidden">
                                                            <div className="w-4 h-4 border border-black rounded mx-auto" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-neutral-400 print:text-black pt-4">
                                        <span>Items pulled match sorting box structure Game → Set → Card Name → Condition → Foil.</span>
                                        <span className="font-bold text-white print:text-black">
                                            Total Cards: {pullListItems.reduce((acc, item) => acc + item.quantity, 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

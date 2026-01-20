"use client";

import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import Cookies from "js-cookie"
import { format } from "date-fns"

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
        case "completed": return "default"
        case "shipped": return "secondary"
        case "processing": return "outline"
        case "pending": return "destructive"
        default: return "outline"
    }
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = Cookies.get('tcg-auth-token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rng-game-backend.onrender.com/api';
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

    const filteredOrders = (status: string) => {
        if (status === 'all') return orders;
        return orders.filter(o => o.status.toLowerCase() === status);
    };

    return (
        <div className="flex flex-col gap-4">
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

            <Tabs defaultValue="all" className="w-full">
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
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Items</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
                                            </TableRow>
                                        ) : filteredOrders(tab).length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24">No orders found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredOrders(tab).map((order) => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">
                                                        <Link href={`/orders/${order.id}`} className="hover:underline">
                                                            {order.id.slice(0, 8).toUpperCase()}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.customer?.firstName} {order.customer?.lastName}
                                                        <div className="text-xs text-muted-foreground">{order.customer?.email}</div>
                                                    </TableCell>
                                                    <TableCell>{order.items?.length || 0}</TableCell>
                                                    <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusColor(order.status)}>
                                                            {order.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell>
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
        </div>
    )
}

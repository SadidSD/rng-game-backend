'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Search, CheckCircle, XCircle, Clock, DollarSign, Package } from "lucide-react"

interface BuylistOffer {
    id: string;
    customerName: string;
    customerEmail: string;
    totalCash: number;
    totalCredit: number;
    status: string;
    items: any[];
    createdAt: string;
}

export default function BuylistPage() {
    const [offers, setOffers] = useState<BuylistOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchOffers = async () => {
        try {
            const res = await axios.get(`${API_URL}/buylist/offers`, {
                headers: { 'x-api-key': 'tcg-frontend-secret-key' } // Or auth token
            });
            setOffers(res.data);
        } catch (error) {
            console.error("Failed to fetch offers:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await axios.patch(`${API_URL}/buylist/offers/${id}/status`, { status });
            // Refresh
            fetchOffers();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary';
            case 'APPROVED_TO_SEND': return 'default'; // Blue/Black
            case 'RECEIVED': return 'outline'; // Yellow/Orange ideally
            case 'COMPLETED': return 'default'; // Green ideally
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    };

    const filteredOffers = offers.filter(o =>
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Buylist Management</h1>
                    <p className="text-muted-foreground">
                        Review customer sell orders and issue store credit.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchOffers}>
                    Refresh
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {offers.filter(o => o.status === 'PENDING').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Incoming (Approved)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {offers.filter(o => o.status === 'APPROVED_TO_SEND').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Ready to Grade</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {offers.filter(o => o.status === 'RECEIVED').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Offers</CardTitle>
                        <div className="relative w-[300px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or ID..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Credit Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : filteredOffers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">No offers found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredOffers.map((offer) => (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-mono text-xs">{offer.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{offer.customerName}</div>
                                            <div className="text-xs text-muted-foreground">{offer.customerEmail}</div>
                                        </TableCell>
                                        <TableCell>{offer.items?.length || 0} cards</TableCell>
                                        <TableCell className="font-bold text-purple-600">
                                            ${Number(offer.totalCredit).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(offer.status)}>{offer.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(offer.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {offer.status === 'PENDING' && (
                                                    <>
                                                        <Button size="sm" onClick={() => updateStatus(offer.id, 'APPROVED_TO_SEND')}>
                                                            <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => updateStatus(offer.id, 'REJECTED')}>
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {offer.status === 'APPROVED_TO_SEND' && (
                                                    <Button size="sm" variant="secondary" onClick={() => updateStatus(offer.id, 'RECEIVED')}>
                                                        <Package className="w-4 h-4 mr-1" /> Mark Received
                                                    </Button>
                                                )}
                                                {offer.status === 'RECEIVED' && (
                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => updateStatus(offer.id, 'COMPLETED')}>
                                                        <DollarSign className="w-4 h-4 mr-1" /> Finalize & Pay
                                                    </Button>
                                                )}
                                                {offer.status === 'COMPLETED' && (
                                                    <span className="text-xs text-green-600 font-medium flex items-center">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Paid
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

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
import { Search, CheckCircle, XCircle, Clock, DollarSign, Package, Image as ImageIcon } from "lucide-react"

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

import Cookies from 'js-cookie';

// ... 

export default function BuylistPage() {
    const [offers, setOffers] = useState<BuylistOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingImages, setViewingImages] = useState<{ id: string, base64: string }[] | null>(null);
    const [viewingItems, setViewingItems] = useState<any[] | null>(null);
    const [isFetchingImages, setIsFetchingImages] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const fetchOffers = async () => {
        try {
            const token = Cookies.get('tcg-auth-token');
            if (!token) {
                console.error("No auth token found");
                return;
            }

            const res = await axios.get(`${API_URL}/buylist/offers`, {
                headers: { Authorization: `Bearer ${token}` }
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
            const token = Cookies.get('tcg-auth-token');
            await axios.patch(`${API_URL}/buylist/offers/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh
            fetchOffers();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        }
    };

    const handleViewImages = async (offerId: string) => {
        setIsFetchingImages(true);
        try {
            const token = Cookies.get('tcg-auth-token');
            const res = await axios.get(`${API_URL}/buylist/offers/${offerId}/images`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setViewingImages(res.data);
        } catch (e) {
            console.error(e);
            alert("Failed to load images");
        } finally {
            setIsFetchingImages(false);
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
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => setViewingItems(offer.items)} className="underline hover:bg-transparent p-0 h-auto font-medium text-purple-600 hover:text-purple-800">
                                                {offer.items?.length || 0} cards
                                            </Button>
                                        </TableCell>
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
                                                <Button size="sm" variant="outline" onClick={() => handleViewImages(offer.id)}>
                                                    <ImageIcon className="w-4 h-4 mr-1" /> Images
                                                </Button>
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

            {/* Items Viewer Modal */}
            {viewingItems && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-2xl bg-white rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold">Offer Items</h3>
                            <Button variant="ghost" size="sm" onClick={() => setViewingItems(null)}>Close</Button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {(!viewingItems || viewingItems.length === 0) ? (
                                <p className="text-center text-muted-foreground py-10">No items found.</p>
                            ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Card Name</TableHead>
                                      <TableHead>Condition</TableHead>
                                      <TableHead>Foil</TableHead>
                                      <TableHead>Qty</TableHead>
                                      <TableHead>Price</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {viewingItems.map((item, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.cardName}</TableCell>
                                        <TableCell><Badge variant="outline">{item.condition}</Badge></TableCell>
                                        <TableCell>{item.isFoil ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="font-bold text-green-600">${Number(item.offerPrice).toFixed(2)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {viewingImages && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-white rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold">Customer Images</h3>
                            <Button variant="ghost" size="sm" onClick={() => setViewingImages(null)}>Close</Button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-6">
                            {viewingImages.length === 0 ? (
                                <p className="text-center text-muted-foreground py-10">No images were attached to this offer.</p>
                            ) : (
                                viewingImages.map((img, i) => (
                                    <div key={img.id} className="border p-2 rounded-lg bg-gray-50">
                                        <p className="text-sm text-gray-500 mb-2 font-medium">Image {i + 1}</p>
                                        <img src={img.base64} alt="Buylist Item" className="w-full max-w-2xl mx-auto rounded border shadow-sm" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

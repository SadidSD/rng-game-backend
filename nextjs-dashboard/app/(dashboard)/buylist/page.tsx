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
import { Search, CheckCircle, XCircle, Clock, DollarSign, Package, Image as ImageIcon, Eye } from "lucide-react"

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

    // Pricing Rules State
    const [rules, setRules] = useState<any[]>([]);
    const [rulesLoading, setRulesLoading] = useState(true);
    const [newRule, setNewRule] = useState({ game: 'Pokemon', set: '', rarity: '', buyPercentage: 65 });

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

    const fetchRules = async () => {
        try {
            const token = Cookies.get('tcg-auth-token');
            if (!token) return;
            const res = await axios.get(`${API_URL}/buylist/rules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRules(res.data);
        } catch (error) {
            console.error("Failed to fetch rules:", error);
        } finally {
            setRulesLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = Cookies.get('tcg-auth-token');
            await axios.patch(`${API_URL}/buylist/offers/${id}`, { status }, {
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

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = Cookies.get('tcg-auth-token');
            await axios.post(`${API_URL}/buylist/rules`, {
                game: newRule.game,
                set: newRule.set || undefined,
                rarity: newRule.rarity || undefined,
                buyPercentage: Number(newRule.buyPercentage)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewRule({ game: 'Pokemon', set: '', rarity: '', buyPercentage: 65 });
            fetchRules();
        } catch (error) {
            console.error("Failed to add rule:", error);
            alert("Failed to add rule");
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this pricing rule?")) return;
        try {
            const token = Cookies.get('tcg-auth-token');
            await axios.delete(`${API_URL}/buylist/rules/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRules();
        } catch (error) {
            console.error("Failed to delete rule:", error);
            alert("Failed to delete rule");
        }
    };

    useEffect(() => {
        fetchOffers();
        fetchRules();
    }, []);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary';
            case 'APPROVED_TO_SEND': return 'default'; // Blue/Black
            case 'RECEIVED': return 'outline'; // Yellow/Orange
            case 'APPROVED': return 'secondary'; // Graded & Recieved
            case 'COMPLETED': return 'default'; // Paid/Finished
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    };

    const filteredOffers = offers.filter(o =>
        o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Buylist Management</h1>
                    <p className="text-muted-foreground text-sm">
                        Review customer sell orders and issue store credit.
                    </p>
                </div>
                <Button variant="outline" onClick={fetchOffers} className="self-start sm:self-auto">
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="offers" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="offers">Offers</TabsTrigger>
                    <TabsTrigger value="rules">Pricing Rules</TabsTrigger>
                </TabsList>

                <TabsContent value="offers" className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Approved (Unpaid)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {offers.filter(o => o.status === 'APPROVED').length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <CardTitle>Offers</CardTitle>
                                <div className="relative w-full sm:w-[300px]">
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
                            <div className="overflow-x-auto">
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
                                                <TableCell>{offer.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} cards</TableCell>
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
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Button size="sm" variant="outline" onClick={() => setViewingItems(offer.items)}>
                                                            <Eye className="w-4 h-4 mr-1" /> View Cards
                                                        </Button>
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
                                                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => updateStatus(offer.id, 'APPROVED')}>
                                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve & Add to Inventory
                                                            </Button>
                                                        )}
                                                        {offer.status === 'APPROVED' && (
                                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatus(offer.id, 'COMPLETED')}>
                                                                <DollarSign className="w-4 h-4 mr-1" /> Disburse Store Credit
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
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="space-y-6">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Active Pricing Rules</CardTitle>
                                <CardDescription>
                                    Configured payout percentages. The system uses these to price cards dynamically.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Game</TableHead>
                                            <TableHead>Set</TableHead>
                                            <TableHead>Rarity</TableHead>
                                            <TableHead>Buy %</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rulesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">Loading rules...</TableCell>
                                            </TableRow>
                                        ) : rules.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8">No pricing rules configured.</TableCell>
                                            </TableRow>
                                        ) : (
                                            rules.map((rule) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-semibold">{rule.game}</TableCell>
                                                    <TableCell>{rule.set || 'Any Set'}</TableCell>
                                                    <TableCell>{rule.rarity || 'Any Rarity'}</TableCell>
                                                    <TableCell className="font-bold text-purple-600">
                                                        {rule.buyPercentage}%
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteRule(rule.id)}>
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Create Pricing Rule</CardTitle>
                                <CardDescription>Define a new card pricing rule.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleAddRule} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Game</label>
                                        <select 
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={newRule.game}
                                            onChange={(e) => setNewRule({ ...newRule, game: e.target.value })}
                                        >
                                            <option value="Pokemon">Pokemon</option>
                                            <option value="MTG">Magic: The Gathering</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Set (Optional)</label>
                                        <Input
                                            placeholder="e.g. Base Set, Alpha Edition"
                                            value={newRule.set}
                                            onChange={(e) => setNewRule({ ...newRule, set: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Rarity (Optional)</label>
                                        <Input
                                            placeholder="e.g. Rare, Common, Holographic"
                                            value={newRule.rarity}
                                            onChange={(e) => setNewRule({ ...newRule, rarity: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Buy Percentage (%)</label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            required
                                            placeholder="65"
                                            value={newRule.buyPercentage}
                                            onChange={(e) => setNewRule({ ...newRule, buyPercentage: Number(e.target.value) })}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            The cash buy price will be calculated as this % of retail. Store credit will get an additional 30% bonus.
                                        </p>
                                    </div>
                                    <Button type="submit" className="w-full">
                                        Create Rule
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

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
                                <div className="flex flex-col gap-4">
                                    {viewingItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-xl border bg-gray-50/50 items-center hover:bg-white transition-colors">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.cardName} className="w-16 h-[88px] object-cover rounded-md shadow-sm bg-white border" />
                                            ) : (
                                                <div className="w-16 h-[88px] bg-gray-100 border border-gray-200 rounded-md shadow-sm flex items-center justify-center text-xs text-gray-400 text-center p-1">No Image</div>
                                            )}
                                            <div className="flex-1 flex flex-col gap-1">
                                                <h4 className="font-bold text-gray-900 text-base">{item.cardName}</h4>
                                                {item.setName && <p className="text-sm text-gray-500">{item.setName}</p>}
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="bg-white">{item.condition}</Badge>
                                                    {item.isFoil && <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0">Foil</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-right min-w-[80px]">
                                                <div className="text-sm text-gray-500 font-medium">Qty: {item.quantity}</div>
                                                <div className="font-bold text-lg text-purple-600">${Number(item.offerPrice).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

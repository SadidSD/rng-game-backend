"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, DollarSign, Users, Award, 
    ArrowUpRight, TrendingUp, TrendingDown,
    Percent, CreditCard, Scale
} from "lucide-react";
import { 
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart, Pie, Legend
} from "recharts";
import axios from "axios";
import Cookies from "js-cookie";
import { format, subDays } from "date-fns";

interface TopProduct {
    name: string;
    sku: string;
    qty: number;
    revenue: number;
}

interface TopCustomer {
    id: string;
    name: string;
    email: string;
    ordersCount: number;
    lifetimeSpend: number;
}

interface AnalyticsStats {
    gameSales: { name: string; value: number }[];
    categorySales: { name: string; value: number }[];
    topProducts: TopProduct[];
    inventoryValuation: {
        retailValue: number;
        costBasis: number;
        grossMargin: number;
    };
    customerMetrics: {
        totalStoreCredit: number;
        repeatCustomerRate: number;
        customerLeaderboard: TopCustomer[];
    };
    buylistMetrics: {
        totalCashPayout: number;
        totalCreditPayout: number;
        totalPayout: number;
    };
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Date range filters
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [tempDates, setTempDates] = useState({ start: startDate, end: endDate });

    const fetchAdvancedStats = async (start: string, end: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get("tcg-auth-token");
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://rng-game-backend-cx6f.onrender.com/api').replace(/\/$/, '');
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

            const res = await axios.get(`${apiUrl}/analytics/advanced`, {
                params: { startDate: start, endDate: end },
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err: any) {
            console.error("Failed to fetch advanced stats", err);
            setError(err.response?.data?.message || "Failed to load advanced analytics statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvancedStats(startDate, endDate);
    }, [startDate, endDate]);

    const handleApplyFilters = () => {
        setStartDate(tempDates.start);
        setEndDate(tempDates.end);
    };

    const handleQuickFilter = (days: number) => {
        const start = format(subDays(new Date(), days), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        setStartDate(start);
        setEndDate(end);
        setTempDates({ start, end });
    };

    if (loading && !stats) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="text-sm text-muted-foreground">Generating advanced analytics report...</span>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-destructive/10 border-destructive/20 max-w-lg mx-auto mt-20">
                <p className="text-red-500 font-semibold mb-2">Error loading analytics</p>
                <p className="text-xs">{error}</p>
                <Button className="mt-4" onClick={() => fetchAdvancedStats(startDate, endDate)}>
                    Try Again
                </Button>
            </div>
        );
    }

    // Format buylist payout data for pie chart
    const buylistPieData = stats ? [
        { name: "Cash Payouts", value: stats.buylistMetrics.totalCashPayout },
        { name: "Store Credit Payouts", value: stats.buylistMetrics.totalCreditPayout }
    ].filter(d => d.value > 0) : [];

    return (
        <div className="flex flex-col gap-6">
            {/* Header and Date Selection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
                    <p className="text-muted-foreground">Analyze your sales, inventory margin, repeat customers, and buylist intake.</p>
                </div>
                
                {/* Date Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleQuickFilter(7)}>7D</Button>
                    <Button variant="outline" size="sm" onClick={() => handleQuickFilter(30)}>30D</Button>
                    <Button variant="outline" size="sm" onClick={() => handleQuickFilter(90)}>90D</Button>
                    <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-background text-sm">
                        <Input 
                            type="date" 
                            className="border-none p-0 h-6 focus-visible:ring-0 text-xs w-[110px]" 
                            value={tempDates.start}
                            onChange={(e) => setTempDates({ ...tempDates, start: e.target.value })}
                        />
                        <span className="text-muted-foreground text-xs">to</span>
                        <Input 
                            type="date" 
                            className="border-none p-0 h-6 focus-visible:ring-0 text-xs w-[110px]" 
                            value={tempDates.end}
                            onChange={(e) => setTempDates({ ...tempDates, end: e.target.value })}
                        />
                    </div>
                    <Button size="sm" onClick={handleApplyFilters} disabled={loading}>
                        Apply
                    </Button>
                </div>
            </div>

            {stats && (
                <>
                    {/* Financial Overview Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Retail Value (In-Stock)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.inventoryValuation.retailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <p className="text-xs text-muted-foreground">Total potential revenue in inventory</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Cost Basis (In-Stock)</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.inventoryValuation.costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <p className="text-xs text-muted-foreground">Capital tied up in current stock</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Average Profit Margin</CardTitle>
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.inventoryValuation.grossMargin.toFixed(1)}%</div>
                                <p className="text-xs text-muted-foreground">Potential inventory markup margin</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding Customer Credit</CardTitle>
                                <Scale className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.customerMetrics.totalStoreCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <p className="text-xs text-muted-foreground">Total customer store credit liability</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Interactive Recharts Section */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                        {/* Sales by Game Chart */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle className="text-lg">Sales by Card Game</CardTitle>
                                <CardDescription>Sales distribution across card franchises</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {stats.gameSales.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No sales data in this date range.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.gameSales}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="name" fontSize={11} stroke="#888" tickLine={false} axisLine={false} />
                                            <YAxis fontSize={11} stroke="#888" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Sales"]} contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                                {stats.gameSales.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sales by Category Chart */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle className="text-lg">Sales by Product Type</CardTitle>
                                <CardDescription>Singles vs. Sealed vs. Accessories</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center">
                                {stats.categorySales.length === 0 ? (
                                    <div className="text-muted-foreground text-sm">No sales data in this date range.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.categorySales}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                labelLine={false}
                                            >
                                                {stats.categorySales.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Sales"]} contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Products and Customer Leaderboard */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Top Selling Products */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg">Top-Selling Products</CardTitle>
                                    <CardDescription>Most popular items by quantity sold</CardDescription>
                                </div>
                                <Award className="h-5 w-5 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="text-right">Qty Sold</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.topProducts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">No sales recorded.</TableCell>
                                            </TableRow>
                                        ) : (
                                            stats.topProducts.map((p, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-semibold text-sm">{p.name}</TableCell>
                                                    <TableCell><Badge variant="outline">{p.sku}</Badge></TableCell>
                                                    <TableCell className="text-right font-medium">{p.qty}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold">${p.revenue.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Customer Lifetime Value Leaderboard */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-lg">Customer Spenders Leaderboard</CardTitle>
                                    <CardDescription>Top buyers sorted by lifetime store spend</CardDescription>
                                </div>
                                <div className="text-xs px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full font-bold">
                                    Repeat Rate: {stats.customerMetrics.repeatCustomerRate.toFixed(0)}%
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Orders</TableHead>
                                            <TableHead className="text-right">Lifetime Spend</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {stats.customerMetrics.customerLeaderboard.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">No customer orders recorded.</TableCell>
                                            </TableRow>
                                        ) : (
                                            stats.customerMetrics.customerLeaderboard.map((c, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>
                                                        <div className="font-semibold text-sm">{c.name || "Customer"}</div>
                                                        <div className="text-xs text-muted-foreground">{c.email}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{c.ordersCount}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold text-green-500">${c.lifetimeSpend.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Buylist Intake Section */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="md:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Buylist Cash vs Credit</CardTitle>
                                <CardDescription>Preferred payout options for processed buylists</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[200px] flex items-center justify-center">
                                {buylistPieData.length === 0 ? (
                                    <div className="text-muted-foreground text-sm">No buylist payouts recorded.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={buylistPieData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                                labelLine={false}
                                            >
                                                <Cell fill="#10b981" />
                                                <Cell fill="#3b82f6" />
                                            </Pie>
                                            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Payout"]} contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Buylist Metrics Breakdown */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Buylist Payout Metrics</CardTitle>
                                <CardDescription>Overview of capital spent purchasing cards from players</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-3 gap-4 py-8">
                                <div className="space-y-1 p-4 border rounded-lg text-center">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Cash Paid</span>
                                    <div className="text-xl font-bold text-foreground">
                                        ${stats.buylistMetrics.totalCashPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="space-y-1 p-4 border rounded-lg text-center">
                                    <span className="text-xs text-muted-foreground uppercase font-bold">Credit Issued</span>
                                    <div className="text-xl font-bold text-foreground">
                                        ${stats.buylistMetrics.totalCreditPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="space-y-1 p-4 border rounded-lg text-center bg-purple-500/5 border-purple-500/10">
                                    <span className="text-xs text-purple-400 uppercase font-bold">Total Capital Spent</span>
                                    <div className="text-xl font-bold text-purple-400 font-extrabold">
                                        ${stats.buylistMetrics.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}

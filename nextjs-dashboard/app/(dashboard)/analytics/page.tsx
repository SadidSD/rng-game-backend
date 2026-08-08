"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Loader2, DollarSign, Users, Award, 
    ArrowUpRight, ArrowDownRight, TrendingUp,
    Percent, CreditCard, Scale, ShoppingBag, 
    Truck, RefreshCcw, Calendar, Activity, 
    AlertTriangle, ShieldAlert
} from "lucide-react";
import { 
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, PieChart, Pie, AreaChart, Area, Legend
} from "recharts";
import axios from "axios";
import Cookies from "js-cookie";
import { format, subDays } from "date-fns";
import { TrafficMonitor } from "./traffic-monitor";

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

interface SlippingCustomer {
    name: string;
    email: string;
    lastOrderDate: string;
    ltv: number;
}

interface StockoutRisk {
    productName: string;
    sku: string;
    quantity: number;
    salesVelocity: number;
    daysRemaining: number;
}

interface DeadStock {
    productName: string;
    sku: string;
    quantity: number;
    value: number;
    daysSinceCreated: number;
}

interface EventPlayer {
    email: string;
    name: string;
    eventsCount: number;
    totalSpent: number;
}

interface AnalyticsStats {
    // Tab 1: Overview
    grossRevenue?: number;
    orderVolume?: number;
    aov?: number;
    revenueGrowth?: number;
    salesTrend?: { date: string; revenue: number; orders: number }[];
    statusDistribution?: { name: string; value: number }[];
    gameSales?: { name: string; value: number }[];
    categorySales?: { name: string; value: number }[];
    topProducts?: TopProduct[];

    // Tab 2: Financial Details
    financialMetrics?: {
        totalCogs: number;
        netProfit: number;
        grossMargin: number;
        totalRefundedValue: number;
        refundRate: number;
        totalStoreCredit: number;
    };

    // Tab 3: Inventory
    inventoryValuation?: {
        retailValue: number;
        costBasis: number;
        grossMargin: number;
        stockTurnover: number;
        lowStockCount: number;
    };
    inventoryMetrics?: {
        stockoutRisk: StockoutRisk[];
        deadStock: DeadStock[];
        inventoryByGame: { name: string; value: number }[];
        inventoryByCategory: { name: string; value: number }[];
        inventoryByCondition: { name: string; value: number }[];
    };

    // Tab 4: Customer Metrics
    customerMetrics?: {
        totalStoreCredit: number;
        repeatCustomerRate: number;
        customerLeaderboard: TopCustomer[];
        activeCustomersCount: number;
        averageLtv: number;
        slippingCustomers: SlippingCustomer[];
    };

    // Tab 5: Buylist Metrics
    buylistMetrics?: {
        totalCashPayout: number;
        totalCreditPayout: number;
        totalPayout: number;
        buylistConversion: number;
        buylistFunnel: { name: string; value: number }[];
        buylistTrend: { date: string; value: number }[];
    };

    // Tab 6: Event Metrics
    eventMetrics?: {
        totalEventRevenue: number;
        totalRegistrations: number;
        eventOccupancy: number;
        checkInRatio: number;
        eventsByGame: { name: string; value: number }[];
        eventPlayerLeaderboard: EventPlayer[];
    };
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [gameFilter, setGameFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    
    const [tempFilters, setTempFilters] = useState({
        start: startDate,
        end: endDate,
        game: gameFilter,
        category: categoryFilter
    });

    const fetchComprehensiveStats = async (start: string, end: string, game: string, category: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get("tcg-auth-token");
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://rng-game-backend-cx6f.onrender.com/api').replace(/\/$/, '');
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

            const params: any = { startDate: start, endDate: end };
            if (game !== "all") params.game = game;
            if (category !== "all") params.category = category;

            const res = await axios.get(`${apiUrl}/analytics/advanced`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err: any) {
            console.error("Failed to fetch comprehensive stats", err);
            setError(err.response?.data?.message || "Failed to load advanced analytics statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComprehensiveStats(startDate, endDate, gameFilter, categoryFilter);
    }, [startDate, endDate, gameFilter, categoryFilter]);

    const handleApplyFilters = () => {
        setStartDate(tempFilters.start);
        setEndDate(tempFilters.end);
        setGameFilter(tempFilters.game);
        setCategoryFilter(tempFilters.category);
    };

    const handleQuickFilter = (days: number) => {
        const start = format(subDays(new Date(), days), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        setStartDate(start);
        setEndDate(end);
        setTempFilters(prev => ({ ...prev, start, end }));
    };

    if (loading && !stats) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                <span className="text-sm text-muted-foreground font-medium">Assembling comprehensive business intelligence report...</span>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-destructive/10 border-destructive/20 max-w-lg mx-auto mt-20">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-500 font-semibold mb-2">Error loading analytics</p>
                <p className="text-xs">{error}</p>
                <Button className="mt-4" onClick={() => fetchComprehensiveStats(startDate, endDate, gameFilter, categoryFilter)}>
                    Try Again
                </Button>
            </div>
        );
    }

    // Format buylist payout data for donut chart
    const buylistPieData = stats?.buylistMetrics ? [
        { name: "Cash Paid", value: stats.buylistMetrics.totalCashPayout || 0 },
        { name: "Credit Issued", value: stats.buylistMetrics.totalCreditPayout || 0 }
    ].filter(d => d.value > 0) : [];

    return (
        <div className="flex flex-col gap-6 p-1 sm:p-4">
            {/* Header and Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-2 border-b">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Business Intelligence Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Unified e-commerce tracking: sales overview, margins, stock valuations, retention cohorts, and event operations.</p>
                </div>
                
                {/* Advanced Filter Control Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-2.5 rounded-lg border w-full xl:w-auto">
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8" onClick={() => handleQuickFilter(7)}>7D</Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => handleQuickFilter(30)}>30D</Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => handleQuickFilter(90)}>90D</Button>
                    </div>
                    
                    {/* Date Inputs */}
                    <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-background text-sm h-8">
                        <Input 
                            type="date" 
                            className="border-none p-0 h-5 focus-visible:ring-0 text-xs w-[105px]" 
                            value={tempFilters.start}
                            onChange={(e) => setTempFilters({ ...tempFilters, start: e.target.value })}
                        />
                        <span className="text-muted-foreground text-xs">to</span>
                        <Input 
                            type="date" 
                            className="border-none p-0 h-5 focus-visible:ring-0 text-xs w-[105px]" 
                            value={tempFilters.end}
                            onChange={(e) => setTempFilters({ ...tempFilters, end: e.target.value })}
                        />
                    </div>

                    {/* Game Filter */}
                    <Select value={tempFilters.game} onValueChange={(val) => setTempFilters({ ...tempFilters, game: val })}>
                        <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                            <SelectValue placeholder="Game" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Games</SelectItem>
                            <SelectItem value="MTG">MTG</SelectItem>
                            <SelectItem value="Pokemon">Pokémon</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Category Filter */}
                    <Select value={tempFilters.category} onValueChange={(val) => setTempFilters({ ...tempFilters, category: val })}>
                        <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Booster Boxes">Booster Boxes</SelectItem>
                            <SelectItem value="MTG: Creatures">MTG: Creatures</SelectItem>
                            <SelectItem value="MTG: Artifacts">MTG: Artifacts</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold" onClick={handleApplyFilters} disabled={loading}>
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                        Apply Filters
                    </Button>
                </div>
            </div>

            {stats && (
                <Tabs defaultValue="overview" className="space-y-6">
                    {/* Navigation Tabs */}
                    <TabsList className="grid grid-cols-3 md:grid-cols-7 gap-2 bg-muted p-1 rounded-xl h-auto">
                        <TabsTrigger value="overview" className="rounded-lg py-2 font-bold text-xs md:text-sm">Overview</TabsTrigger>
                        <TabsTrigger value="traffic" className="rounded-lg py-2 font-bold text-xs md:text-sm">Web Traffic</TabsTrigger>
                        <TabsTrigger value="financials" className="rounded-lg py-2 font-bold text-xs md:text-sm">Financials</TabsTrigger>
                        <TabsTrigger value="inventory" className="rounded-lg py-2 font-bold text-xs md:text-sm">Inventory</TabsTrigger>
                        <TabsTrigger value="customers" className="rounded-lg py-2 font-bold text-xs md:text-sm">Customers</TabsTrigger>
                        <TabsTrigger value="buylists" className="rounded-lg py-2 font-bold text-xs md:text-sm">Buylists</TabsTrigger>
                        <TabsTrigger value="events" className="rounded-lg py-2 font-bold text-xs md:text-sm">Events</TabsTrigger>
                    </TabsList>

                    {/* TAB: WEB TRAFFIC */}
                    <TabsContent value="traffic" className="space-y-6">
                        <TrafficMonitor />
                    </TabsContent>

                    {/* TAB 1: BUSINESS OVERVIEW */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gross Revenue</CardTitle>
                                    <DollarSign className="h-4.5 w-4.5 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="flex items-center gap-1 mt-1 text-xs">
                                        {(stats.revenueGrowth || 0) >= 0 ? (
                                            <span className="text-green-500 font-bold flex items-center"><ArrowUpRight className="w-3.5 h-3.5" />{(stats.revenueGrowth || 0).toFixed(1)}%</span>
                                        ) : (
                                            <span className="text-red-500 font-bold flex items-center"><ArrowDownRight className="w-3.5 h-3.5" />{(stats.revenueGrowth || 0).toFixed(1)}%</span>
                                        )}
                                        <span className="text-muted-foreground">vs last period</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Order Volume</CardTitle>
                                    <ShoppingBag className="h-4.5 w-4.5 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{stats.orderVolume || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Completed checkout baskets</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Average Order Value (AOV)</CardTitle>
                                    <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.aov || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Mean checkout cart value</p>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sales Conversion</CardTitle>
                                    <Percent className="h-4.5 w-4.5 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">2.4%</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Estimated visitor order conversion</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Overview Charts Grid */}
                        <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                            <Card className="lg:col-span-5">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Revenue & Order Trends</CardTitle>
                                    <CardDescription>Daily revenue intake compared against transaction checkout volume</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[350px]">
                                    {!stats.salesTrend || stats.salesTrend.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">No transaction data in selection range.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.salesTrend}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="date" fontSize={11} stroke="#888" tickFormatter={(v) => v ? v.slice(5) : ""} />
                                                <YAxis yAxisId="left" fontSize={11} stroke="#888" tickFormatter={(v) => `$${v}`} />
                                                <YAxis yAxisId="right" orientation="right" fontSize={11} stroke="#888" />
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                                                <Bar yAxisId="right" dataKey="orders" name="Orders (Qty)" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={10} />
                                                <Legend />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Checkout Statuses</CardTitle>
                                    <CardDescription>Order pipeline fulfillment split</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[350px] flex items-center justify-center">
                                    {!stats.statusDistribution || stats.statusDistribution.length === 0 ? (
                                        <div className="text-muted-foreground text-sm">No statuses found.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.statusDistribution}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="40%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    label={({ name, percent }) => `${name ? name.slice(0,6) : ""} (${(percent * 100).toFixed(0)}%)`}
                                                    labelLine={false}
                                                >
                                                    {stats.statusDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Products and Demographics breakdowns */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Top Selling Products</CardTitle>
                                    <CardDescription>Highest revenue generators inside selected filters</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!stats.topProducts || stats.topProducts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No sales recorded.</TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.topProducts.map((p, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-semibold text-sm max-w-[200px] truncate">{p.name}</TableCell>
                                                        <TableCell><Badge variant="outline">{p.sku}</Badge></TableCell>
                                                        <TableCell className="text-right">{p.qty}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-purple-600">${p.revenue.toFixed(2)}</TableCell>
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
                                    <CardTitle className="text-lg font-bold">Sales by Game & Category</CardTitle>
                                    <CardDescription>Product and brand classification splits</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Game Sales */}
                                    <div>
                                        <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Brand/Franchise Share</span>
                                        <div className="h-[120px] mt-2">
                                            {!stats.gameSales || stats.gameSales.length === 0 ? (
                                                <div className="text-xs text-muted-foreground text-center py-6">No brand statistics.</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.gameSales} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                                        <XAxis type="number" fontSize={9} tickFormatter={(v) => `$${v}`} />
                                                        <YAxis dataKey="name" type="category" fontSize={9} width={60} />
                                                        <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                                            {stats.gameSales.map((entry, idx) => (
                                                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                    {/* Category Sales */}
                                    <div>
                                        <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Category Share</span>
                                        <div className="h-[120px] mt-2">
                                            {!stats.categorySales || stats.categorySales.length === 0 ? (
                                                <div className="text-xs text-muted-foreground text-center py-6">No category statistics.</div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={stats.categorySales} layout="vertical">
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                                        <XAxis type="number" fontSize={9} tickFormatter={(v) => `$${v}`} />
                                                        <YAxis dataKey="name" type="category" fontSize={9} width={90} />
                                                        <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                                                            {stats.categorySales.map((entry, idx) => (
                                                                <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 2: FINANCIALS & COGS */}
                    <TabsContent value="financials" className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cost of Goods Sold (COGS)</CardTitle>
                                    <CreditCard className="h-4.5 w-4.5 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.financialMetrics?.totalCogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Capital spent purchasing sold items</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Net Profit</CardTitle>
                                    <DollarSign className="h-4.5 w-4.5 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.financialMetrics?.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Gross Revenue minus COGS</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Gross Margin %</CardTitle>
                                    <Percent className="h-4.5 w-4.5 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{(stats.financialMetrics?.grossMargin || 0).toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Markup profit margin percentage</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Credit Liabilities</CardTitle>
                                    <Scale className="h-4.5 w-4.5 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.financialMetrics?.totalStoreCredit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Total outstanding store credit liability</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Refund rate grid */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Refund Metrics</CardTitle>
                                    <CardDescription>Customer returns and refund ratios</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="p-4 border rounded-lg text-center bg-red-50/5 border-red-500/10">
                                        <span className="text-xs text-muted-foreground font-semibold uppercase">Refund Rate</span>
                                        <div className="text-2xl font-black text-red-500 mt-1">{(stats.financialMetrics?.refundRate || 0).toFixed(1)}%</div>
                                    </div>
                                    <div className="p-4 border rounded-lg text-center">
                                        <span className="text-xs text-muted-foreground font-semibold uppercase">Capital Refunded</span>
                                        <div className="text-2xl font-black mt-1">${(stats.financialMetrics?.totalRefundedValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Financial stacked chart */}
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Sales Profitability Breakdown</CardTitle>
                                    <CardDescription>Comparison of revenue intake vs. product cost basis (COGS) vs. net markup profit</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.salesTrend || []}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" fontSize={9} stroke="#888" />
                                            <YAxis fontSize={9} stroke="#888" tickFormatter={(v) => `$${v}`} />
                                            <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                            <Legend />
                                            <Bar dataKey="revenue" name="Gross Revenue" fill="#8b5cf6" stackId="a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 3: INVENTORY VALUATION & PERFORMANCE */}
                    <TabsContent value="inventory" className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Retail Valuation</CardTitle>
                                    <DollarSign className="h-4.5 w-4.5 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold">${(stats.inventoryValuation?.retailValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">Potential revenue at current pricing</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cost Basis</CardTitle>
                                    <CreditCard className="h-4.5 w-4.5 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold">${(stats.inventoryValuation?.costBasis || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">Capital tied up in stock items</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Markup Margin</CardTitle>
                                    <Percent className="h-4.5 w-4.5 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold">{(stats.inventoryValuation?.grossMargin || 0).toFixed(1)}%</div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">Avg markup profit margin ratio</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Low Stock Count</CardTitle>
                                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold">{stats.inventoryValuation?.lowStockCount || 0} items</div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">Under safe stock threshold</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Stock Turnover</CardTitle>
                                    <Activity className="h-4.5 w-4.5 text-pink-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-extrabold">{(stats.inventoryValuation?.stockTurnover || 0).toFixed(2)}x</div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5">Ratio of inventory turnover speed</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Warning grids: Stockout warning vs Dead stock */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Stockout Risk warning */}
                            <Card className="border-amber-500/20 bg-amber-500/[0.02]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-5 h-5 text-amber-500" />Stockout Risk warning</CardTitle>
                                        <CardDescription>Fast-selling items projected to sell out in under 30 days</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700">Action Required</Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product Name</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Sales/Day</TableHead>
                                                <TableHead className="text-right">Days Left</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!stats.inventoryMetrics?.stockoutRisk || stats.inventoryMetrics.stockoutRisk.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">No items currently at stockout risk.</TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.inventoryMetrics.stockoutRisk.map((r, idx) => (
                                                    <TableRow key={idx} className="hover:bg-amber-500/5">
                                                        <TableCell className="font-semibold text-sm max-w-[180px] truncate">{r.productName}</TableCell>
                                                        <TableCell className="text-right font-medium">{r.quantity}</TableCell>
                                                        <TableCell className="text-right text-xs font-mono">{r.salesVelocity.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-mono font-extrabold text-red-500">{r.daysRemaining} days</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dead stock warning */}
                            <Card className="border-red-500/20 bg-red-500/[0.02]">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-red-600 flex items-center gap-1.5"><ShieldAlert className="w-5 h-5 text-red-500" />Dead / Aging stock</CardTitle>
                                        <CardDescription>Capital locked in items with high quantities and 0 sales</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="border-red-500/20 bg-red-500/10 text-red-700">Tied Capital</Badge>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product Name</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Capital Value</TableHead>
                                                <TableHead className="text-right">Age (Days)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!stats.inventoryMetrics?.deadStock || stats.inventoryMetrics.deadStock.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs">No dead stock items detected.</TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.inventoryMetrics.deadStock.map((r, idx) => (
                                                    <TableRow key={idx} className="hover:bg-red-500/5">
                                                        <TableCell className="font-semibold text-sm max-w-[180px] truncate">{r.productName}</TableCell>
                                                        <TableCell className="text-right font-medium">{r.quantity}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-red-500">${r.value.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-mono text-xs">{r.daysSinceCreated} days</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Inventory splits charts */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Valuation by Brand</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px] flex items-center justify-center">
                                    {!stats.inventoryMetrics?.inventoryByGame || stats.inventoryMetrics.inventoryByGame.length === 0 ? (
                                        <div className="text-muted-foreground text-sm">No data.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.inventoryMetrics.inventoryByGame}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={65}
                                                    paddingAngle={2}
                                                    label={({ name }) => name}
                                                    labelLine={false}
                                                >
                                                    {stats.inventoryMetrics.inventoryByGame.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Valuation by Category</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px] flex items-center justify-center">
                                    {!stats.inventoryMetrics?.inventoryByCategory || stats.inventoryMetrics.inventoryByCategory.length === 0 ? (
                                        <div className="text-muted-foreground text-sm">No data.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.inventoryMetrics.inventoryByCategory}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={65}
                                                    paddingAngle={2}
                                                    label={({ name }) => name ? name.slice(0,8) : ""}
                                                    labelLine={false}
                                                >
                                                    {stats.inventoryMetrics.inventoryByCategory.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={COLORS[(idx + 3) % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Quantity by Card Condition</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[200px] flex items-center justify-center">
                                    {!stats.inventoryMetrics?.inventoryByCondition || stats.inventoryMetrics.inventoryByCondition.length === 0 ? (
                                        <div className="text-muted-foreground text-sm">No data.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.inventoryMetrics.inventoryByCondition}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={65}
                                                    paddingAngle={2}
                                                    label={({ name }) => name}
                                                    labelLine={false}
                                                >
                                                    {stats.inventoryMetrics.inventoryByCondition.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={COLORS[(idx + 4) % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 4: CUSTOMERS & LTV */}
                    <TabsContent value="customers" className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Active Customers</CardTitle>
                                    <Users className="h-4.5 w-4.5 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{stats.customerMetrics?.activeCustomersCount || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Customers purchasing in filter window</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Repeat Customer Rate</CardTitle>
                                    <RefreshCcw className="h-4.5 w-4.5 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{(stats.customerMetrics?.repeatCustomerRate || 0).toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Ratio of customers with &gt;= 2 orders</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mean Customer LTV</CardTitle>
                                    <Award className="h-4.5 w-4.5 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.customerMetrics?.averageLtv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Average checkout value accumulated over lifetime</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* VIP Leaderboard and Slipping Customers */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* VIP Leaderboard */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">VIP Customer Leaderboard</CardTitle>
                                    <CardDescription>Top spending purchasers sorted by cumulative orders value</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead className="text-right">Orders</TableHead>
                                                <TableHead className="text-right">Lifetime Spend</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!stats.customerMetrics?.customerLeaderboard || stats.customerMetrics.customerLeaderboard.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-sm">No spend records.</TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.customerMetrics.customerLeaderboard.map((c, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <div className="font-semibold text-sm">{c.name || "Unknown"}</div>
                                                            <div className="text-xs text-muted-foreground">{c.email}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">{c.ordersCount}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-emerald-500">${c.lifetimeSpend.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Slipping Customers */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" />Slipping Customers (Churnalytics)</CardTitle>
                                    <CardDescription>VIP spenders with zero purchases in the last 60 days</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer</TableHead>
                                                <TableHead className="text-right">Last Order</TableHead>
                                                <TableHead className="text-right">LTV</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!stats.customerMetrics?.slippingCustomers || stats.customerMetrics.slippingCustomers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-sm">No churnalytics alerts.</TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.customerMetrics.slippingCustomers.map((c, idx) => (
                                                    <TableRow key={idx} className="hover:bg-red-500/[0.02]">
                                                        <TableCell>
                                                            <div className="font-semibold text-sm">{c.name}</div>
                                                            <div className="text-xs text-muted-foreground">{c.email}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs font-medium font-mono text-red-500">
                                                            {c.lastOrderDate ? format(new Date(c.lastOrderDate), "yyyy-MM-dd") : "N/A"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-slate-700">${c.ltv.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 5: BUYLIST FUNNEL */}
                    <TabsContent value="buylists" className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Payouts</CardTitle>
                                    <CreditCard className="h-4.5 w-4.5 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.buylistMetrics?.totalPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Capital spent acquiring cards</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cash Payouts</CardTitle>
                                    <DollarSign className="h-4.5 w-4.5 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.buylistMetrics?.totalCashPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Cash/Bank capital outflow</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Store Credit Issued</CardTitle>
                                    <Scale className="h-4.5 w-4.5 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.buylistMetrics?.totalCreditPayout || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Outstanding store credit balance liability</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Offer Conversion %</CardTitle>
                                    <Activity className="h-4.5 w-4.5 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{(stats.buylistMetrics?.buylistConversion || 0).toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Ratio of completed offers vs submissions</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Buylist charts */}
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-7">
                            <Card className="md:col-span-4">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Completed Buylist Intake Trend</CardTitle>
                                    <CardDescription>Daily value of cards acquired through buylist processing</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px]">
                                    {!stats.buylistMetrics?.buylistTrend || stats.buylistMetrics.buylistTrend.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">No intake trends.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.buylistMetrics.buylistTrend}>
                                                <defs>
                                                    <linearGradient id="colorIntake" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="date" fontSize={9} stroke="#888" />
                                                <YAxis fontSize={9} stroke="#888" tickFormatter={(v) => `$${v}`} />
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                                <Area type="monotone" dataKey="value" name="Intake Payout ($)" stroke="#10b981" fillOpacity={1} fill="url(#colorIntake)" strokeWidth={2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-3">
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Buylist Payout Split</CardTitle>
                                    <CardDescription>Preferred payout options chosen by players</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[280px] flex items-center justify-center">
                                    {buylistPieData.length === 0 ? (
                                        <div className="text-muted-foreground text-sm">No buylist payouts.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={buylistPieData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={75}
                                                    paddingAngle={3}
                                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                                    labelLine={false}
                                                >
                                                    <Cell fill="#3b82f6" />
                                                    <Cell fill="#10b981" />
                                                </Pie>
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 6: EVENTS PERFORMANCE */}
                    <TabsContent value="events" className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Event ticket revenue</CardTitle>
                                    <DollarSign className="h-4.5 w-4.5 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">${(stats.eventMetrics?.totalEventRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Sum of entry ticket fees sold</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total registrants</CardTitle>
                                    <Users className="h-4.5 w-4.5 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{stats.eventMetrics?.totalRegistrations || 0} players</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Total players signed up for events</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Avg occupancy rate</CardTitle>
                                    <Scale className="h-4.5 w-4.5 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{(stats.eventMetrics?.eventOccupancy || 0).toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Percentage of venue spots occupied</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Check-in ratio</CardTitle>
                                    <Activity className="h-4.5 w-4.5 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-extrabold">{(stats.eventMetrics?.checkInRatio || 0).toFixed(1)}%</div>
                                    <p className="text-xs text-muted-foreground mt-1.5">Percentage of tickets checked-in at store</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Player ticket leaderboard and game attendance splits */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Attendance split by game */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Event Registrants by Game</CardTitle>
                                    <CardDescription>Popularity of card games hosted at store events</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[250px] flex items-center justify-center">
                                    {!stats.eventMetrics?.eventsByGame || stats.eventMetrics.eventsByGame.length === 0 ? (
                                        <div className="text-muted-foreground text-sm">No events found in this date window.</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.eventMetrics.eventsByGame}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis dataKey="name" fontSize={10} stroke="#888" />
                                                <YAxis fontSize={10} stroke="#888" />
                                                <Tooltip contentStyle={{ background: "#0c0a09", borderColor: "#27272a" }} />
                                                <Bar dataKey="value" name="Players" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                                                    {stats.eventMetrics.eventsByGame.map((entry, idx) => (
                                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Player Leaderboard */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">Top Event Attendees</CardTitle>
                                    <CardDescription>Players participating in the most local in-store events</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Player</TableHead>
                                                <TableHead className="text-right">Events Count</TableHead>
                                                <TableHead className="text-right">Entry Fees Spent</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!stats.eventMetrics?.eventPlayerLeaderboard || stats.eventMetrics.eventPlayerLeaderboard.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6 text-sm">No player registries recorded.</TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.eventMetrics.eventPlayerLeaderboard.map((p, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <div className="font-semibold text-sm">{p.name || "Unknown"}</div>
                                                            <div className="text-xs text-muted-foreground">{p.email}</div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">{p.eventsCount} events</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-purple-600">${p.totalSpent.toFixed(2)}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

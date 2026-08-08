'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Users, MousePointer, Smartphone, Globe, Activity, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import axios from 'axios';
import Cookies from 'js-cookie';

interface TrafficData {
    liveVisitors: number;
    totalPageViews: number;
    uniqueVisitors: number;
    topPages: { path: string; views: number }[];
    deviceBreakdown: { name: string; value: number }[];
    topEvents: { eventName: string; count: number }[];
    trafficTrend: { date: string; pageviews: number; visitors: number }[];
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function TrafficMonitor() {
    const [data, setData] = useState<TrafficData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    const fetchTraffic = async (daysCount: number) => {
        setLoading(true);
        try {
            const token = Cookies.get('tcg-auth-token');
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
            const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

            const res = await axios.get(`${apiUrl}/analytics/traffic`, {
                params: { days: daysCount },
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (e) {
            console.error('Failed to fetch traffic stats', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTraffic(days);
        // Refresh live stats every 30s
        const interval = setInterval(() => fetchTraffic(days), 30000);
        return () => clearInterval(interval);
    }, [days]);

    if (loading && !data) {
        return (
            <div className="min-h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 font-bold text-sm flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        {data?.liveVisitors || 0} Visitors Active Now
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:inline">Auto-updates every 30s</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex border rounded-md p-0.5 bg-muted">
                        <Button 
                            variant={days === 7 ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-7 text-xs" 
                            onClick={() => setDays(7)}
                        >
                            Last 7 Days
                        </Button>
                        <Button 
                            variant={days === 30 ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-7 text-xs" 
                            onClick={() => setDays(30)}
                        >
                            Last 30 Days
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchTraffic(days)}>
                        <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Page Views</CardTitle>
                        <Eye className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-extrabold">{data?.totalPageViews || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total visits across all pages</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unique Visitors</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-extrabold">{data?.uniqueVisitors || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Distinct user sessions</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clicks & Actions</CardTitle>
                        <MousePointer className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-extrabold">
                            {data?.topEvents.reduce((acc, curr) => acc + curr.count, 0) || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Buttons & links clicked</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Primary Device</CardTitle>
                        <Smartphone className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-extrabold capitalize">
                            {data?.deviceBreakdown?.[0]?.name || "Desktop"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Most popular device type</p>
                    </CardContent>
                </Card>
            </div>

            {/* Traffic Trend Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        Page Views & Visitors Trend
                    </CardTitle>
                    <CardDescription>Daily traffic volume over the selected timeframe</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trafficTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/20" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                                <YAxis tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="pageviews" name="Page Views" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPageviews)" />
                                <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Row: Top Pages & Clicks / Devices */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Visited Pages */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            Most Visited Pages
                        </CardTitle>
                        <CardDescription>Top pages receiving the highest traffic</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.topPages && data.topPages.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page Path</TableHead>
                                        <TableHead className="text-right">Views</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.topPages.map((p, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono text-xs">{p.path}</TableCell>
                                            <TableCell className="text-right font-bold">{p.views}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-8">No pageview data logged yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Top Clicked Events */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <MousePointer className="h-4 w-4 text-emerald-500" />
                            Top User Actions & Clicks
                        </CardTitle>
                        <CardDescription>Interactive elements clicked by visitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data?.topEvents && data.topEvents.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Action / Event</TableHead>
                                        <TableHead className="text-right">Clicks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.topEvents.map((e, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="capitalize font-medium text-xs">
                                                {e.eventName.replace(/_/g, ' ')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">{e.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center py-8">No click events logged yet. Visit your storefront to generate activity!</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

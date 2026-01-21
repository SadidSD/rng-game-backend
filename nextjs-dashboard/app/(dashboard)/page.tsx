import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Activity,
    CreditCard,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    Package,
} from "lucide-react"
import { SalesChart } from "@/components/charts/SalesChart"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { BestSellingCards } from "@/components/dashboard/BestSellingCards"
import { InventoryAlerts } from "@/components/dashboard/InventoryAlerts"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { cookies } from "next/headers"

async function getDashboardStats() {
    const cookieStore = cookies()
    const token = cookieStore.get('tcg-auth-token')

    // Clean trailing slash from base URL
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
    // Ensure URL ends with /api to match backend global prefix
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

    try {
        console.log(`[Dashboard] Fetching stats from: ${apiUrl}/analytics/dashboard`);
        const res = await fetch(`${apiUrl}/analytics/dashboard`, {
            headers: {
                Authorization: `Bearer ${token?.value}`
            },
            cache: 'no-store'
        })

        if (!res.ok) {
            console.error(`[Dashboard] Failed with status: ${res.status} ${res.statusText}`);
            return { error: `API Error: ${res.status} ${res.statusText}` };
        }
        return res.json()
    } catch (e) {
        console.error('[Dashboard] Network/Fetch Error:', e);
        return { error: `Network Error: ${(e as Error).message}` };
    }
}

export default async function Dashboard() {
    const stats: any = await getDashboardStats()

    if (!stats || stats.error) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>Unable to load dashboard data.</p>
                <p className="text-xs text-red-400 mt-2">{stats?.error || 'Unknown error'}</p>
                <p className="text-xs text-gray-500 mt-1">Check console for details.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card x-chunk="dashboard-01-chunk-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalSales?.toFixed(2) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Lifetime</span>
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Orders
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">Lifetime</span>
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Buylist Queue</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.buylistQueue || 0}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="text-orange-500">Pending review</span>
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.totalCustomers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered Users
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Actions Row */}
            <div id="analytics" className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>
                            Your sales performance over the last 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <SalesChart data={stats.chartData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Frequently used actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QuickActions />
                    </CardContent>
                </Card>
            </div>

            {/* Best Sellers and Alerts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Best Selling Cards</CardTitle>
                        <CardDescription>
                            (Coming Soon)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Best Sellers not yet implemented in analytics service */}
                        <div className="text-sm text-muted-foreground">No data available.</div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Low Inventory Alerts</CardTitle>
                        <CardDescription>
                            Items running low on stock
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InventoryAlerts items={stats.lowStockItems} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Latest orders
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentActivity orders={stats.recentOrders} />
                </CardContent>
            </Card>
        </div>
    )
}


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

export default function Dashboard() {
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
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+20.1%</span> from last month
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
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-500">+19%</span> from last month
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Buylist Queue</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-500">3 pending review</span>
                        </p>
                    </CardContent>
                </Card>
                <Card x-chunk="dashboard-01-chunk-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+573</div>
                        <p className="text-xs text-muted-foreground">
                            +201 since last hour
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Actions Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>
                            Your sales performance over the last 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <SalesChart />
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
                            Top 5 products by revenue this month
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BestSellingCards />
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
                        <InventoryAlerts />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Latest updates from your store
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RecentActivity />
                </CardContent>
            </Card>
        </div>
    )
}

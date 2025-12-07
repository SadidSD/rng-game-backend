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

const orders = [
    { id: "ORD-001", customer: "John Doe", items: 5, total: 245.99, status: "shipped", paymentStatus: "paid", date: "2024-12-01", game: "Pokémon" },
    { id: "ORD-002", customer: "Jane Smith", items: 3, total: 189.50, status: "processing", paymentStatus: "paid", date: "2024-12-01", game: "MTG" },
    { id: "ORD-003", customer: "Mike Johnson", items: 8, total: 432.00, status: "delivered", paymentStatus: "paid", date: "2024-11-30", game: "Yu-Gi-Oh!" },
    { id: "ORD-004", customer: "Sarah Williams", items: 2, total: 95.99, status: "pending", paymentStatus: "pending", date: "2024-12-01", game: "Pokémon" },
    { id: "ORD-005", customer: "Tom Brown", items: 12, total: 678.50, status: "shipped", paymentStatus: "paid", date: "2024-11-29", game: "MTG" },
]

function getStatusColor(status: string) {
    switch (status) {
        case "delivered": return "default"
        case "shipped": return "secondary"
        case "processing": return "outline"
        case "pending": return "destructive"
        default: return "outline"
    }
}

function getPaymentColor(status: string) {
    return status === "paid" ? "default" : "destructive"
}

export default function OrdersPage() {
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
                        <TabsTrigger value="delivered">Delivered</TabsTrigger>
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

                <TabsContent value="all" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Orders</CardTitle>
                            <CardDescription>
                                View and manage all customer orders
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Game</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/orders/${order.id}`} className="hover:underline">
                                                    {order.id}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{order.customer}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{order.game}</Badge>
                                            </TableCell>
                                            <TableCell>{order.items}</TableCell>
                                            <TableCell>${order.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusColor(order.status)}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getPaymentColor(order.paymentStatus)}>
                                                    {order.paymentStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/orders/${order.id}`}>View</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Orders</CardTitle>
                            <CardDescription>Orders awaiting processing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {orders.filter(o => o.status === "pending").length} pending orders
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

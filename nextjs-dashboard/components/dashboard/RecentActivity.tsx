"use client"

import { Package, ShoppingCart, UserPlus, TrendingUp } from "lucide-react"

export function RecentActivity({ orders }: { orders?: any[] }) {
    if (!orders || orders.length === 0) {
        return <div className="text-sm text-muted-foreground">No recent activity.</div>
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                return (
                    <div key={order.id} className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                New order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                                {new Date(order.createdAt).toLocaleString()}
                            </p>
                            {order.customer?.email && (
                                <p className="text-xs text-muted-foreground">
                                    by {order.customer.firstName ? `${order.customer.firstName} ${order.customer.lastName}` : order.customer.email}
                                </p>
                            )}
                        </div>
                        <div className="text-sm font-medium">
                            ${Number(order.total).toFixed(2)}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

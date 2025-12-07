"use client"

import { Package, ShoppingCart, UserPlus, TrendingUp } from "lucide-react"

const activities = [
    {
        id: 1,
        type: "order",
        description: "New order #1234 received",
        time: "2 minutes ago",
        icon: ShoppingCart,
    },
    {
        id: 2,
        type: "product",
        description: "Added 'Charizard VMAX' to inventory",
        time: "15 minutes ago",
        icon: Package,
    },
    {
        id: 3,
        type: "customer",
        description: "New customer registration",
        time: "1 hour ago",
        icon: UserPlus,
    },
    {
        id: 4,
        type: "sale",
        description: "Best selling day this month!",
        time: "2 hours ago",
        icon: TrendingUp,
    },
]

export function RecentActivity() {
    return (
        <div className="space-y-4">
            {activities.map((activity) => {
                const Icon = activity.icon
                return (
                    <div key={activity.id} className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/10 p-2">
                            <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {activity.description}
                            </p>
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

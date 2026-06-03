"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Bell,
    CircleUser,
    Home,
    LineChart,
    Menu,
    Package,
    Package2,
    Search,
    ShoppingCart,
    Users,
    Settings,
    Calendar,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { name: "Dashboard", href: "/", icon: Home },
        { name: "Orders", href: "/orders", icon: ShoppingCart },
        { name: "Products", href: "/products", icon: Package },
        { name: "Categories", href: "/categories", icon: Package2 },
        { name: "Events", href: "/events", icon: Calendar },
        { name: "Buylist", href: "/buylist", icon: ShoppingCart },
        { name: "Customers", href: "/customers", icon: Users },
        { name: "Analytics", href: "/analytics", icon: LineChart },
        { name: "Settings", href: "/settings", icon: Settings },
    ];

    return (
        <div className="hidden border-r bg-card/40 backdrop-blur-md md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                            <span className="font-extrabold text-sm tracking-tighter">RG</span>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">RNG Gamez</span>
                    </Link>
                    <Button variant="outline" size="icon" className="ml-auto h-8 w-8 rounded-full border-border/40 hover:bg-muted">
                        <Bell className="h-4 w-4" />
                        <span className="sr-only">Toggle notifications</span>
                    </Button>
                </div>
                <div className="flex-1">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                            
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                                        isActive
                                            ? "bg-primary/10 text-primary font-semibold shadow-inner border-l-2 border-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? "scale-110 text-primary" : ""}`} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>
        </div>
    )
}

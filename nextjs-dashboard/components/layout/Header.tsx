"use client";

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Cookies from "js-cookie"
import {
    CircleUser,
    Home,
    LineChart,
    Menu,
    Package,
    Package2,
    Search,
    ShoppingCart,
    Users,
    Calendar,
    Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        // Clear the token cookie
        Cookies.remove('tcg-auth-token');
        // Redirect to login page
        router.push('/login');
        router.refresh();
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 md:hidden"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col bg-card/95 backdrop-blur-md border-r border-border/40">
                    <nav className="grid gap-1 text-lg font-medium">
                        <Link
                            href="/"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 text-lg font-bold text-foreground mb-6"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                                <span className="font-extrabold text-sm tracking-tighter">RG</span>
                            </div>
                            <span>RNG Gamez</span>
                        </Link>
                        {[
                            { name: "Dashboard", href: "/", icon: Home },
                            { name: "Orders", href: "/orders", icon: ShoppingCart },
                            { name: "Products", href: "/products", icon: Package },
                            { name: "Categories", href: "/categories", icon: Package2 },
                            { name: "Events", href: "/events", icon: Calendar },
                            { name: "Buylist", href: "/buylist", icon: ShoppingCart },
                            { name: "Customers", href: "/customers", icon: Users },
                            { name: "Analytics", href: "/analytics", icon: LineChart },
                            { name: "Settings", href: "/settings", icon: Settings },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-4 rounded-xl px-3 py-2.5 transition-all duration-200 text-base ${
                                        isActive
                                            ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? "text-primary scale-110" : ""}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search products..."
                            className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                        />
                    </div>
                </form>
            </div>
            <ModeToggle />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <CircleUser className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer w-full">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}

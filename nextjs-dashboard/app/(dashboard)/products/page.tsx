import { Suspense } from "react"
import {
    File,
    ListFilter,
    PlusCircle,
} from "lucide-react"
import Link from "next/link"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductsTable, ProductsTableSkeleton } from "./products-table"
import { ProductSearchInput } from "./ProductSearchInput"
import { CategoryFilter } from "./CategoryFilter"
import { cookies } from "next/headers"

async function getCategories() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('tcg-auth-token');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token?.value}`,
                'Content-Type': 'application/json',
            }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams?: {
        search?: string;
        tab?: string;
    };
}) {
    const search = searchParams?.search || "";
    const tab = searchParams?.tab || "all";
    const categories = await getCategories();

    return (
        <div className="flex flex-col sm:gap-4 sm:py-4">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="#">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Products</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="flex flex-col gap-4 w-full">
                    {/* Top Row: Search and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 max-w-md w-full">
                            <ProductSearchInput />
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 gap-1 rounded-lg">
                                        <ListFilter className="h-4 w-4" />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                            Filter
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem checked>
                                        Active
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>Draft</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem>
                                        Archived
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button size="sm" variant="outline" className="h-9 gap-1 rounded-lg">
                                <File className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Export
                                </span>
                            </Button>
                            <Link href="/products/create-choice">
                                <Button size="sm" className="h-9 gap-1 rounded-lg">
                                    <PlusCircle className="h-4 w-4" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        Add Product
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Unified Category Scroll Filter Strip */}
                    <div className="bg-card p-2 px-3 rounded-lg border shadow-sm flex items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/75 border-r pr-3 py-1 whitespace-nowrap">
                            Categories
                        </span>
                        <div className="flex-1 min-w-0">
                            <CategoryFilter categories={categories} />
                        </div>
                    </div>

                    {/* Table View */}
                    <Suspense fallback={<ProductsTableSkeleton />} key={tab + search}>
                        <ProductsTable tab={tab} search={search} />
                    </Suspense>
                </div>
            </main>
        </div>
    )
}

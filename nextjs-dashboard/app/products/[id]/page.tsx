import Link from "next/link"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import ProductForm from "@/app/ui/products/product-form"

async function getCategories() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

async function getProduct(id: string) {
    if (id === 'new') return null;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

export default async function ProductEditPage({ params }: { params: { id: string } }) {
    const isNew = params.id === 'new';
    const categories = await getCategories();
    const product = await getProduct(params.id);

    return (
        <div className="flex flex-col sm:gap-4 sm:py-4">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/dashboard">Dashboard</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/products">Products</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{isNew ? "New Product" : "Edit Product"}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                            {isNew ? "Create New Product" : `Edit ${product?.name || 'Product'}`}
                        </h1>
                    </div>

                    <ProductForm categories={categories} initialData={product} />
                </div>
            </main>
        </div>
    )
}

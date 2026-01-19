import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DownloadCloud, PenSquare } from "lucide-react"
import Link from "next/link"

export default function CreateProductChoicePage() {
    return (
        <div className="container mx-auto max-w-4xl py-12">
            <h1 className="mb-8 text-center text-3xl font-bold tracking-tight">Add New Product</h1>
            <div className="grid gap-6 md:grid-cols-2">
                <Link href="/products/import" className="group">
                    <Card className="h-full transition-all hover:border-primary hover:shadow-lg cursor-pointer">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                                <DownloadCloud className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="text-xl">Import from Catalog</CardTitle>
                            <CardDescription>
                                Search the Manapool database for standard cards. Best for Pokemon, Magic, and other TCG singles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button className="w-full">
                                Browse Catalog
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/products/new" className="group">
                    <Card className="h-full transition-all hover:border-primary hover:shadow-lg cursor-pointer">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20 transition-colors group-hover:bg-secondary/30">
                                <PenSquare className="h-10 w-10 text-secondary-foreground" />
                            </div>
                            <CardTitle className="text-xl">Create Manually</CardTitle>
                            <CardDescription>
                                Build a product from scratch. Best for custom bundles, sealed product, or unique items.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button variant="secondary" className="w-full">
                                Open Editor
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>
            <div className="mt-8 text-center">
                <Link href="/products">
                    <Button variant="ghost">Cancel</Button>
                </Link>
            </div>
        </div>
    )
}

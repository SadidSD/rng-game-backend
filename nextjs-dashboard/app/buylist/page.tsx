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
import { Search, CheckCircle, XCircle, Clock } from "lucide-react"

const buylistOffers = [
    { id: "BUY-001", customer: "Jane Smith", card: "Black Lotus", game: "MTG", condition: "LP", offerPrice: 5000, marketPrice: 6000, status: "pending", date: "2024-12-01" },
    { id: "BUY-002", customer: "Mike Johnson", card: "Charizard Base Set", game: "Pokémon", condition: "NM", offerPrice: 450, marketPrice: 500, status: "approved", date: "2024-12-01" },
    { id: "BUY-003", customer: "Sarah Williams", card: "Mox Ruby", game: "MTG", condition: "HP", offerPrice: 2800, marketPrice: 3500, status: "pending", date: "2024-11-30" },
    { id: "BUY-004", customer: "Tom Brown", card: "Pikachu Illustrator", game: "Pokémon", condition: "NM", offerPrice: 8500, marketPrice: 10000, status: "rejected", date: "2024-11-30" },
    { id: "BUY-005", customer: "Emily Davis", card: "Time Walk", game: "MTG", condition: "LP", offerPrice: 1200, marketPrice: 1500, status: "approved", date: "2024-11-29" },
]

function getStatusIcon(status: string) {
    switch (status) {
        case "approved": return <CheckCircle className="h-4 w-4 text-green-500" />
        case "rejected": return <XCircle className="h-4 w-4 text-red-500" />
        case "pending": return <Clock className="h-4 w-4 text-orange-500" />
        default: return null
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case "approved": return "default"
        case "rejected": return "destructive"
        case "pending": return "secondary"
        default: return "outline"
    }
}

export default function BuylistPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Buylist</h1>
                    <p className="text-muted-foreground">
                        Review and manage customer buylist offers
                    </p>
                </div>
                <Button>
                    Pricing Rules
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {buylistOffers.filter(o => o.status === "pending").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {buylistOffers.filter(o => o.status === "approved" && o.date === "2024-12-01").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Ready to purchase</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$17,950</div>
                        <p className="text-xs text-muted-foreground">Pending offers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">18%</div>
                        <p className="text-xs text-muted-foreground">Below market price</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="approved">Approved</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        <TabsTrigger value="all">All Offers</TabsTrigger>
                    </TabsList>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search offers..."
                            className="pl-8 w-[300px]"
                        />
                    </div>
                </div>

                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Offers</CardTitle>
                            <CardDescription>Review and approve buylist submissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Offer ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Card</TableHead>
                                        <TableHead>Game</TableHead>
                                        <TableHead>Condition</TableHead>
                                        <TableHead>Offer Price</TableHead>
                                        <TableHead>Market Price</TableHead>
                                        <TableHead>Margin</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buylistOffers.filter(o => o.status === "pending").map((offer) => {
                                        const margin = ((offer.marketPrice - offer.offerPrice) / offer.marketPrice * 100).toFixed(0)
                                        return (
                                            <TableRow key={offer.id}>
                                                <TableCell className="font-medium">{offer.id}</TableCell>
                                                <TableCell>{offer.customer}</TableCell>
                                                <TableCell className="font-medium">{offer.card}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{offer.game}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{offer.condition}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">${offer.offerPrice.toLocaleString()}</TableCell>
                                                <TableCell className="text-muted-foreground">${offer.marketPrice.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className="text-green-500 font-medium">{margin}%</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="default">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline">
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Offers</CardTitle>
                            <CardDescription>Complete buylist history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Offer ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Card</TableHead>
                                        <TableHead>Game</TableHead>
                                        <TableHead>Offer Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {buylistOffers.map((offer) => (
                                        <TableRow key={offer.id}>
                                            <TableCell className="font-medium">{offer.id}</TableCell>
                                            <TableCell>{offer.customer}</TableCell>
                                            <TableCell>{offer.card}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{offer.game}</Badge>
                                            </TableCell>
                                            <TableCell>${offer.offerPrice.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(offer.status)}
                                                    <Badge variant={getStatusColor(offer.status)}>
                                                        {offer.status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>{offer.date}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Download, AlertTriangle } from "lucide-react"

const inventory = [
    { id: "INV-001", name: "Charizard VMAX", game: "Pokémon", condition: "NM", location: "Warehouse A", bin: "A-12", stock: 45, reserved: 5, available: 40, lowStock: false },
    { id: "INV-002", name: "Black Lotus", game: "MTG", condition: "LP", location: "Warehouse A", bin: "A-05", stock: 2, reserved: 0, available: 2, lowStock: true },
    { id: "INV-003", name: "Pikachu V", game: "Pokémon", condition: "NM", location: "Store Front", bin: "SF-23", stock: 3, reserved: 0, available: 3, lowStock: true },
    { id: "INV-004", name: "Mox Ruby", game: "MTG", condition: "NM", location: "Warehouse B", bin: "B-08", stock: 5, reserved: 1, available: 4, lowStock: false },
    { id: "INV-005", name: "Mewtwo GX", game: "Pokémon", condition: "LP", location: "Store Front", bin: "SF-15", stock: 28, reserved: 3, available: 25, lowStock: false },
]

export default function InventoryPage() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">
                        Manage stock across all locations
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Stock
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1,234</div>
                        <p className="text-xs text-muted-foreground">Across all locations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,678</div>
                        <p className="text-xs text-muted-foreground">Estimated retail</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">12</div>
                        <p className="text-xs text-muted-foreground">Items need restock</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">Active warehouses</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Inventory List</CardTitle>
                            <CardDescription>Track stock levels across all locations</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search inventory..."
                                    className="pl-8 w-[250px]"
                                />
                            </div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                                    <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                                    <SelectItem value="store-front">Store Front</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Game" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Games</SelectItem>
                                    <SelectItem value="pokemon">Pokémon</SelectItem>
                                    <SelectItem value="mtg">MTG</SelectItem>
                                    <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Game</TableHead>
                                <TableHead>Condition</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Bin</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Reserved</TableHead>
                                <TableHead>Available</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {item.lowStock && (
                                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                            )}
                                            {item.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{item.game}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.condition}</Badge>
                                    </TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell className="font-mono text-sm">{item.bin}</TableCell>
                                    <TableCell>{item.stock}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.reserved}</TableCell>
                                    <TableCell className="font-medium">{item.available}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">
                                            Adjust
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

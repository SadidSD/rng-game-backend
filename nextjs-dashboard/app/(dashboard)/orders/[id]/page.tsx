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
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Printer, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const orderId = params.id

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/orders">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Order {orderId}</h1>
                    <p className="text-muted-foreground">December 1, 2024 at 10:30 AM</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Issue Refund
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                        <CardDescription>5 items in this order</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Condition</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Charizard VMAX</TableCell>
                                    <TableCell><Badge variant="outline">NM</Badge></TableCell>
                                    <TableCell>2</TableCell>
                                    <TableCell>$45.00</TableCell>
                                    <TableCell>$90.00</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Pikachu V</TableCell>
                                    <TableCell><Badge variant="outline">LP</Badge></TableCell>
                                    <TableCell>3</TableCell>
                                    <TableCell>$25.00</TableCell>
                                    <TableCell>$75.00</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>$165.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>$5.99</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax</span>
                                <span>$15.00</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>$185.99</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="font-medium">John Doe</p>
                                <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">123 Main Street</p>
                            <p className="text-sm">Apt 4B</p>
                            <p className="text-sm">New York, NY 10001</p>
                            <p className="text-sm">United States</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Fulfillment</span>
                                <Badge>Shipped</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Payment</span>
                                <Badge>Paid</Badge>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-sm font-medium">Tracking Number</p>
                                <p className="text-sm text-muted-foreground">1Z999AA10123456784</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

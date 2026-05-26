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
import { cookies } from "next/headers"
import { format } from "date-fns"
import FulfillmentManager from "@/components/orders/FulfillmentManager"

async function getOrder(id: string) {
    const cookieStore = cookies()
    const token = cookieStore.get('tcg-auth-token')

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${id}`, {
        headers: {
            Authorization: `Bearer ${token?.value}`
        },
        cache: 'no-store'
    })

    if (!res.ok) throw new Error('Failed to fetch order')
    return res.json()
}

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
    const orderId = params.id

    let order;
    try {
        order = await getOrder(orderId)
    } catch (e) {
        return <div className="p-8 text-center text-red-500">Error loading order. Please try again.</div>
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/orders">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Order {orderId.slice(0, 8)}</h1>
                    <p className="text-muted-foreground">{format(new Date(order.createdAt), 'MMMM d, yyyy @ h:mm a')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                        <CardDescription>{order.items?.length || 0} items in this order</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items?.map((item: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell><Badge variant="outline">{item.variantSku || 'N/A'}</Badge></TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>${Number(item.price).toFixed(2)}</TableCell>
                                        <TableCell>${(Number(item.price) * item.quantity).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>${Number(order.total).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>$0.00</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>${Number(order.total).toFixed(2)}</span>
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
                                <p className="font-medium">{order.customer?.firstName} {order.customer?.lastName}</p>
                                <p className="text-sm text-muted-foreground">{order.customer?.email}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm">{order.shippingName || (order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : '')}</p>
                            <p className="text-sm">{order.shippingAddress}</p>
                            <p className="text-sm">
                                {order.shippingCity}
                                {order.shippingState ? `, ${order.shippingState}` : ""} {order.shippingZip}
                            </p>
                            {order.shippingCountry && (
                                <p className="text-xs text-muted-foreground uppercase mt-1">
                                    {order.shippingCountry}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <FulfillmentManager
                        orderId={order.id}
                        initialStatus={order.status}
                        initialTrackingNumber={order.trackingNumber}
                        initialLabelUrl={order.labelUrl}
                    />

                    <Card>
                        <CardHeader>
                            <CardTitle>Order Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Status</span>
                                <Badge>{order.status}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Date</span>
                                <span className="text-sm font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


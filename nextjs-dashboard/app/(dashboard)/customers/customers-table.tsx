import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, User } from "lucide-react"
import { cookies } from "next/headers";

async function getCustomers() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('tcg-auth-token');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token?.value}`,
                'Content-Type': 'application/json',
            }
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.data || []);
    } catch (e) {
        return [];
    }
}

export async function CustomersTable() {
    const customers = await getCustomers();

    return (
        <Card x-chunk="dashboard-customers-chunk-0">
            <CardHeader>
                <CardTitle>Customers</CardTitle>
                <CardDescription>
                    View and manage your registered customers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[50px] sm:table-cell">
                                <span className="sr-only">Avatar</span>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="hidden md:table-cell">Total Orders</TableHead>
                            <TableHead className="hidden md:table-cell">Joined At</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer: any) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <User className="h-5 w-5" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {customer.firstName} {customer.lastName}
                                        {!customer.firstName && !customer.lastName && <span className="text-muted-foreground italic">No Name</span>}
                                    </TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant="secondary">{customer._count?.orders || 0} Orders</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Email Customer</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{customers.length}</strong> customers
                </div>
            </CardFooter>
        </Card>
    )
}

export function CustomersTableSkeleton() {
    return (
        <Card x-chunk="dashboard-customers-skeleton">
            <CardHeader>
                <CardTitle>Customers</CardTitle>
                <CardDescription>View and manage your registered customers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[50px] sm:table-cell"><span className="sr-only">Avatar</span></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="hidden md:table-cell">Total Orders</TableHead>
                            <TableHead className="hidden md:table-cell">Joined At</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                                <TableCell className="hidden sm:table-cell"><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[60px]" /></TableCell>
                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

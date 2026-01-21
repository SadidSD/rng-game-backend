
import { MoreHorizontal, Plus } from "lucide-react"
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cookies } from "next/headers";
import Image from "next/image"

async function getEvents() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('tcg-auth-token');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/admin/list`, {
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

export async function EventsTable() {
    const events = await getEvents();

    return (
        <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader>
                <CardTitle>Events</CardTitle>
                <CardDescription>
                    Manage your upcoming tournaments and events.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="hidden w-[100px] sm:table-cell">
                                <span className="sr-only">Image</span>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Game</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Fee</TableHead>
                            <TableHead>Players</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-4">
                                    No events found. Create one!
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event: any) => (
                                <TableRow key={event.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <div className="relative aspect-video w-full max-w-[80px] overflow-hidden rounded-md bg-muted">
                                            {event.image ? (
                                                <Image
                                                    src={event.image}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-500">
                                                    No Img
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {event.name}
                                        <div className="text-xs text-muted-foreground">{event.format}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{event.game}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(event.date).toLocaleDateString()}
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {Number(event.entryFee) === 0 ? 'Free' : `$${Number(event.entryFee).toFixed(2)}`}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <span>{event._count?.players || 0}</span>
                                            <span className="text-gray-400">/ {event.maxPlayers || '∞'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={event.status === 'UPCOMING' ? 'default' : 'outline'}>
                                            {event.status}
                                        </Badge>
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
                                                <DropdownMenuItem>Edit Event</DropdownMenuItem>
                                                <DropdownMenuItem>Manage Players</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
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
                    Showing <strong>{events.length}</strong> events
                </div>
            </CardFooter>
        </Card>
    )
}

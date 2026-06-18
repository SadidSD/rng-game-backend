"use client";

import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getEventImageUrl = (image: string | null | undefined) => {
    if (!image) return "";
    if (image.startsWith('http://') || image.startsWith('https://')) {
        if (image.includes('/uploads/')) {
            try {
                const url = new URL(image);
                let cleanPath = url.pathname;
                if (cleanPath.startsWith('/api/uploads/')) {
                    cleanPath = cleanPath.substring(4);
                }
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const apiBaseWithoutApi = apiBase.replace(/\/api$/, '');
                return `${apiBaseWithoutApi}${cleanPath}`;
            } catch (e) {
                return image;
            }
        }
        return image;
    }
    // relative path
    let cleanPath = image;
    if (cleanPath.startsWith('/api/uploads/')) {
        cleanPath = cleanPath.substring(4);
    }
    if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const apiBaseWithoutApi = apiBase.replace(/\/api$/, '');
    return `${apiBaseWithoutApi}${cleanPath}`;
};

interface Event {
    id: string;
    name: string;
    description?: string;
    date: string;
    maxPlayers?: number;
    game: string;
    format?: string;
    entryFee: number;
    image?: string;
    prizes?: string;
    location?: string;
    status: string;
    _count?: {
        players: number;
    };
}

interface EventsTableClientProps {
    events: Event[];
}

export function EventsTableClient({ events }: EventsTableClientProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (eventId: string, eventName: string) => {
        if (!confirm(`Are you sure you want to delete the event "${eventName}"?`)) {
            return;
        }

        setIsDeleting(eventId);
        const token = Cookies.get("tcg-auth-token");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                alert("Event deleted successfully.");
                router.refresh();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to delete event: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to delete event", error);
            alert("Network error. Please try again.");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Events</CardTitle>
                <CardDescription>
                    Manage your upcoming tournaments and events.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">
                                    <span className="sr-only">Image</span>
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Game</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead>Fee</TableHead>
                                <TableHead className="hidden sm:table-cell">Players</TableHead>
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
                                events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="relative aspect-video w-full max-w-[80px] overflow-hidden rounded-md bg-muted">
                                                {event.image ? (
                                                    <img
                                                        src={getEventImageUrl(event.image)}
                                                        alt={event.name}
                                                        className="object-cover w-full h-full"
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
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge variant="secondary">{event.game}</Badge>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {new Date(event.date).toLocaleDateString()}
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {Number(event.entryFee) === 0 ? 'Free' : `$${Number(event.entryFee).toFixed(2)}`}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
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
                                                    <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isDeleting === event.id}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/events/${event.id}/edit`}>Edit Event</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/events/${event.id}/players`}>Manage Players</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-red-500 cursor-pointer"
                                                        onClick={() => handleDelete(event.id, event.name)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{events.length}</strong> events
                </div>
            </CardFooter>
        </Card>
    );
}

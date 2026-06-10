"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2, Mail, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getCookie } from "cookies-next";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Player {
    id: string;
    playerName: string;
    playerEmail?: string | null;
    paid: boolean;
    checkedIn: boolean;
    deckList?: string | null;
    createdAt: string;
}

interface Event {
    id: string;
    name: string;
    date: string;
    maxPlayers?: number | null;
    game: string;
    format?: string | null;
    players: Player[];
}

export default function ManagePlayersPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEventAndPlayers = async () => {
            try {
                const token = getCookie("tcg-auth-token");
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const res = await fetch(`${apiUrl}/events/admin/${eventId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                    setPlayers(data.players || []);
                } else {
                    alert("Failed to load event details.");
                    router.push("/events");
                }
            } catch (error) {
                console.error("Error fetching event players", error);
                alert("Network error. Please try again.");
                router.push("/events");
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEventAndPlayers();
        }
    }, [eventId, router]);

    const handleToggleStatus = async (playerId: string, field: "paid" | "checkedIn", value: boolean) => {
        // Optimistic state update
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: value } : p));

        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}/players/${playerId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ [field]: value })
            });

            if (!res.ok) {
                // Revert state if failed
                setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: !value } : p));
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to update status: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            console.error("Error updating status", error);
            // Revert state on error
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: !value } : p));
            alert("Network error updating player status.");
        }
    };

    const handleDeletePlayer = async (playerId: string, playerName: string) => {
        if (!confirm(`Are you sure you want to remove "${playerName}" from this event?`)) {
            return;
        }

        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}/players/${playerId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                setPlayers(prev => prev.filter(p => p.id !== playerId));
                router.refresh();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to remove player: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            console.error("Error removing player", error);
            alert("Error removing player.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!event) return null;

    const maxPlayersVal = event.maxPlayers || 0;
    const registeredCount = players.length;
    const fillPercentage = maxPlayersVal ? Math.min(100, Math.round((registeredCount / maxPlayersVal) * 100)) : 0;

    return (
        <div className="grid gap-6 max-w-4xl mx-auto py-6">
            <div className="flex items-center gap-4">
                <Link href="/events">
                    <Button variant="outline" size="icon" type="button">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {event.game} • {event.format || "Standard"} • {new Date(event.date).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Attendance & Registration Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Players Registered</CardDescription>
                        <CardTitle className="text-3xl">
                            {registeredCount} <span className="text-sm font-normal text-muted-foreground">/ {event.maxPlayers || "∞"}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {maxPlayersVal ? (
                            <div className="mt-2 w-full bg-secondary rounded-full h-2">
                                <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${fillPercentage}%` }}
                                />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Players Paid</CardDescription>
                        <CardTitle className="text-3xl">
                            {players.filter(p => p.paid).length} <span className="text-sm font-normal text-muted-foreground">/ {registeredCount}</span>
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Checked In</CardDescription>
                        <CardTitle className="text-3xl font-bold text-green-600">
                            {players.filter(p => p.checkedIn).length} <span className="text-sm font-normal text-muted-foreground">/ {registeredCount}</span>
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Players List Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Registered Players</CardTitle>
                    <CardDescription>
                        Mark payments, attendance, and manage player lists.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Player</TableHead>
                                    <TableHead className="hidden md:table-cell">Email</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Checked In</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            No players registered for this event yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    players.map((player) => (
                                        <TableRow key={player.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{player.playerName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {player.playerEmail ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="h-4 w-4" />
                                                        <span>{player.playerEmail}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No Email</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch 
                                                        checked={player.paid}
                                                        onCheckedChange={(val) => handleToggleStatus(player.id, "paid", val)}
                                                    />
                                                    <Badge variant={player.paid ? "default" : "outline"} className="text-[10px] py-0">
                                                        {player.paid ? "Paid" : "Unpaid"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch 
                                                        checked={player.checkedIn}
                                                        onCheckedChange={(val) => handleToggleStatus(player.id, "checkedIn", val)}
                                                    />
                                                    <Badge variant={player.checkedIn ? "secondary" : "outline"} className="text-[10px] py-0">
                                                        {player.checkedIn ? "Here" : "Absent"}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDeletePlayer(player.id, player.playerName)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

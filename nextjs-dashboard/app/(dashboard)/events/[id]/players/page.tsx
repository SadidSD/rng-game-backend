"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Trash2, Mail, User, Clock, CheckCircle2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Player {
    id: string;
    playerName: string;
    playerEmail?: string | null;
    paid: boolean;
    checkedIn: boolean;
    deckList?: string | null;
    createdAt: string;
    ticket?: { qrCode: string } | null;
}

interface WaitlistEntry {
    id: string;
    playerName: string;
    playerEmail: string;
    position: number;
    notified: boolean;
    createdAt: string;
}

interface Event {
    id: string;
    name: string;
    date: string;
    maxPlayers?: number | null;
    game: string;
    format?: string | null;
    entryFee: number;
    players: Player[];
    waitlist: WaitlistEntry[];
}

export default function ManagePlayersPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEventAndPlayers = async () => {
            try {
                const token = getCookie("tcg-auth-token");
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const res = await fetch(`${apiUrl}/events/admin/${eventId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                    setPlayers(data.players || []);
                    setWaitlist(data.waitlist || []);
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

        if (eventId) fetchEventAndPlayers();
    }, [eventId, router]);

    const handleToggleStatus = async (playerId: string, field: "paid" | "checkedIn", value: boolean) => {
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: value } : p));
        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}/players/${playerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ [field]: value })
            });
            if (!res.ok) {
                setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: !value } : p));
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to update status: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, [field]: !value } : p));
            alert("Network error updating player status.");
        }
    };

    const handleDeletePlayer = async (playerId: string, playerName: string) => {
        if (!confirm(`Remove "${playerName}" from this event? The next person on the waitlist will be automatically promoted.`)) return;

        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}/players/${playerId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const result = await res.json();
                setPlayers(prev => prev.filter(p => p.id !== playerId));

                if (result.promoted) {
                    alert(`✅ ${result.promoted.playerName} has been promoted from the waitlist and notified.`);
                    // Refresh to get the new player record
                    router.refresh();
                    const token2 = getCookie("tcg-auth-token");
                    const apiUrl2 = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                    const refreshed = await fetch(`${apiUrl2}/events/admin/${eventId}`, {
                        headers: { Authorization: `Bearer ${token2}` }
                    });
                    if (refreshed.ok) {
                        const data = await refreshed.json();
                        setPlayers(data.players || []);
                        setWaitlist(data.waitlist || []);
                    }
                } else {
                    setWaitlist(prev => prev.slice(1).map((w, i) => ({ ...w, position: i + 1 })));
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to remove player: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            alert("Error removing player.");
        }
    };

    const handleRemoveFromWaitlist = async (waitlistId: string, playerName: string) => {
        if (!confirm(`Remove "${playerName}" from the waitlist?`)) return;

        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}/waitlist/${waitlistId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setWaitlist(prev => prev.filter(w => w.id !== waitlistId).map((w, i) => ({ ...w, position: i + 1 })));
            } else {
                alert("Failed to remove from waitlist.");
            }
        } catch {
            alert("Network error.");
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
            {/* Header */}
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

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Registered</CardDescription>
                        <CardTitle className="text-3xl">
                            {registeredCount} <span className="text-sm font-normal text-muted-foreground">/ {event.maxPlayers || "∞"}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {maxPlayersVal ? (
                            <div className="mt-2 w-full bg-secondary rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${fillPercentage}%` }} />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Paid</CardDescription>
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

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Waitlist</CardDescription>
                        <CardTitle className="text-3xl font-bold text-amber-500">
                            {waitlist.length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs: Players | Waitlist */}
            <Tabs defaultValue="players">
                <TabsList>
                    <TabsTrigger value="players">
                        Players ({registeredCount})
                    </TabsTrigger>
                    <TabsTrigger value="waitlist">
                        Waitlist {waitlist.length > 0 && `(${waitlist.length})`}
                    </TabsTrigger>
                </TabsList>

                {/* Players Tab */}
                <TabsContent value="players">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Players</CardTitle>
                            <CardDescription>Mark payments and check-in status. Removing a player auto-promotes the next waitlist entry.</CardDescription>
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
                                            <TableHead>Ticket</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {players.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                                    No players registered yet.
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
                                                    <TableCell>
                                                        {player.ticket ? (
                                                            <div className="flex items-center gap-1 text-green-600">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span className="text-xs">Issued</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">No ticket</span>
                                                        )}
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
                </TabsContent>

                {/* Waitlist Tab */}
                <TabsContent value="waitlist">
                    <Card>
                        <CardHeader>
                            <CardTitle>Waitlist</CardTitle>
                            <CardDescription>
                                People waiting for a spot. They are automatically promoted when a registered player is removed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {waitlist.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                    No one on the waitlist.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            waitlist.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono">#{entry.position}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {entry.playerName}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Mail className="h-4 w-4" />
                                                            {entry.playerEmail}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(entry.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleRemoveFromWaitlist(entry.id, entry.playerName)}
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
                </TabsContent>
            </Tabs>
        </div>
    );
}

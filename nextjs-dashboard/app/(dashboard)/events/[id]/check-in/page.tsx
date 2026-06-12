"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Camera, Search, User, X, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { getCookie } from "cookies-next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Player {
    id: string;
    playerName: string;
    playerEmail?: string | null;
    paid: boolean;
    checkedIn: boolean;
    deckList?: string | null;
}

interface Event {
    id: string;
    name: string;
    date: string;
    maxPlayers?: number | null;
    game: string;
    players: Player[];
}

interface Toast {
    type: "success" | "warning" | "error";
    message: string;
}

export default function CheckInPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [scannerActive, setScannerActive] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const scannerRef = useRef<any>(null);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch event details and player roster
    const fetchEventData = async () => {
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
            } else {
                alert("Failed to load event details.");
                router.push("/events");
            }
        } catch (error) {
            console.error("Error fetching event players", error);
            alert("Network error.");
            router.push("/events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (eventId) fetchEventData();
    }, [eventId]);

    // Show toast message with auto-hide
    const showToast = (type: "success" | "warning" | "error", message: string) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ type, message });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    // Clean up scanner and timeout on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        };
    }, []);

    // Toggle Camera Scanner
    const toggleScanner = async () => {
        if (scannerActive) {
            if (scannerRef.current) {
                await scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            setScannerActive(false);
        } else {
            setScannerActive(true);
            // Wait for DOM node to render
            setTimeout(() => {
                startScanning();
            }, 300);
        }
    };

    // Initialize and start QR scanning
    const startScanning = () => {
        try {
            const { Html5QrcodeScanner } = require("html5-qrcode");
            
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        } catch (err) {
            console.error("Failed to initialize scanner", err);
            showToast("error", "Could not access camera. Please check camera permissions.");
            setScannerActive(false);
        }
    };

    // Scanned callback
    const onScanSuccess = async (decodedText: string) => {
        try {
            // Attempt to parse QR code JSON
            const payload = JSON.parse(decodedText);
            const scannedPlayerId = payload.playerId;
            const scannedEventId = payload.eventId;

            if (scannedEventId !== eventId) {
                showToast("error", "Invalid ticket - This ticket is for another event.");
                return;
            }

            await handleCheckInPlayer(scannedPlayerId, "qr");
        } catch (err) {
            // Decoded text is not JSON
            showToast("error", "Invalid QR code - Ticket is unrecognized.");
        }
    };

    const onScanFailure = (error: any) => {
        // Suppress console spam for scan failures (common when search occurs)
    };

    // Core check-in handler
    const handleCheckInPlayer = async (playerId: string, source: "qr" | "manual") => {
        const player = players.find(p => p.id === playerId);
        if (!player) {
            showToast("error", "Invalid ticket - Player record not found.");
            return;
        }

        if (player.checkedIn) {
            showToast("warning", `${player.playerName} is already checked in!`);
            return;
        }

        setIsUpdating(playerId);
        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}/players/${playerId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ checkedIn: true })
            });

            if (res.ok) {
                setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, checkedIn: true } : p));
                showToast("success", `Valid ticket - ${player.playerName} is checked in.`);
                
                // If scanned via QR, play a success audio cue if possible
                if (source === "qr") {
                    try {
                        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
                        audio.volume = 0.3;
                        audio.play().catch(() => {});
                    } catch {}
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast("error", `Check-in failed: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            showToast("error", "Network error updating check-in status.");
        } finally {
            setIsUpdating(null);
        }
    };

    // Filter players based on search query
    const filteredPlayers = players.filter(p => {
        const q = searchQuery.toLowerCase();
        return p.playerName.toLowerCase().includes(q) || 
               (p.playerEmail && p.playerEmail.toLowerCase().includes(q));
    });

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading roster...</p>
            </div>
        );
    }

    if (!event) return null;

    const checkedInCount = players.filter(p => p.checkedIn).length;
    const totalCount = players.length;

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href={`/events/${eventId}/players`}>
                        <Button variant="ghost" size="icon" type="button">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">At-the-Door Check-in</h1>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{event.name}</p>
                    </div>
                </div>
                <Badge variant="secondary" className="px-2.5 py-1 text-sm font-semibold">
                    {checkedInCount} / {totalCount} In
                </Badge>
            </div>

            {/* Live Scan Notification Toast */}
            {toast && (
                <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-start gap-3 border transition-all animate-in slide-in-from-top-4 duration-300 ${
                    toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" :
                    toast.type === "warning" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                    "bg-red-50 text-red-800 border-red-200"
                }`}>
                    {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
                    {toast.type === "warning" && <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />}
                    {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />}
                    <div className="flex-1 text-sm font-medium">{toast.message}</div>
                    <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* QR Scanner Module */}
            <Card className="overflow-hidden border-2">
                <CardHeader className="bg-muted/40 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        Camera QR Scanner
                    </CardTitle>
                    <CardDescription>
                        Scan tickets displayed on players' mobile screens
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 text-center space-y-4">
                    {scannerActive ? (
                        <div className="space-y-4">
                            <div className="overflow-hidden rounded-xl border border-border bg-black max-w-sm mx-auto">
                                <div id="reader" className="w-full" />
                            </div>
                            <Button variant="outline" onClick={toggleScanner} className="w-full">
                                Stop Camera Scanner
                            </Button>
                        </div>
                    ) : (
                        <div className="py-8 border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center gap-3 bg-muted/10">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Camera className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Camera Offline</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Start scanning to activate the device camera</p>
                            </div>
                            <Button onClick={toggleScanner} className="mt-2">
                                Start QR Scanner
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Roster & Search Backup Module */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Attendee Search
                    </CardTitle>
                    <CardDescription>
                        Search by name or email for manual entry backup
                    </CardDescription>
                    <div className="pt-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search playerName or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-lg"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="divide-y divide-border border-t max-h-[300px] overflow-y-auto">
                        {filteredPlayers.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                No players found matching search.
                            </div>
                        ) : (
                            filteredPlayers.map((player) => (
                                <div key={player.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0 pr-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${player.checkedIn ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate text-foreground">{player.playerName}</p>
                                            <p className="text-xs text-muted-foreground truncate">{player.playerEmail || "No email"}</p>
                                        </div>
                                    </div>

                                    {player.checkedIn ? (
                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 shrink-0 gap-1">
                                            <Check className="h-3.5 w-3.5" />
                                            Checked In
                                        </Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => handleCheckInPlayer(player.id, "manual")}
                                            disabled={isUpdating === player.id}
                                            className="shrink-0"
                                        >
                                            {isUpdating === player.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                "Check In"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, X, ArrowLeft, Trophy, Calendar, MapPin, Users, Gamepad2, Sparkles, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCookie } from "cookies-next";

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

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        date: "", // datetime-local format
        maxPlayers: 32,
        entryFee: 0,
        game: "MTG",
        format: "Standard",
        status: "UPCOMING",
        prizes: "",
        location: "In-Store"
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const token = getCookie("tcg-auth-token");
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const res = await fetch(`${apiUrl}/events/admin/${eventId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const event = await res.json();
                    
                    // Format Date to YYYY-MM-DDTHH:MM for input type="datetime-local"
                    let formattedDate = "";
                    if (event.date) {
                        const dateObj = new Date(event.date);
                        // Adjust to local timezone format
                        const offset = dateObj.getTimezoneOffset();
                        const localDateObj = new Date(dateObj.getTime() - offset * 60 * 1000);
                        formattedDate = localDateObj.toISOString().slice(0, 16);
                    }

                    setFormData({
                        name: event.name || "",
                        description: event.description || "",
                        date: formattedDate,
                        maxPlayers: event.maxPlayers ?? 32,
                        entryFee: Number(event.entryFee) || 0,
                        game: event.game || "MTG",
                        format: event.format || "Standard",
                        status: event.status || "UPCOMING",
                        prizes: event.prizes || "",
                        location: event.location || "In-Store"
                    });
                    setImageUrl(event.image || "");
                } else {
                    alert("Failed to load event details.");
                    router.push("/events");
                }
            } catch (error) {
                console.error("Error fetching event details", error);
                alert("Network error. Please try again.");
                router.push("/events");
            } finally {
                setFetching(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId, router]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        const form = new FormData();
        form.append("file", file);
        setUploading(true);

        try {
            const token = getCookie("tcg-auth-token");
            const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/uploads`;
            const res = await fetch(uploadUrl, {
                method: "POST",
                body: form,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                const fullUrl = data.url.startsWith("http")
                    ? data.url
                    : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${data.url}`;
                setImageUrl(fullUrl);
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            console.error(error);
            alert("Upload error");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            image: imageUrl,
            date: new Date(formData.date).toISOString(),
            maxPlayers: Number(formData.maxPlayers),
            entryFee: Number(formData.entryFee),
        };

        try {
            const token = getCookie("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/events/${eventId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push("/events");
                router.refresh();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to update event: ${errData.message || res.statusText}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error updating event");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Header Area */}
            <div className="flex flex-col gap-2 border-b pb-5">
                <div className="flex items-center gap-3">
                    <Link href="/events">
                        <Button variant="outline" size="icon" type="button" className="rounded-xl h-9 w-9 border-slate-200 dark:border-slate-800">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="p-2 bg-violet-100 rounded-lg text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Tournament Event</h1>
                </div>
                <p className="text-sm text-muted-foreground ml-20">
                    Modify scheduling details, update status, banner, pricing, or max players for this event.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Core event details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Gamepad2 className="h-4 w-4 text-violet-500" />
                                <CardTitle className="text-base font-semibold">Event Identity & Schedule</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Event Title</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Event Name"
                                    className="w-full focus-visible:ring-2 focus-visible:ring-violet-500"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="game" className="text-sm font-semibold">Game Title</Label>
                                    <Select
                                        value={formData.game}
                                        onValueChange={(val) => setFormData({ ...formData, game: val })}
                                    >
                                        <SelectTrigger className="focus:ring-2 focus:ring-violet-500">
                                            <SelectValue placeholder="Select Game" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MTG">Magic: The Gathering</SelectItem>
                                            <SelectItem value="Pokemon">Pokémon TCG</SelectItem>
                                            <SelectItem value="Yu-Gi-Oh!">Yu-Gi-Oh!</SelectItem>
                                            <SelectItem value="Lorcana">Lorcana</SelectItem>
                                            <SelectItem value="OnePiece">One Piece Card Game</SelectItem>
                                            <SelectItem value="Other">Other TCG</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="format" className="text-sm font-semibold">Tournament Format</Label>
                                    <Input
                                        id="format"
                                        placeholder="e.g. Standard, Sealed, Draft"
                                        className="focus-visible:ring-2 focus-visible:ring-violet-500"
                                        value={formData.format}
                                        onChange={e => setFormData({ ...formData, format: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Date & Time
                                    </Label>
                                    <Input
                                        id="date"
                                        type="datetime-local"
                                        className="focus-visible:ring-2 focus-visible:ring-violet-500"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location / Room
                                    </Label>
                                    <Input
                                        id="location"
                                        placeholder="Location"
                                        className="focus-visible:ring-2 focus-visible:ring-violet-500"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-violet-500" />
                                <CardTitle className="text-base font-semibold">Rules & Rewards</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="description" className="text-sm font-semibold">Description & Rules</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Event description"
                                    className="min-h-[140px] focus-visible:ring-2 focus-visible:ring-violet-500 resize-y"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="prizes" className="text-sm font-semibold flex items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 text-yellow-500" /> Prize Pool Details
                                </Label>
                                <Input
                                    id="prizes"
                                    placeholder="Booster packs, store credits, etc..."
                                    className="focus-visible:ring-2 focus-visible:ring-violet-500"
                                    value={formData.prizes}
                                    onChange={e => setFormData({ ...formData, prizes: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Banner & Configuration */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-4 px-6">
                            <CardTitle className="text-base font-semibold">Event Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-2">
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger className="focus:ring-2 focus:ring-violet-500">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UPCOMING">Upcoming</SelectItem>
                                        <SelectItem value="ONGOING">Ongoing</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Banner Card */}
                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Upload className="h-4 w-4 text-violet-500" />
                                <CardTitle className="text-base font-semibold">Event Banner</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {imageUrl ? (
                                <div className="relative aspect-[16/10] w-full rounded-xl object-cover bg-slate-50 border overflow-hidden shadow-inner group">
                                    <img
                                        alt="Event banner image"
                                        className="object-cover transition-transform duration-300 group-hover:scale-105 w-full h-full"
                                        src={getEventImageUrl(imageUrl)}
                                    />
                                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                                        <button
                                            type="button"
                                            onClick={() => setImageUrl("")}
                                            className="bg-red-500/95 hover:bg-red-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" /> Remove Image
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center aspect-[16/10] w-full rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 p-4 text-center">
                                    <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-full mb-3 shadow-sm">
                                        <Upload className="h-6 w-6 animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload event banner</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px]">Supports PNG, JPG up to 2MB (16:10 ratio recommended)</p>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="event-image-upload"
                                    className={`w-full flex items-center justify-center gap-2 cursor-pointer font-medium text-sm text-white py-2.5 px-4 rounded-xl shadow-sm transition-all duration-200 ${uploading ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 hover:shadow active:scale-[0.98]'}`}
                                >
                                    <Upload size={16} />
                                    {uploading ? "Uploading banner..." : "Choose File"}
                                </label>
                                <Input
                                    id="event-image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    disabled={uploading}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ticketing Settings */}
                    <Card className="border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-violet-500" />
                                <CardTitle className="text-base font-semibold">Ticketing & Limits</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="entryFee" className="text-sm font-semibold">Entry Fee ($)</Label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                                    <Input
                                        id="entryFee"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="pl-8 focus-visible:ring-2 focus-visible:ring-violet-500 font-medium"
                                        value={formData.entryFee || ""}
                                        onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="maxPlayers" className="text-sm font-semibold">Maximum Capacity</Label>
                                <div className="relative">
                                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        id="maxPlayers"
                                        type="number"
                                        min="1"
                                        className="pl-9 focus-visible:ring-2 focus-visible:ring-violet-500 font-medium"
                                        value={formData.maxPlayers}
                                        onChange={e => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t pt-6 gap-4">
                <Button variant="outline" type="button" size="lg" className="rounded-xl px-6" onClick={() => router.push('/events')}>
                    Cancel
                </Button>
                <Button type="submit" size="lg" className="rounded-xl px-8 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all text-white font-semibold shadow-md" disabled={loading}>
                    {loading ? "Saving changes..." : "Save changes"}
                </Button>
            </div>
        </form>
    );
}

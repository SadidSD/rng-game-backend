"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Upload, X, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCookie } from "cookies-next";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="grid auto-rows-max gap-4 max-w-2xl mx-auto py-6">
            <div className="flex items-center gap-4">
                <Link href="/events">
                    <Button variant="outline" size="icon" type="button">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold tracking-tight">Edit Event</h1>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>
                        Modify the details for this event.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="name">Event Name</Label>
                            <Input
                                id="name"
                                type="text"
                                className="w-full"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <Label htmlFor="game">Game</Label>
                                <Select
                                    value={formData.game}
                                    onValueChange={(val) => setFormData({ ...formData, game: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Game" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MTG">Magic: The Gathering</SelectItem>
                                        <SelectItem value="Pokemon">Pokémon</SelectItem>
                                        <SelectItem value="Yu-Gi-Oh!">Yu-Gi-Oh!</SelectItem>
                                        <SelectItem value="Lorcana">Lorcana</SelectItem>
                                        <SelectItem value="OnePiece">One Piece</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="format">Format</Label>
                                <Input
                                    id="format"
                                    placeholder="e.g. Standard, Commander"
                                    value={formData.format}
                                    onChange={e => setFormData({ ...formData, format: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <Label htmlFor="date">Date & Time</Label>
                                <Input
                                    id="date"
                                    type="datetime-local"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="status">Event Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <Label htmlFor="entryFee">Entry Fee ($)</Label>
                                <Input
                                    id="entryFee"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.entryFee}
                                    onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="maxPlayers">Max Players</Label>
                                <Input
                                    id="maxPlayers"
                                    type="number"
                                    min="1"
                                    value={formData.maxPlayers}
                                    onChange={e => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g. In-Store, Online"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                className="min-h-32"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label htmlFor="prizes">Prize Support</Label>
                            <Input
                                id="prizes"
                                placeholder="e.g. 2 Packs per win"
                                value={formData.prizes}
                                onChange={e => setFormData({ ...formData, prizes: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Event Banner</Label>
                            {imageUrl ? (
                                <div className="relative aspect-video w-full rounded-md object-cover bg-gray-100 overflow-hidden">
                                    <Image
                                        alt="Event image"
                                        className="object-cover"
                                        fill
                                        src={imageUrl}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed text-gray-400">
                                    <Upload className="h-8 w-8" />
                                    <span className="sr-only">Upload</span>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="event-image-upload" className="cursor-pointer bg-black text-white py-2 px-4 rounded text-center hover:bg-gray-800">
                                    {loading ? "Uploading..." : "Upload Image"}
                                </Label>
                                <Input
                                    id="event-image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleUpload}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-between border-t p-4">
                    <Button variant="outline" type="button" onClick={() => router.push("/events")}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

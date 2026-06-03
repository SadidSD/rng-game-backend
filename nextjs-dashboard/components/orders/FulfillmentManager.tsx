"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Truck, ExternalLink, Printer, Check, Copy } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface FulfillmentManagerProps {
    orderId: string;
    initialStatus: string;
    initialTrackingNumber?: string | null;
    initialLabelUrl?: string | null;
}

export default function FulfillmentManager({
    orderId,
    initialStatus,
    initialTrackingNumber,
    initialLabelUrl
}: FulfillmentManagerProps) {
    const router = useRouter();
    const [status, setStatus] = useState(initialStatus);
    const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || "");
    const [carrier, setCarrier] = useState("USPS");
    const [fulfilling, setFulfilling] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFulfill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) return;

        setFulfilling(true);
        setError(null);
        try {
            const token = Cookies.get("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://rng-game-backend-cx6f.onrender.com/api";
            
            const res = await axios.patch(
                `${apiUrl}/orders/${orderId}`,
                {
                    status: "SHIPPED",
                    trackingNumber: trackingNumber.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setStatus(res.data.status);
            setTrackingNumber(res.data.trackingNumber || trackingNumber.trim());
            router.refresh();
        } catch (err: any) {
            console.error("Failed to fulfill order", err);
            setError(err.response?.data?.message || "Failed to mark order as shipped.");
        } finally {
            setFulfilling(false);
        }
    };

    const copyTracking = () => {
        if (trackingNumber) {
            navigator.clipboard.writeText(trackingNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getTrackingUrl = () => {
        if (!trackingNumber) return "";
        switch (carrier.toUpperCase()) {
            case "UPS":
                return `https://www.ups.com/track?tracknum=${trackingNumber}`;
            case "FEDEX":
                return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
            default:
                return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
        }
    };

    // FULFILLED OR SHIPPED STATE
    if (status === "SHIPPED" || status === "COMPLETED") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5 text-green-500" />
                        Fulfillment Complete
                    </CardTitle>
                    <CardDescription>Order is fulfilled and tracking is recorded</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground block uppercase">USPS/UPS TRACKING NUMBER</span>
                            <span className="font-mono text-sm font-bold block">{trackingNumber}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copyTracking}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        {trackingNumber && (
                            <Button className="w-full" variant="outline" asChild>
                                <a 
                                    href={getTrackingUrl()} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    Track Shipment
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // PENDING PAYMENT STATE
    if (status === "PENDING") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                        Fulfillment Locked
                    </CardTitle>
                    <CardDescription>Waiting for payment completion</CardDescription>
                </CardHeader>
                <CardContent className="py-4 text-center text-sm text-muted-foreground bg-secondary/20 rounded-lg mx-6 mb-6">
                    Fulfillment and tracking entry can only be completed once the order is PAID.
                </CardContent>
            </Card>
        );
    }

    // CANCELLED STATE
    if (status === "CANCELLED") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg text-destructive flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Fulfillment Cancelled
                    </CardTitle>
                    <CardDescription>Order is cancelled</CardDescription>
                </CardHeader>
                <CardContent className="py-4 text-center text-sm text-destructive bg-destructive/10 rounded-lg mx-6 mb-6">
                    Fulfillment is disabled for cancelled orders.
                </CardContent>
            </Card>
        );
    }

    // READY TO SHIP STATE (PAID)
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5 text-purple-500" />
                    Fulfill Order (Pirate Ship)
                </CardTitle>
                <CardDescription>Mark as shipped by entering Pirate Ship tracking info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={handleFulfill} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="carrier">Carrier</Label>
                        <Select value={carrier} onValueChange={setCarrier}>
                            <SelectTrigger id="carrier">
                                <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USPS">USPS</SelectItem>
                                <SelectItem value="UPS">UPS</SelectItem>
                                <SelectItem value="FedEx">FedEx</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tracking">Tracking Number</Label>
                        <Input
                            id="tracking"
                            placeholder="Enter Pirate Ship tracking number..."
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
                            {error}
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full bg-purple-600 hover:bg-purple-750 text-white font-semibold flex items-center justify-center gap-2"
                        disabled={fulfilling || !trackingNumber.trim()}
                    >
                        {fulfilling ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Fulfilling...
                            </>
                        ) : (
                            <>
                                <Truck className="h-4 w-4" />
                                Mark as Shipped
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

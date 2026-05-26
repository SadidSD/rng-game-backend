"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Truck, ExternalLink, Printer, Check, Copy } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

interface Rate {
    id: string;
    carrier: string;
    service: string;
    rate: string;
    deliveryDays: number | null;
    estDeliveryDate: string | null;
}

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
    const [status, setStatus] = useState(initialStatus);
    const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || null);
    const [labelUrl, setLabelUrl] = useState(initialLabelUrl || null);

    const [loadingRates, setLoadingRates] = useState(false);
    const [rates, setRates] = useState<Rate[]>([]);
    const [shipmentId, setShipmentId] = useState<string | null>(null);
    const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
    const [fulfilling, setFulfilling] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRates = async () => {
        setLoadingRates(true);
        setError(null);
        try {
            const token = Cookies.get("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://rng-game-backend-cx6f.onrender.com/api";
            const res = await axios.get(`${apiUrl}/orders/${orderId}/rates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRates(res.data.rates);
            setShipmentId(res.data.shipmentId);
            if (res.data.rates.length > 0) {
                // Auto-select the cheapest rate
                const cheapest = res.data.rates.reduce((prev: Rate, curr: Rate) => 
                    Number(prev.rate) < Number(curr.rate) ? prev : curr
                );
                setSelectedRateId(cheapest.id);
            }
        } catch (err: any) {
            console.error("Failed to fetch shipping rates", err);
            setError(err.response?.data?.message || "Failed to fetch shipping rates.");
        } finally {
            setLoadingRates(false);
        }
    };

    const handleFulfill = async () => {
        if (!shipmentId || !selectedRateId) return;

        setFulfilling(true);
        setError(null);
        try {
            const token = Cookies.get("tcg-auth-token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://rng-game-backend-cx6f.onrender.com/api";
            const res = await axios.post(
                `${apiUrl}/orders/${orderId}/fulfill`,
                {
                    easypostRateId: selectedRateId,
                    easypostShipmentId: shipmentId
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setStatus(res.data.status);
            setTrackingNumber(res.data.trackingNumber);
            setLabelUrl(res.data.labelUrl);
        } catch (err: any) {
            console.error("Failed to purchase shipping label", err);
            setError(err.response?.data?.message || "Failed to purchase postage label.");
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

    // FULFILLED OR SHIPPED STATE
    if (status === "SHIPPED" || status === "COMPLETED") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5 text-green-500" />
                        Fulfillment Complete
                    </CardTitle>
                    <CardDescription>Postage purchased and shipped</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">USPS TRACKING NUMBER</span>
                            <span className="font-mono text-sm font-bold block">{trackingNumber}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copyTracking}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        {labelUrl && (
                            <Button className="flex-1" variant="outline" asChild>
                                <a href={labelUrl} target="_blank" rel="noopener noreferrer">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Label
                                </a>
                            </Button>
                        )}
                        {trackingNumber && (
                            <Button className="flex-1" variant="outline" asChild>
                                <a 
                                    href={`https://tools.usps.com/go/TrackConfirmAction?qtc_tcd1=${trackingNumber}`} 
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
                    Shipping rates can only be calculated once the payment status is PAID.
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
                    Ship Order
                </CardTitle>
                <CardDescription>Buy USPS postage via EasyPost</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rates.length === 0 ? (
                    <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        onClick={fetchRates} 
                        disabled={loadingRates}
                    >
                        {loadingRates ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Calculating Rates...
                            </>
                        ) : (
                            "Calculate USPS Rates"
                        )}
                    </Button>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {rates.map((rate) => (
                                <label 
                                    key={rate.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedRateId === rate.id 
                                            ? "border-purple-500 bg-purple-500/5" 
                                            : "border-border hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="radio" 
                                            name="shipping_rate"
                                            value={rate.id}
                                            checked={selectedRateId === rate.id}
                                            onChange={() => setSelectedRateId(rate.id)}
                                            className="accent-purple-600"
                                        />
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-foreground">
                                                {rate.carrier} {rate.service}
                                            </p>
                                            {rate.deliveryDays && (
                                                <p className="text-xs text-muted-foreground">
                                                    Est. Delivery: {rate.deliveryDays} days
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold text-foreground">
                                        ${Number(rate.rate).toFixed(2)}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setRates([])}
                                disabled={fulfilling}
                            >
                                Reset
                            </Button>
                            <Button 
                                className="flex-grow bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                                onClick={handleFulfill}
                                disabled={fulfilling || !selectedRateId}
                            >
                                {fulfilling ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Buying Label...
                                    </>
                                ) : (
                                    "Buy Label & Ship"
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg text-left">
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

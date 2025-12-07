"use client"

import { Button } from "@/components/ui/button"
import { PlusCircle, Calendar, Package, FileText } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Button asChild className="h-24 flex-col gap-2">
                <Link href="/products/new">
                    <PlusCircle className="h-6 w-6" />
                    <span className="text-sm">Add Product</span>
                </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <Link href="/events">
                    <Calendar className="h-6 w-6" />
                    <span className="text-sm">Create Event</span>
                </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <Link href="/buylist">
                    <Package className="h-6 w-6" />
                    <span className="text-sm">Process Buylist</span>
                </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2">
                <Link href="/analytics">
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">View Reports</span>
                </Link>
            </Button>
        </div>
    )
}

import { Button } from "@/components/ui/button"

export default function CustomersPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Customer management is coming soon.</p>
            <Button variant="outline">View All Customers</Button>
        </div>
    )
}

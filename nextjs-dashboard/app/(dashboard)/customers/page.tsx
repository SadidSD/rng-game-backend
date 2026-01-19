import { Suspense } from "react"
import { CustomersTable, CustomersTableSkeleton } from "./customers-table"

export default function CustomersPage() {
    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 py-4">
            <Suspense fallback={<CustomersTableSkeleton />}>
                <CustomersTable />
            </Suspense>
        </div>
    )
}

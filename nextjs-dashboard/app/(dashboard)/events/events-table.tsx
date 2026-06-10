
import { cookies } from "next/headers";
import { EventsTableClient } from "./events-table-client";

async function getEvents() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('tcg-auth-token');

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/admin/list`, {
            cache: 'no-store',
            headers: {
                Authorization: `Bearer ${token?.value}`,
                'Content-Type': 'application/json',
            }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
}

export async function EventsTable() {
    const events = await getEvents();
    return <EventsTableClient events={events} />;
}



import { NextResponse } from 'next/server';
import dns from 'node:dns';

// FORCE IPv4: Fixes timeouts with Node 18+ on Vercel/AWS
dns.setDefaultResultOrder('ipv4first');

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim();

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    let debugUrl = '';

    try {
        // Scryfall Query Construction
        // unique=prints: Fetch all printing versions (sets)
        // order=released: Sort by newest sets first

        const baseUrl = 'https://api.scryfall.com/cards/search';
        const params = new URLSearchParams({
            q: query,
            unique: 'prints',
            order: 'released',
            dir: 'desc'
        });

        debugUrl = `${baseUrl}?${params.toString()}`;

        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000);

        const res = await fetch(debugUrl, {
            headers: {
                'Accept': 'application/json',
                // Scryfall politely requests a User-Agent
                'User-Agent': 'TCG-SaaS-Client/1.0'
            },
            signal: controller.signal,
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) {
            // Scryfall 404 means no cards found, return empty list instead of error
            if (res.status === 404) {
                return NextResponse.json({ data: [] });
            }
            throw new Error(`Upstream ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json(
            {
                error: 'Scryfall fetch failed',
                details: err.message,
                debug: debugUrl
            },
            { status: 500 }
        );
    }
}

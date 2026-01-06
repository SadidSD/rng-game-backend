import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('query')?.trim();
    const setName = searchParams.get('set')?.trim();

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const apiKey = process.env.POKEMON_TCG_API_KEY;
    let debugUrl = '';

    try {
        // SAFE Lucene query
        const tokens = query.split(/\s+/);
        let lucene = tokens.map(t => `name:${t}`).join(' AND ');

        if (setName) {
            lucene += ` AND set.name:"${setName}"`;
        }

        // PERMANENT FIX: Do NOT use URLSearchParams for 'q' because it encodes ':' to '%3A'
        // which causes Upstream 404s. We must construct the URL string manually.

        const baseUrl = 'https://api.pokemontcg.io/v2/cards';
        const params = new URLSearchParams({
            pageSize: '12',
            orderBy: '-set.releaseDate'
            // REMOVED 'select' to avoid encoding issues (%2C) and ensure stability.
            // We will fetch the full object.
        });

        // Manually concat 'q' to ensure it remains raw (name:Charizard)
        debugUrl = `${baseUrl}?q=${lucene}&${params.toString()}`;

        const controller = new AbortController();
        // Increased timeout to 15s to handle slow cold starts
        setTimeout(() => controller.abort(), 15000);

        const res = await fetch(debugUrl, {
            headers: {
                'X-Api-Key': apiKey || '',
                'Accept': 'application/json'
            },
            signal: controller.signal,
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            throw new Error(`Upstream ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json(
            {
                error: 'PokemonTCG fetch failed',
                details: err.message,
                debug: debugUrl
            },
            { status: 500 }
        );
    }
}

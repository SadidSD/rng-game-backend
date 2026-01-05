
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure this runs in Node.js environment

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    try {
        const hasSpaces = query.includes(' ');
        const queryString = hasSpaces ? `name:"${query}"` : `name:${query}*`;

        console.log(`Proxying to PokemonTCG: ${queryString}`);

        const apiKey = process.env.POKEMON_TCG_API_KEY;

        // Use standard URL construction
        const upstreamUrl = new URL('https://api.pokemontcg.io/v2/cards');
        upstreamUrl.searchParams.set('q', queryString);
        upstreamUrl.searchParams.set('pageSize', '12');
        upstreamUrl.searchParams.set('orderBy', '-set.releaseDate');
        upstreamUrl.searchParams.set('select', 'id,name,set,rarity,images,cardmarket'); // Keep payload light

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            // Spoof real browser to avoid 403/404 from strict WAFs
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        const res = await fetch(upstreamUrl.toString(), {
            method: 'GET',
            headers,
            next: { revalidate: 0 }, // Disable cache to prevent poisoning
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Upstream Error ${res.status}: ${errorBody}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('PokemonTCG Proxy Error:', error.message);
        return NextResponse.json(
            {
                error: 'Failed to fetch from PokemonTCG',
                details: error.message,
                debug: {
                    apiKeyPresent: !!process.env.POKEMON_TCG_API_KEY,
                    query: query
                }
            },
            { status: 500 }
        );
    }
}

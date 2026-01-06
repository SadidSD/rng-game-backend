
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Capture final URL for debug
    let debugUrl = '';

    try {
        const hasSpaces = query.includes(' ');
        // Construct the Lucene query
        const luceneQuery = hasSpaces ? `name:"${query}"` : `name:${query}*`;

        console.log(`Proxying to PokemonTCG: ${luceneQuery}`);

        const apiKey = process.env.POKEMON_TCG_API_KEY;
        const upstreamUrl = new URL('https://api.pokemontcg.io/v2/cards');

        // Use standard URLSearchParams for correct encoding
        upstreamUrl.searchParams.set('q', luceneQuery);
        upstreamUrl.searchParams.set('pageSize', '12');
        upstreamUrl.searchParams.set('orderBy', '-set.releaseDate');

        // REMOVED 'select' param to rule out projection errors
        // REMOVED User-Agent spoofing to rule out WAF blocking specific browser strings

        debugUrl = upstreamUrl.toString();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        const res = await fetch(debugUrl, {
            method: 'GET',
            headers,
            next: { revalidate: 0 },
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Upstream Error ${res.status}: ${errorBody}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('PokemonTCG Proxy Error messages:', error.message);
        return NextResponse.json(
            {
                error: 'Failed to fetch from PokemonTCG',
                details: error.message,
                debug: {
                    apiKeyPresent: !!process.env.POKEMON_TCG_API_KEY,
                    query: query,
                    url: debugUrl
                }
            },
            { status: 500 }
        );
    }
}


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
        // We use MANUAL construction to ensure NO ENCODING on the colon or asterisk
        const luceneQuery = hasSpaces ? `name:"${query}"` : `name:${query}*`;

        console.log(`Proxying to PokemonTCG: ${luceneQuery}`);

        const apiKey = process.env.POKEMON_TCG_API_KEY;
        const baseUrl = 'https://api.pokemontcg.io/v2/cards';

        // Manual Param Construction
        // We do NOT use URLSearchParams for 'q' to avoid encoding characters like ':' into '%3A'
        const qParam = `q=${luceneQuery}`;
        const otherParams = 'pageSize=12&orderBy=-set.releaseDate&select=id,name,set,rarity,images,cardmarket';

        debugUrl = `${baseUrl}?${qParam}&${otherParams}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
        console.error('PokemonTCG Proxy Error:', error.message);
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

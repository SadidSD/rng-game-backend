
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

        // Encode the query properly for the URL
        const encodedQuery = encodeURIComponent(queryString);
        const apiUrl = `https://api.pokemontcg.io/v2/cards?q=${encodedQuery}&pageSize=12&orderBy=-set.releaseDate&select=id,name,set,rarity,images,cardmarket,tcgplayer`;

        console.log(`Proxying to PokemonTCG: ${queryString}`);

        const apiKey = process.env.POKEMON_TCG_API_KEY;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'TCG-SaaS-Proxy/1.0'
        };

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        const res = await fetch(apiUrl, {
            method: 'GET',
            headers,
            next: { revalidate: 0 } // Disable cache for search
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

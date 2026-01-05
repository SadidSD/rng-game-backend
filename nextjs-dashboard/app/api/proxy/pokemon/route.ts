
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Declare finalUrl outside try block for error reporting
    let finalUrl = '';

    try {
        // Simplify: Always use quotes and wildcard for safety
        // const luceneQuery = `name:"${query}*"`; // Strict
        // Use simpler loose match to start
        const luceneQuery = `name:${query}*`;

        console.log(`Proxying to PokemonTCG: ${luceneQuery}`);

        const apiKey = process.env.POKEMON_TCG_API_KEY;

        // Manual URL construction to avoid over-encoding of Lucene characters
        const baseUrl = 'https://api.pokemontcg.io/v2/cards';
        const params = new URLSearchParams({
            pageSize: '12',
            orderBy: '-set.releaseDate',
            select: 'id,name,set,rarity,images,cardmarket'
        });

        // Append q parameter manually to preserve structure (avoid encoding : and *)
        finalUrl = `${baseUrl}?q=${luceneQuery}&${params.toString()}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
        }

        const res = await fetch(finalUrl, {
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
                    url: finalUrl
                }
            },
            { status: 500 }
        );
    }
}

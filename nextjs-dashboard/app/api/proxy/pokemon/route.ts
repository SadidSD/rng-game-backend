import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim();

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    let debugUrl = '';

    try {
        const apiKey = process.env.POKEMON_TCG_API_KEY;

        // SAFE Lucene query logic recommended by user
        // 1. No wildcards on analyzed fields (prevents 404s)
        // 2. Tokenized AND search for multi-word queries
        const luceneQuery = query.includes(' ')
            ? query.split(' ').map(w => `name:${w}`).join(' AND ')
            : `name:${query}`;

        const upstreamUrl = new URL('https://api.pokemontcg.io/v2/cards');
        upstreamUrl.searchParams.set('q', luceneQuery);
        upstreamUrl.searchParams.set('pageSize', '12');
        upstreamUrl.searchParams.set('orderBy', '-set.releaseDate');
        // Select specific fields to keep payload light
        upstreamUrl.searchParams.set('select', 'id,name,set,rarity,images,cardmarket');

        debugUrl = upstreamUrl.toString();

        console.log(`Proxying to PokemonTCG: ${luceneQuery}`);

        const res = await fetch(debugUrl, {
            headers: {
                'X-Api-Key': apiKey || '',
                'Accept': 'application/json'
            },
            // Re-enable caching as this query structure is stable
            next: { revalidate: 3600 }
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Upstream ${res.status}: ${body}`);
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('PokemonTCG Error:', error.message);
        return NextResponse.json(
            {
                error: 'Failed to fetch from PokemonTCG',
                details: error.message,
                debug: {
                    query,
                    url: debugUrl
                }
            },
            { status: 500 }
        );
    }
}

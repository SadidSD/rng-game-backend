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

        const url = new URL('https://api.pokemontcg.io/v2/cards');
        url.searchParams.set('q', lucene);
        url.searchParams.set('pageSize', '12');
        url.searchParams.set('orderBy', '-set.releaseDate');
        url.searchParams.set(
            'select',
            'id,name,set,rarity,images,tcgplayer,cardmarket'
        );

        debugUrl = url.toString();

        const controller = new AbortController();
        setTimeout(() => controller.abort(), 8000);

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


import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    try {
        // Smart Query Logic (Same as before)
        const hasSpaces = query.includes(' ');
        const queryString = hasSpaces ? `name:"${query}"` : `name:${query}*`;

        const apiUrl = `https://api.pokemontcg.io/v2/cards`;

        console.log(`Proxying to PokemonTCG: ${queryString}`);

        const res = await axios.get(apiUrl, {
            params: {
                q: queryString,
                pageSize: 12,
                orderBy: '-set.releaseDate',
                select: 'id,name,set,rarity,images,cardmarket,tcgplayer'
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'TCG-SaaS-Proxy/1.0'
            },
            timeout: 10000
        });

        return NextResponse.json(res.data);
    } catch (error: any) {
        console.error('PokemonTCG Proxy Error:', error.response?.data || error.message);
        return NextResponse.json(
            { error: 'Failed to fetch from PokemonTCG' },
            { status: error.response?.status || 500 }
        );
    }
}

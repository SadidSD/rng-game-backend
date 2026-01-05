import { NextResponse } from 'next/server';
import axios from 'axios';
import * as https from 'https';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    try {
        const hasSpaces = query.includes(' ');
        const queryString = hasSpaces ? `name:"${query}"` : `name:${query}*`;

        const apiUrl = `https://api.pokemontcg.io/v2/cards`;

        console.log(`Proxying to PokemonTCG: ${queryString}`);

        // Force IPv4 to avoid timeouts on Vercel/AWS Lambda
        const httpsAgent = new https.Agent({ family: 4 });

        const apiKey = process.env.POKEMON_TCG_API_KEY;
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'TCG-SaaS-Proxy/1.0'
        };

        if (apiKey) {
            headers['X-Api-Key'] = apiKey;
            console.log('Using API Key for authentication');
        } else {
            console.warn('No API Key found - Request might be rate limited or blocked');
        }

        const res = await axios.get(apiUrl, {
            params: {
                q: queryString,
                pageSize: 12,
                orderBy: '-set.releaseDate',
                select: 'id,name,set,rarity,images,cardmarket,tcgplayer'
            },
            headers,
            const res = await axios.get(apiUrl, {
                params: {
                    q: queryString,
                    pageSize: 12,
                    orderBy: '-set.releaseDate',
                    select: 'id,name,set,rarity,images,cardmarket,tcgplayer'
                },
                headers,
                timeout: 5000, // Reduced to 5s to fail faster than Vercel's 10s limit
                httpsAgent
            });

            return NextResponse.json(res.data);
        } catch (error: any) {
            console.error('PokemonTCG Proxy Error:', error.response?.data || error.message);

            // Return debug info to help user diagnose
            return NextResponse.json(
                {
                    error: 'Failed to fetch from PokemonTCG',
                    details: error.message,
                    upstreamStatus: error.response?.status,
                    debug: {
                        apiKeyPresent: !!process.env.POKEMON_TCG_API_KEY,
                        query: query
                    }
                },
                { status: 500 }
            );
        }
    }

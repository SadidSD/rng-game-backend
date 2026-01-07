
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Force dynamic to prevent caching issues with search parameters
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const game = searchParams.get('game');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    try {
        // Forward request to Backend Service
        // Endpoint: /integrations/manapool/search?query=...&game=...
        const response = await axios.get(`${apiUrl}/integrations/manapool/search`, {
            params: { query, game },
            timeout: 10000 // 10s timeout
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('Manapool Proxy Error:', error.message);

        // Handle 404 cleanly (no prices found)
        if (error.response?.status === 404) {
            return NextResponse.json({ data: [] });
        }

        return NextResponse.json(
            { error: 'Failed to fetch Manapool prices' },
            { status: error.response?.status || 500 }
        );
    }
}

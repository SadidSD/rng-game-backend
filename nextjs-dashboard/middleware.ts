import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('tcg-auth-token')?.value

    // Define protected paths
    const { pathname } = request.nextUrl
    const isLoginPage = pathname.startsWith('/login')
    const isDashboard = !isLoginPage && 
                        !pathname.startsWith('/_next') && 
                        !pathname.startsWith('/api') && 
                        !pathname.startsWith('/static') && 
                        !pathname.includes('.');

    // Construct the absolute URL using the request headers to prevent domain translation by Vercel's proxy
    const host = request.headers.get('host') || request.nextUrl.host
    const protocol = request.nextUrl.protocol || 'https:'

    // 1. If trying to access login page while logged in, redirect to dashboard root
    if (isLoginPage && token) {
        const url = new URL('/', `${protocol}//${host}`)
        return NextResponse.redirect(url)
    }

    // 2. If trying to access dashboard/protected pages while logged out, redirect to login
    if (isDashboard && !token) {
        const url = new URL('/login', `${protocol}//${host}`)
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}

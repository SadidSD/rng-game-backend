import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('tcg-auth-token')?.value

    // Define protected paths
    const isLoginPage = request.nextUrl.pathname.startsWith('/login')
    const isDashboard = !isLoginPage && !request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/static') && !request.nextUrl.pathname.includes('.');

    // 1. If trying to access login page while logged in, redirect to dashboard
    if (isLoginPage && token) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. If trying to access dashboard/protected pages while logged out, redirect to login
    if (isDashboard && !token) {
        return NextResponse.redirect(new URL('/login', request.url))
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

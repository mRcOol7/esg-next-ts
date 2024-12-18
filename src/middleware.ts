import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    // Check if it's an API route or static file
    if (request.nextUrl.pathname.startsWith('/api') || 
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('/favicon.')) {
        return NextResponse.next();
    }

    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup'];
    if (publicRoutes.includes(pathname)) {
        // If user is authenticated and tries to access auth pages, redirect to home
        if (token) {
            return NextResponse.redirect(new URL('/home', request.url));
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!token) {
        const callbackUrl = encodeURIComponent(request.url);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
    }

    // If user is authenticated and tries to access root, redirect to home
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (Next Auth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
    ],
};

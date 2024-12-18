import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.url;

    // Handle root URL
    if (pathname === "/") {
        if (token) {
            return NextResponse.redirect(new URL("/home", baseUrl));
        }
        return NextResponse.redirect(new URL("/login", baseUrl));
    }

    // Allow authentication routes
    if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        if (token) {
            return NextResponse.redirect(new URL("/home", baseUrl));
        }
        return NextResponse.next();
    }

    // Protect other routes
    if (!token) {
        return NextResponse.redirect(new URL("/login", baseUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/home/:path*",
        "/profile/:path*",
        "/login",
        "/signup",
    ],
};

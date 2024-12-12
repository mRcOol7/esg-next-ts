import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // Allow authentication routes
    if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        if (token) {
            return NextResponse.redirect(new URL("/home", request.url));
        }
        return NextResponse.next();
    }

    // Protect other routes
    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/home/:path*",
        "/profile/:path*",
        "/login",
        "/signup",
    ],
};

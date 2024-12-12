import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Allow access to auth-related routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // If on login/signup page and already authenticated, redirect to home
  if ((pathname.startsWith('/login') || pathname.startsWith('/signup')) && token) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // If trying to access protected routes without auth, redirect to login
  if (!token && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
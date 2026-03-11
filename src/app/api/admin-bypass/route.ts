import { NextResponse } from 'next/server'

export async function GET() {
    const response = NextResponse.redirect(
        new URL('/dashboard/admin', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    )
    response.cookies.set('admin-bypass', 'true', {
        path: '/',
        maxAge: 3600,        // 1 hour
        httpOnly: false,     // readable by client if needed
        sameSite: 'lax',     // works with normal browser navigations
    })
    return response
}

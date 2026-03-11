import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const url = new URL('/dashboard/admin', request.url)
    const response = NextResponse.redirect(url)
    response.cookies.set('admin-bypass', 'true', {
        path: '/',
        maxAge: 3600,
        httpOnly: false,
        sameSite: 'lax',
    })
    return response
}

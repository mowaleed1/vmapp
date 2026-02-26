import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard/agent'

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.headers.get('cookie')
                            ? request.headers.get('cookie')?.split(';').map(c => {
                                const [name, ...rest] = c.split('=')
                                return { name: name.trim(), value: rest.join('=') }
                            }) ?? []
                            : []
                    },
                    setAll(cookiesToSet) {
                        // In an API route, you technically just set headers on the eventual NextResponse
                        // But since we are redirecting immediately after, we don't strictly need to set 
                        // them on this intermediate object if `exchangeCodeForSession` works.
                        // However, to satisfy TS we return void.
                    },
                },
            }
        )

        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const redirectResponse = NextResponse.redirect(`${origin}${next}`)
            // Now that we have the session from exchangeCodeForSession, we need to instruct 
            // the client to save it. The easiest way is to let the user get redirected to the 
            // page and the Next.js middleware will handle reading the response and setting cookies.
            return redirectResponse
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Invalid%20or%20expired%20magic%20link`)
}

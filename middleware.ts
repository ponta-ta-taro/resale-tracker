import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // ログインページ、コールバック、Webhookは認証不要（セッション取得前に判定）
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth/callback') ||
        request.nextUrl.pathname.startsWith('/api/mail/webhook')

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // セッション取得にタイムアウトを設定（5秒）
    let session = null
    try {
        const result = await Promise.race([
            supabase.auth.getSession(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Session check timeout')), 5000)
            ),
        ])
        session = result.data.session
    } catch {
        // タイムアウトまたはエラー時：認証ルートはそのまま通す、それ以外はログインへ
        if (isAuthRoute) {
            return response
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAuthRoute) {
        if (session) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return response
    }

    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}

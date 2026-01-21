import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    if (code) {
        const cookieStore = cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('Auth error:', error)
            return NextResponse.redirect(`${origin}/login?error=auth_error`)
        }

        // Create default Guest ID for new users
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if user has any apple_accounts records
                const { count } = await supabase
                    .from('apple_accounts')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)

                // If no records exist (first login), create Guest ID
                if (count === 0) {
                    console.log('Creating default Guest ID for new user:', user.id)
                    const { error: insertError } = await supabase
                        .from('apple_accounts')
                        .insert({
                            user_id: user.id,
                            name: 'ゲストID',
                            email: null,
                            is_guest: true,
                            sort_order: 1
                        })

                    if (insertError) {
                        console.error('Error creating Guest ID:', insertError)
                        // Don't fail the login, just log the error
                    } else {
                        console.log('Guest ID created successfully')
                    }
                }
            }
        } catch (guestIdError) {
            console.error('Error in Guest ID creation:', guestIdError)
            // Don't fail the login, just log the error
        }
    }

    return NextResponse.redirect(`${origin}/`)
}

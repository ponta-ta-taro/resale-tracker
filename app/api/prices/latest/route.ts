import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 各機種の最新価格を取得（iPhone 17シリーズのみ）
        const { data, error } = await supabase
            .from('price_history')
            .select('*')
            .like('model_name', '%iPhone 17%')
            .not('model_name', 'like', '%Air%')
            .order('captured_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 機種+容量でグループ化して最新のみ取得
        const latestPrices = new Map()
        data?.forEach(item => {
            const key = `${item.model_name}_${item.storage}`
            if (!latestPrices.has(key)) {
                latestPrices.set(key, item)
            }
        })

        const result = Array.from(latestPrices.values())

        return NextResponse.json({ data: result, count: result.length })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

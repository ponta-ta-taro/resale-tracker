import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
    try {
        // 各機種の最新価格を取得
        const { data, error } = await supabase
            .from('price_history')
            .select('*')
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

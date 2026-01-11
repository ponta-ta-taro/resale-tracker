import { NextResponse } from 'next/server';
const pdf = require('pdf-parse');

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse PDF
        const data = await pdf(buffer);
        const text = data.text;

        // Extract order number
        const orderNumberMatch = text.match(/ご注文番号[:\s：]+([A-Z0-9]+)/i) ||
            text.match(/Order Number[:\s]+([A-Z0-9]+)/i);
        const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

        // Extract serial number
        // Look for "Serial Numbers for Item" followed by the serial number
        let serialNumber = '';
        const serialSectionMatch = text.match(/Serial Numbers? for Item[:\s]*([A-Z0-9]+)/i);
        if (serialSectionMatch) {
            serialNumber = serialSectionMatch[1];
        } else {
            // Fallback: look for "Serial" or "シリアル" followed by number
            const serialMatch = text.match(/(?:Serial|シリアル)[:\s]*([A-Z0-9]{10,})/i);
            if (serialMatch) {
                serialNumber = serialMatch[1];
            }
        }

        console.log('PDF Parse Result:', { orderNumber, serialNumber });

        return NextResponse.json({
            orderNumber,
            serialNumber,
            success: true,
        });
    } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
            {
                error: 'Failed to parse PDF',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

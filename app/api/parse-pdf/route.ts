import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new (PDFParser as any)(null, 1);

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                const text = pdfData.Pages.map((page: any) =>
                    page.Texts.map((t: any) =>
                        decodeURIComponent(t.R[0].T)
                    ).join(' ')
                ).join('\n');
                resolve(text);
            });

            pdfParser.on('pdfParser_dataError', (error: any) => {
                reject(error);
            });

            pdfParser.parseBuffer(buffer);
        });

        // Extract order number
        const orderNumberMatch = text.match(/ご注文番号[:\s：]*([W\d]+)/i) ||
            text.match(/Order Number[:\s]+([W\d]+)/i);
        const orderNumber = orderNumberMatch ? orderNumberMatch[1] : '';

        // Extract serial number
        // Look for "Serial Numbers for Item" followed by the serial number
        let serialNumber = '';
        const serialSectionMatch = text.match(/Serial Numbers? for Item\s*\d*\s*([A-Z0-9]{10,})/i);
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

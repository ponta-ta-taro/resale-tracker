export interface PdfParseResult {
    orderNumber: string;
    serialNumber: string;
    success: boolean;
    error?: string;
    rawText?: string;
}

export async function parsePdfFile(file: File): Promise<PdfParseResult> {
    try {
        // Dynamically import pdfjs-dist legacy build for browser compatibility
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
        
        // Use CDN worker for version 3.x
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        console.log('PDF Text extracted:', fullText.substring(0, 500));

        // Extract order number
        const orderNumberMatch = fullText.match(/ご注文番号[:\s：]*([W\d]+)/i) ||
            fullText.match(/Order Number[:\s]+([W\d]+)/i) ||
            fullText.match(/W\d{9,}/);
        const orderNumber = orderNumberMatch ? orderNumberMatch[1] || orderNumberMatch[0] : '';

        // Extract serial number
        let serialNumber = '';
        
        // Look for "Serial Numbers for Item" followed by the serial number
        const serialSectionMatch = fullText.match(/Serial Numbers? for Item\s*\d*\s*([A-Z0-9]{10,})/i);
        if (serialSectionMatch) {
            serialNumber = serialSectionMatch[1];
        } else {
            // Fallback: look for "Serial" or "シリアル" followed by number
            const serialMatch = fullText.match(/(?:Serial|シリアル)[:\s]*([A-Z0-9]{10,})/i);
            if (serialMatch) {
                serialNumber = serialMatch[1];
            } else {
                // Try to find standalone serial number pattern (iPhone serial format)
                const standaloneSerial = fullText.match(/\b([A-Z0-9]{11,12})\b/g);
                if (standaloneSerial) {
                    // Filter to likely serial numbers (starts with letter, proper length)
                    const validSerials = standaloneSerial.filter(s => 
                        /^[A-Z][A-Z0-9]{10,11}$/.test(s) && 
                        !s.startsWith('W') // Exclude order numbers
                    );
                    if (validSerials.length > 0) {
                        serialNumber = validSerials[0];
                    }
                }
            }
        }

        console.log('PDF Parse Result:', { orderNumber, serialNumber });
        console.log('Full PDF text:', fullText);

        return {
            orderNumber,
            serialNumber,
            success: true,
            rawText: fullText,
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error details:', errorMessage);
        return {
            orderNumber: '',
            serialNumber: '',
            success: false,
            error: errorMessage,
        };
    }
}

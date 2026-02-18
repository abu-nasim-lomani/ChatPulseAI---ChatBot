
// Use require for better CommonJS compatibility in TSX
const pdf = require('pdf-parse');

export interface PDFMetadata {
    title?: string;
    author?: string;
    pages?: number;
    creator?: string;
}

export class PDFProcessor {
    /**
     * Parse a PDF buffer and return text + data
     */
    async parsePDF(buffer: Buffer): Promise<{ text: string, metadata: PDFMetadata }> {
        try {
            // Standard v1.1.1 usage: pdf(buffer) returns Promise<data>
            const data = await pdf(buffer);

            // Clean up text (remove excessive newlines but keep structure)
            const text = (data.text || "").replace(/\n\s*\n/g, '\n\n').trim();

            return {
                text,
                metadata: {
                    pages: data.numpages,
                    title: data.info?.Title,
                    author: data.info?.Author,
                    creator: data.info?.Creator
                }
            };
        } catch (error) {
            console.error('[PDFProcessor] Error parsing PDF:', error);
            throw new Error('Failed to parse PDF file: ' + (error as Error).message);
        }
    }

    /**
     * Validate if buffer is a valid PDF
     */
    isValidPDF(buffer: Buffer): boolean {
        // Check for PDF magic bytes: %PDF
        if (!buffer || buffer.length < 4) return false;
        return buffer.toString('utf8', 0, 4) === '%PDF';
    }
}

export const pdfProcessor = new PDFProcessor();

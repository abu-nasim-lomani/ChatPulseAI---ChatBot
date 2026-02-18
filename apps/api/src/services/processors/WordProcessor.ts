
import mammoth from 'mammoth';

export class WordProcessor {
    /**
     * Parse a DOCX buffer and return raw text
     */
    async parseWord(buffer: Buffer): Promise<{ text: string, metadata: any }> {
        try {
            const result = await mammoth.extractRawText({ buffer });
            const text = result.value.trim();
            const messages = result.messages; // Warnings during conversion

            if (messages.length > 0) {
                console.warn('[WordProcessor] Warnings:', messages);
            }

            return {
                text,
                metadata: {
                    warnings: messages.length
                }
            };
        } catch (error) {
            console.error('[WordProcessor] Error parsing DOCX:', error);
            throw new Error('Failed to parse Word file');
        }
    }

    /**
     * Validate if buffer is a valid DOCX (Magic bytes for ZIP/XML based)
     */
    isValidWord(buffer: Buffer): boolean {
        // DOCX is a zip file, starts with PK..
        if (!buffer || buffer.length < 4) return false;
        return buffer.toString('hex', 0, 4) === '504b0304';
    }
}

export const wordProcessor = new WordProcessor();

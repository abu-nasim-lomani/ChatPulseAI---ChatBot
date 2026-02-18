
export class JsonProcessor {
    /**
     * Parse JSON content (string or object) and return structured text
     */
    processJSON(content: any): { text: string, metadata: any } {
        try {
            let jsonObj;
            if (typeof content === 'string') {
                jsonObj = JSON.parse(content);
            } else {
                jsonObj = content;
            }

            // Convert to a readable string format (YAML-like or just formatted JSON)
            // For RAG, formatted JSON is often okay, or key-value pairs
            const text = JSON.stringify(jsonObj, null, 2);

            return {
                text,
                metadata: {
                    keys: Object.keys(jsonObj).length
                }
            };
        } catch (error) {
            console.error('[JsonProcessor] Error processing JSON:', error);
            throw new Error('Invalid JSON content');
        }
    }
}

export const jsonProcessor = new JsonProcessor();


import axios from 'axios';
import * as cheerio from 'cheerio';

export class WebScraper {
    /**
     * Fetch URL and extract main text content
     */
    async scrapeURL(url: string): Promise<{ text: string, metadata: any }> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000 // 10s timeout
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // Remove scripts, styles, and other non-content elements
            $('script, style, nav, footer, iframe, svg').remove();

            // Extract title
            const title = $('title').text().trim();

            // Extract body text (try to target main content if possible, else body)
            // A simple heuristic: get all paragraph text
            let text = '';
            $('p, h1, h2, h3, h4, h5, li').each((_, el) => {
                const content = $(el).text().trim();
                if (content.length > 20) { // Filter out tiny snippets
                    text += content + '\n\n';
                }
            });

            return {
                text: text.trim(),
                metadata: {
                    title,
                    url
                }
            };
        } catch (error) {
            console.error('[WebScraper] Error scraping URL:', error);
            throw new Error(`Failed to scrape URL: ${(error as Error).message}`);
        }
    }
}

export const webScraper = new WebScraper();

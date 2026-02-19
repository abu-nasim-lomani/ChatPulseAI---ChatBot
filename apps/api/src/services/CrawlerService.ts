
import axios from 'axios';
import * as cheerio from 'cheerio';

export class CrawlerService {
    static async crawl(url: string): Promise<string> {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const $ = cheerio.load(data);

            // Remove script, style, and other non-content elements
            $('script').remove();
            $('style').remove();
            $('noscript').remove();
            $('iframe').remove();
            $('header').remove(); // Optional: remove nav/footer if desired
            $('footer').remove();
            $('nav').remove();

            // Extract text from body
            let text = $('body').text();

            // Clean up whitespace
            text = text.replace(/\s+/g, ' ').trim();

            return text;
        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error);
            throw new Error(`Failed to crawl URL: ${url}`);
        }
    }
}

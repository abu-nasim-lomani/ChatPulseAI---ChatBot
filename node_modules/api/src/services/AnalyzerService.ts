import Sentiment from 'sentiment';

const sentiment = new Sentiment();

interface SentimentResult {
    score: number;      // raw score ( < 0 negative, > 0 positive)
    comparative: number; // normalized score
    label: 'positive' | 'negative' | 'neutral';
    mood: string;       // human readable mood
    keywords: string[]; // words that triggered the score
}

export class AnalyzerService {

    /**
     * Analyze text to determine sentiment
     * @param text The message content
     */
    static analyze(text: string): SentimentResult {
        const result = sentiment.analyze(text);

        let label: 'positive' | 'negative' | 'neutral' = 'neutral';
        let mood = 'neutral';

        if (result.score > 0) {
            label = 'positive';
            mood = result.score > 3 ? 'ecstatic' : 'happy';
        } else if (result.score < 0) {
            label = 'negative';
            mood = result.score < -3 ? 'furious' : 'frustrated';
        }

        return {
            score: result.score,
            comparative: result.comparative,
            label: label,
            mood: mood,
            keywords: result.words
        };
    }
}

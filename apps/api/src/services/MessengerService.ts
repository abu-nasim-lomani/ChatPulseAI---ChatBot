
import axios from 'axios';

export class MessengerService {

    static async sendMessage(recipientId: string, text: string, accessToken: string) {
        if (!accessToken) {
            console.error('Access Token is missing for MessengerService');
            return;
        }

        try {
            await axios.post(
                `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
                {
                    recipient: { id: recipientId },
                    message: { text: text }
                }
            );
            console.log(`[Messenger] Sent message to ${recipientId}`);
        } catch (error: any) {
            console.error('[Messenger] Failed to send message:', error.response?.data || error.message);
        }
    }

    static async sendTypingIndicator(recipientId: string, accessToken: string) {
        if (!accessToken) return;

        try {
            await axios.post(
                `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
                {
                    recipient: { id: recipientId },
                    sender_action: "typing_on"
                }
            );
        } catch (error) {
            // Ignore typing errors
        }
    }
}

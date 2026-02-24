
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

    static async getUserProfile(senderId: string, accessToken: string): Promise<{ name: string, profilePic: string | null }> {
        if (!accessToken) return { name: `FB User #${senderId.slice(-6)}`, profilePic: null };

        try {
            const response = await axios.get(
                `https://graph.facebook.com/v18.0/${senderId}?fields=name,picture.type(large)&access_token=${accessToken}`
            );
            const { name, picture } = response.data;
            const profilePic = picture?.data?.url || null;
            console.log(`[Messenger] Profile fetched for ${senderId}: name=${name}, hasPic=${!!profilePic}`);
            return {
                name: name || `FB User #${senderId.slice(-6)}`,
                profilePic
            };
        } catch (error: any) {
            const fbError = error.response?.data?.error;
            if (fbError) {
                console.error(`[Messenger] Graph API error for ${senderId}: [${fbError.code}] ${fbError.message}`);
            } else {
                console.error('[Messenger] Failed to fetch user profile:', error.message);
            }
        }
        return { name: `FB User #${senderId.slice(-6)}`, profilePic: null };
    }
}

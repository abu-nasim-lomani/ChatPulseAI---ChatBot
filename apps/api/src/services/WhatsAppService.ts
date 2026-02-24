import axios from 'axios';

export class WhatsAppService {
    /**
     * Send a text message via WhatsApp Cloud API
     * @param phoneNumberId The WABA Phone Number ID
     * @param accessToken The Permanent System User Token
     * @param to The recipient's phone number without +
     * @param text The message body
     */
    static async sendMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
        try {
            const endpoint = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to.replace('wa_', ''), // Strip custom prefix if it exists
                type: "text",
                text: { preview_url: false, body: text }
            };

            const response = await axios.post(endpoint, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[WhatsAppService] Reply sent to ${to}. MID: ${response.data.messages?.[0]?.id}`);
            return response.data;
        } catch (error: any) {
            console.error('[WhatsAppService Error]', error.response?.data || error.message);
            throw new Error('Failed to send WhatsApp message');
        }
    }
}

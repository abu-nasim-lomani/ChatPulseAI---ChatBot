import axios from 'axios';

const API_URL = 'http://localhost:3001';
const TENANT_ID = 'f7ceac90-300e-41a8-b471-da63609728de';

async function testSettings() {
    try {
        console.log(`Testing GET ${API_URL}/tenants/settings?tenantId=${TENANT_ID}`);
        const res = await axios.get(`${API_URL}/tenants/settings?tenantId=${TENANT_ID}`);
        console.log('Success:', res.data);
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testSettings();

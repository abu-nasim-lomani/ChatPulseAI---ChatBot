require('dotenv').config();
const axios = require('axios');

async function checkUsage() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("No OPENAI_API_KEY found in .env");
        return;
    }

    try {
        console.log("Checking OpenAI Usage (Cost)...");

        const now = new Date();
        // Get start of month
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        // 1. Fetch the Subscription / Usage limit
        const subRes = await axios.get(`https://api.openai.com/v1/dashboard/billing/subscription`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const hardLimitUsd = subRes.data.hard_limit_usd;

        // 2. Fetch the usage costs
        const usageRes = await axios.get(`https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        const totalUsageUsd = usageRes.data.total_usage / 100; // API returns cents

        console.log(`\n--- OpenAI Billing (This Month) ---`);
        console.log(`Hard Limit: $${hardLimitUsd}`);
        console.log(`Total Usage: $${totalUsageUsd}`);
        console.log(`Remaining: $${(hardLimitUsd - totalUsageUsd).toFixed(2)}`);
        console.log(`-----------------------------------\n`);

    } catch (error) {
        console.error("Failed to fetch balance:");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

checkUsage();

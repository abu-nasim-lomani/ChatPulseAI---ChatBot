
console.log("Start test_ai_config.ts");
try {
    const aiConfig = require('./src/lib/ai-config');
    console.log("ai-config loaded successfully");
} catch (e: any) {
    console.error("Failed to load ai-config:", e);
}

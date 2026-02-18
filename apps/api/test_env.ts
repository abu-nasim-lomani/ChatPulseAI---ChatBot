import dotenv from 'dotenv';

console.log("Testing .env loading...\n");

// Try different config approaches
const result = dotenv.config({ path: '.env' });

if (result.error) {
    console.error("❌ Error loading .env:", result.error);
} else {
    console.log("✅ .env loaded successfully");
    console.log("Parsed variables:", Object.keys(result.parsed || {}).length);
}

console.log("\nChecking environment variables:");
console.log("PORT:", process.env.PORT);
console.log("AI_PROVIDER:", process.env.AI_PROVIDER);
console.log("PINECONE_API_KEY:", process.env.PINECONE_API_KEY ? "✅ Set" : "❌ Missing");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");

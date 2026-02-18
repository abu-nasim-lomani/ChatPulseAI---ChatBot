
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { knowledgeService } from './src/services/KnowledgeService';
import { pdfProcessor } from './src/services/PDFProcessor';

async function testServices() {
    console.log("🧪 Testing Services Directly...\n");

    const tenantId = "test-tenant-123";

    // 1. Test PDF Parsing (Mock PDF)
    console.log("1️⃣ Testing PDFProcessor:");
    try {
        // Create a dummy PDF buffer (Header only)
        // Note: pdf-parse might fail if it's not a valid PDF structure. 
        // But let's try to pass the isValidPDF check first.
        const dummyBuffer = Buffer.from("%PDF-1.4\n%Dummy content for testing\n%%EOF");

        const isValid = pdfProcessor.isValidPDF(dummyBuffer);
        console.log(`   Detailed Validation: ${isValid ? "Valid Header" : "Invalid Header"}`);

        if (isValid) {
            console.log("   Attempting parse (this might fail with dummy data)...");
            try {
                const { text } = await pdfProcessor.parsePDF(dummyBuffer);
                console.log("   ✅ PDF Parsed:", text);
            } catch (e: any) {
                console.warn("   ⚠️ PDF Parse failed (expected for dummy data):", e.message);
                // Proceed to test KnowledgeService with raw text instead
            }
        }
    } catch (e: any) {
        console.error("   ❌ PDF Processor Error:", e);
    }

    // 2. Test KnowledgeService (The likely culprit)
    console.log("\n2️⃣ Testing KnowledgeService (Add Knowledge):");
    try {
        const dummyText = "This is a test sentence to verify the knowledge base integration. It should be split and embedded.";
        console.log("   Input Text:", dummyText);

        const result = await knowledgeService.addKnowledge(
            tenantId,
            dummyText,
            "test_script.pdf",
            "pdf",
            { test: true }
        );

        console.log("   ✅ Success! Chunk Created:", result ? "Yes" : "No");
        if (result) console.log("   Chunk ID:", result.id);

    } catch (e: any) {
        console.error("   ❌ KnowledgeService Error:", e);
        console.error("   Stack:", e.stack);
    }
}

testServices();

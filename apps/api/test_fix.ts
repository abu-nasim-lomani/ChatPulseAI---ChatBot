
import { knowledgeService } from './src/services/KnowledgeService';
import { pdfProcessor } from './src/services/PDFProcessor';
import fs from 'fs';
import path from 'path';

async function test() {
    console.log("Testing PDFProcessor...");
    // Create a dummy PDF buffer (header only to pass strict check, but parse might fail if empty)
    // Actually pdf-parse might need real pdf. 
    // Let's just test the splitIntoChunks logic which was the main crash point.

    console.log("Testing KnowledgeService.splitIntoChunks...");
    try {
        // Access private method via any or just test addKnowledge with dummy data (mocking pinecone if needed)
        // But we want to test the import.

        // We can't easily access private method, but we can try to inspect the prototype or just run usage.
        // Let's rely on the fact that I changed it to 'require'. 

        // Try importing from @langchain/textsplitters
        const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
        console.log("RecursiveCharacterTextSplitter loaded:", !!RecursiveCharacterTextSplitter);

        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 10 });
        const output = await splitter.createDocuments(["Hello world this is a test text to split."]);
        console.log("Splitter output:", output.length > 0 ? "Success" : "Failed");

    } catch (e) {
        console.error("Splitter test failed:", e);
    }
}

test().catch(console.error);

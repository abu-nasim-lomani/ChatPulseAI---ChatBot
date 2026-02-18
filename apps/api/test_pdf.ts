
import { pdfProcessor } from './src/services/PDFProcessor';

async function test() {
    console.log("Starting PDF Test...");
    const dummy = Buffer.from("%PDF-1.4\ncontent");
    const valid = pdfProcessor.isValidPDF(dummy);
    console.log("Valid:", valid);
}
test();

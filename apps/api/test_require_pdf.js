
console.log("Starting require test...");
try {
    const pdf = require('pdf-parse');
    console.log("pdf-parse required successfully:", typeof pdf);

    // Test basic functionality with buffer
    const dummy = Buffer.from("%PDF-1.4\ncontent");
    pdf(dummy).then(data => {
        console.log("Parsed dummy PDF (might be empty/error but promise resolved):", data.text);
    }).catch(err => {
        console.log("Promise rejected (expected):", err.message);
    });

} catch (e) {
    console.error("Failed to require:", e);
}

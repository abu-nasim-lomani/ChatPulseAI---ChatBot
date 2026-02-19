import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export class FileService {

    static async parseFile(filePath: string, mimeType: string): Promise<string> {
        const buffer = fs.readFileSync(filePath);

        if (mimeType === 'application/pdf') {
            return await this.parsePDF(buffer);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return await this.parseDOCX(buffer);
        } else if (mimeType === 'text/csv' || mimeType === 'application/vnd.ms-excel') {
            return await this.parseCSV(fs.readFileSync(filePath, 'utf8'));
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            return await this.parseXLSX(buffer);
        } else if (mimeType === 'application/json') {
            return await this.parseJSON(fs.readFileSync(filePath, 'utf8'));
        } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
            return fs.readFileSync(filePath, 'utf8');
        } else {
            console.warn(`[FileService] Unsupported MIME type: ${mimeType}. Treating as binary/skipped.`);
            return ""; // Skip unsupported files instead of crashing
        }
    }

    private static async parsePDF(buffer: Buffer): Promise<string> {
        // @ts-ignore: pdf-parse types depend on how it's imported
        const data = await pdf(buffer);
        return this.sanitizeText(data.text);
    }

    private static async parseDOCX(buffer: Buffer): Promise<string> {
        const result = await mammoth.extractRawText({ buffer });
        return this.sanitizeText(result.value);
    }

    private static async parseXLSX(buffer: Buffer): Promise<string> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let text = "";
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            text += XLSX.utils.sheet_to_csv(sheet) + "\n";
        });
        return this.sanitizeText(text);
    }

    private static async parseCSV(csvText: string): Promise<string> {
        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                complete: (results) => {
                    resolve(this.sanitizeText(JSON.stringify(results.data, null, 2)));
                }
            });
        });
    }

    private static async parseJSON(jsonText: string): Promise<string> {
        return this.sanitizeText(jsonText);
    }

    // Helper to remove null bytes and non-printable characters causing Postgres errors
    private static sanitizeText(text: string): string {
        // Remove null bytes (0x00) and other non-printable control characters (except newlines/tabs)
        return text.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    }

    static async cleanup(filePath: string) {
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error("Failed to delete temp file:", filePath);
        }
    }
}


import * as XLSX from 'xlsx';

export interface ExcelMetadata {
    sheets: string[];
    rowCount: number;
}

export class ExcelProcessor {
    /**
     * Parse Excel/CSV buffer and return text representation
     */
    processExcel(buffer: Buffer): { text: string, metadata: ExcelMetadata } {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let fullText = "";
            let totalRows = 0;
            const sheetNames = workbook.SheetNames;

            // Iterate through each sheet
            sheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                // Check if sheet has data
                // We use sheet_to_json with default options to get array of objects (using headers)
                const headers = sheet['!ref'] ? XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[] : [];
                const data = XLSX.utils.sheet_to_json(sheet); // Array of objects

                if (data.length > 0) {
                    fullText += `\n--- Sheet: ${sheetName} ---\n`;

                    data.forEach((row: any, index: number) => {
                        fullText += `\n[Row ${index + 1}]\n`;
                        Object.keys(row).forEach(key => {
                            const value = row[key];
                            if (value !== null && value !== undefined && value.toString().trim() !== "") {
                                fullText += `${key}: ${value}\n`;
                            }
                        });
                    });
                    totalRows += data.length;
                }
            });

            return {
                text: fullText.trim(),
                metadata: {
                    sheets: sheetNames,
                    rowCount: totalRows
                }
            };

        } catch (error) {
            console.error('[ExcelProcessor] Error parsing Excel/CSV:', error);
            throw new Error('Failed to parse spreadsheet file: ' + (error as Error).message);
        }
    }
}

export const excelProcessor = new ExcelProcessor();

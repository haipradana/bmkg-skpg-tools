/**
 * Utility functions for parsing CSV files with European/Indonesian format
 * Handles:
 * - Semicolon (;) as delimiter
 * - Comma (,) as decimal separator
 */

/**
 * Normalizes a numeric string from European format to standard format
 * Converts comma decimal separator to dot
 * Examples:
 *   "123,45" -> "123.45"
 *   "-7,85" -> "-7.85"
 *   "110,42567" -> "110.42567"
 */
export const normalizeDecimal = (value: string): string => {
    if (typeof value !== 'string') return String(value);

    const trimmed = value.trim();

    // Match numbers with comma as decimal separator:
    // - Optional negative sign
    // - Digits before comma
    // - Comma
    // - Digits after comma
    // Pattern: -?[0-9]+,[0-9]+
    if (/^-?\d+,\d+$/.test(trimmed)) {
        return trimmed.replace(',', '.');
    }

    return value;
};

/**
 * Normalizes all numeric values in a parsed CSV row
 * This is called AFTER CSV is parsed with the correct delimiter
 */
export const normalizeCSVRow = (row: Record<string, string>): Record<string, string> => {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(row)) {
        if (value !== undefined && value !== null) {
            normalized[key] = normalizeDecimal(String(value));
        } else {
            normalized[key] = value;
        }
    }

    return normalized;
};

/**
 * Detects the delimiter of a CSV file by reading the first few lines
 * If semicolons appear more frequently than commas, use semicolon
 */
export const detectCSVDelimiter = async (file: File): Promise<',' | ';'> => {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').slice(0, 5); // Check first 5 lines

            let semicolonCount = 0;
            let commaCount = 0;

            for (const line of lines) {
                // Count delimiters per line
                semicolonCount += (line.match(/;/g) || []).length;
                commaCount += (line.match(/,/g) || []).length;
            }

            // Log for debugging


            // If semicolons appear more frequently, use semicolon as delimiter
            // This also means commas in the file are likely decimal separators
            if (semicolonCount > commaCount) {

                resolve(';');
            } else {

                resolve(',');
            }
        };

        reader.onerror = () => {
            console.warn('Error reading file for delimiter detection, defaulting to comma');
            resolve(',');
        };

        // Read first 2KB to detect
        reader.readAsText(file.slice(0, 2048));
    });
};

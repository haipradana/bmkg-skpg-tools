import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Deteksi format CSV (delimiter dan decimal separator)
 */
function detectCSVFormat(text: string): {
  delimiter: "," | ";";
  decimalSeparator: "." | ",";
} {
  const firstLines = text.split("\n").slice(0, 5).join("\n");

  // Hitung jumlah koma dan semicolon
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semicolonCount = (firstLines.match(/;/g) || []).length;

  // Tentukan delimiter berdasarkan yang paling banyak
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  // Jika delimiter adalah semicolon, kemungkinan besar decimal separator adalah koma
  // Jika delimiter adalah koma, decimal separator adalah titik
  const decimalSeparator = delimiter === ";" ? "," : ".";

  return { delimiter, decimalSeparator };
}

/**
 * Normalize desimal (convert koma ke titik untuk parsing)
 */
function normalizeDecimal(value: string, decimalSeparator: "." | ","): string {
  if (decimalSeparator === ",") {
    // Replace koma dengan titik untuk parsing
    return value.replace(/,/g, ".");
  }
  return value;
}

/**
 * Parse CSV file dengan auto-detect format
 */
export function parseCSVFile(
  file: File,
  onComplete: (data: Record<string, string>[]) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const { delimiter, decimalSeparator } = detectCSVFormat(text);



      Papa.parse<Record<string, string>>(text, {
        header: true,
        delimiter: delimiter,
        skipEmptyLines: true,
        transformHeader: (header) => {
          let normalized = header.trim().toUpperCase(); // Convert to uppercase
          // Normalize SH% menjadi SH untuk konsistensi
          if (normalized === "SH%") {
            normalized = "SH";
          }
          return normalized;
        },
        transform: (value, header) => {
          // Normalize decimal separator untuk kolom numerik
          const numericColumns = ["LAT", "LON", "LONG", "CH", "SH", "VAL"];
          const headerStr = String(header).trim();
          if (numericColumns.includes(headerStr)) {
            return normalizeDecimal(value.trim(), decimalSeparator);
          }
          return value.trim();
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            onError(`CSV parsing error: ${results.errors[0].message}`);
            return;
          }
          onComplete(results.data);
        },
        error: (error) => {
          onError(`Failed to parse CSV: ${error.message}`);
        },
      });
    } catch (error) {
      onError(`Failed to read CSV: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  reader.onerror = () => {
    onError("Failed to read file");
  };

  reader.readAsText(file);
}

/**
 * Parse Excel file (.xls, .xlsx)
 */
export function parseExcelFile(
  file: File,
  onComplete: (data: Record<string, string>[]) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });

      // Ambil sheet pertama
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert ke JSON dengan header dari row pertama
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        header: 1,
        defval: "",
      });

      if (jsonData.length === 0) {
        onError("Excel file is empty");
        return;
      }

      // Row pertama adalah header
      const headers = (jsonData[0] as any[]).map(h => {
        let headerStr = String(h).trim().toUpperCase(); // Convert to uppercase
        // Normalize SH% menjadi SH untuk konsistensi
        if (headerStr === "SH%") {
          headerStr = "SH";
        }
        return headerStr;
      });

      // Convert rows to objects
      const parsedData: Record<string, string>[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const obj: Record<string, string> = {};

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          let value = row[j];

          // Handle various data types
          if (value === null || value === undefined) {
            value = "";
          } else if (typeof value === "number") {
            value = String(value);
          } else {
            value = String(value).trim();
          }

          obj[header] = value;
        }

        // Skip empty rows
        if (Object.values(obj).some(v => v !== "")) {
          parsedData.push(obj);
        }
      }

      onComplete(parsedData);
    } catch (error) {
      onError(`Failed to parse Excel: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  reader.onerror = () => {
    onError("Failed to read file");
  };

  reader.readAsBinaryString(file);
}

/**
 * Parse file dengan auto-detect format (CSV atau Excel)
 */
export function parseDataFile(
  file: File,
  onComplete: (data: Record<string, string>[]) => void,
  onError: (error: string) => void
): void {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    parseCSVFile(file, onComplete, onError);
  } else if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) {
    parseExcelFile(file, onComplete, onError);
  } else {
    onError("Unsupported file format. Please upload CSV or Excel (.xls, .xlsx) file.");
  }
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string {
  return ".csv,.xls,.xlsx";
}

/**
 * Check if file is supported
 */
export function isSupportedFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".csv") || lower.endsWith(".xls") || lower.endsWith(".xlsx");
}


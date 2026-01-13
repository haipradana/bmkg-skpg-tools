import React, { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { parseDataFile, getSupportedExtensions, isSupportedFile } from "@/utils/fileParser";

interface FileUploadProps {
  onDataParsed: (data: Record<string, string>[]) => void;
  onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isSupportedFile(file.name)) {
        onError("Format file tidak didukung. Silakan upload file CSV atau Excel (.xls, .xlsx)");
        return;
      }

      setFileName(file.name);

      parseDataFile(
        file,
        (results) => {
          // Check for required columns
          if (results.length === 0) {
            onError("File kosong atau tidak memiliki data");
            return;
          }

          const headers = Object.keys(results[0]);
          // Note: SH% sudah dinormalisasi menjadi SH di fileParser
          const required = ["LAT", "CH", "SH"];
          const hasLONG = headers.includes("LONG");
          const hasLON = headers.includes("LON");
          
          if (!hasLONG && !hasLON) {
            onError(`Kolom wajib tidak lengkap: LAT, LONG (atau LON), CH, SH`);
            return;
          }
          
          const missing = required.filter((col) => !headers.includes(col));

          if (missing.length > 0) {
            onError(`Kolom wajib tidak lengkap: ${missing.join(", ")}`);
            return;
          }

          setRowCount(results.length);

          // Warn if too many points
          if (results.length > 100000) {
            console.warn("Large dataset detected (>100k points). Processing may be slow.");
          }

          onDataParsed(results);
        },
        (error) => {
          onError(error);
          setFileName(null);
        }
      );
    },
    [onDataParsed, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <label
        className={`file-drop-zone flex flex-col items-center gap-3 ${
          isDragging ? "file-drop-zone--active" : ""
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={getSupportedExtensions()}
          onChange={handleInputChange}
          className="hidden"
        />
        
        {fileName ? (
          <>
            <FileText className="w-10 h-10 text-primary" />
            <div className="text-center">
              <p className="font-medium text-foreground">{fileName}</p>
              {rowCount !== null && (
                <p className="text-sm text-muted-foreground">
                  {rowCount.toLocaleString()} baris dimuat
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-foreground">
                Seret file ke sini atau klik untuk memilih
              </p>
              <p className="text-sm text-muted-foreground">
                Format: CSV atau Excel (.xls, .xlsx)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Kolom wajib: LAT, LONG (atau LON), CH, SH (atau SH%)
                <br />
                <em style={{ fontSize: '10px' }}>(Case-insensitive: lat/LAT, lon/LON, dll)</em>
              </p>
            </div>
          </>
        )}
      </label>

      {rowCount !== null && rowCount > 100000 && (
        <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
          <span className="text-warning">
            Dataset besar terdeteksi ({rowCount.toLocaleString()} titik). Pemrosesan mungkin memerlukan waktu lebih lama.
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

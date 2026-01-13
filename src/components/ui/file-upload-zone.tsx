import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  id: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  currentFileName?: string;
  label?: string;
  maxSize?: number; // in MB
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  id,
  onFileSelect,
  accept = '.csv,.xlsx,.xls',
  currentFileName,
  label = 'Klik untuk upload atau drag & drop',
  maxSize = 50,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSelect(files[0]);
    }
  };

  const validateAndSelect = (file: File) => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File terlalu besar. Maksimal ${maxSize}MB`);
      return;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map(ext => ext.trim());
    
    if (!acceptedExtensions.includes(extension)) {
      alert(`Format file tidak didukung. Hanya: ${accept}`);
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
        "hover:border-primary hover:bg-accent/50",
        isDragging ? "border-primary bg-accent border-solid" : "border-border",
        "text-center"
      )}
    >
      <Upload className={cn(
        "w-12 h-12 mx-auto mb-4 transition-colors",
        isDragging ? "text-primary" : "text-muted-foreground"
      )} />
      <p className="text-sm font-medium">
        {currentFileName || label}
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {accept.toUpperCase().replace(/\./g, '').replace(/,/g, ', ')} (max {maxSize}MB)
      </p>
      {isDragging && (
        <p className="text-xs text-primary font-semibold mt-2">
          Drop file disini...
        </p>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

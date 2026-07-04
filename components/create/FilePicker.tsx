"use client";

import { useRef, useState } from "react";
import { Upload, X, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface FilePickerProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPT_TYPES = ".csv,.xlsx,.xls";

export function FilePicker({ onFileSelect, disabled = false }: FilePickerProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragOver
          ? "border-accent bg-accent/[0.03]"
          : "border-border bg-card hover:border-accent/50 hover:bg-accent/[0.02]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Upload className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {t("createSpaceFileImportSelectFile")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("createSpaceFileImportSupportedFormats")}
      </p>
    </div>
  );
}

interface SelectedFileProps {
  file: File;
  onClear: () => void;
  disabled?: boolean;
}

export function SelectedFile({ file, onClear, disabled = false }: SelectedFileProps) {

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <FileSpreadsheet className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        disabled={disabled}
        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

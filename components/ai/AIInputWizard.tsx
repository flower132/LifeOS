"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2, Sparkles } from "lucide-react";
import { AIImageInput } from "@/lib/ai/types";
import { useTranslation } from "@/lib/useTranslation";

export interface AIInputWizardProps {
  defaultText?: string;
  defaultImages?: AIImageInput[];
  onAnalyze: (text: string, images: AIImageInput[]) => void;
  isAnalyzing?: boolean;
  disabled?: boolean;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AIInputWizard({
  defaultText = "",
  defaultImages = [],
  onAnalyze,
  isAnalyzing = false,
  disabled = false,
}: AIInputWizardProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(defaultText);
  const [images, setImages] = useState<AIImageInput[]>(defaultImages);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setError(null);

      const newImages: AIImageInput[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setError(t("aiImageTypeError"));
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError(t("aiImageSizeError"));
          continue;
        }
        if (images.length + newImages.length >= MAX_IMAGES) {
          setError(t("aiImageLimitError", { max: String(MAX_IMAGES) }));
          break;
        }

        try {
          const base64Data = await fileToBase64(file);
          newImages.push({
            mimeType: file.type,
            base64Data,
          });
        } catch {
          setError(t("aiImageReadError"));
        }
      }

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }
    },
    [images.length, t]
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAnalyze = useCallback(() => {
    if (isAnalyzing || disabled) return;
    if (!text.trim() && images.length === 0) {
      setError(t("aiInputRequired"));
      return;
    }
    setError(null);
    onAnalyze(text.trim(), images);
  }, [text, images, isAnalyzing, disabled, onAnalyze, t]);

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("aiInputTextLabel")}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("aiInputTextPlaceholder")}
          rows={10}
          disabled={disabled || isAnalyzing}
          className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {t("aiInputImagesLabel")}
          </label>
          <span className="text-xs text-muted-foreground">
            {t("aiImageCount", {
              current: String(images.length),
              max: String(MAX_IMAGES),
            })}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div
              key={`${image.mimeType}-${index}`}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${image.mimeType};base64,${image.base64Data}`}
                alt={t("aiImagePreview")}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={isAnalyzing || disabled}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60">
              <Upload className="mb-1 h-5 w-5" />
              <span className="text-xs">{t("aiUploadImage")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void handleFiles(e.target.files)}
                disabled={disabled || isAnalyzing}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={disabled || isAnalyzing || (!text.trim() && images.length === 0)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("aiAnalyzing")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("aiAnalyze")}
          </>
        )}
      </button>
    </div>
  );
}

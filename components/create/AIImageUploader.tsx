"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { AIImageInput } from "@/lib/ai/types";
import { useTranslation } from "@/lib/useTranslation";
import { ErrorState } from "@/components/ui/ErrorState";

export interface AIImageUploaderProps {
  images: AIImageInput[];
  onChange: (images: AIImageInput[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxSizeBytes?: number;
}

const DEFAULT_MAX_IMAGES = 5;
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

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

export function AIImageUploader({
  images,
  onChange,
  disabled = false,
  maxImages = DEFAULT_MAX_IMAGES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
}: AIImageUploaderProps) {
  const { t } = useTranslation();
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
        if (file.size > maxSizeBytes) {
          setError(t("aiImageSizeError"));
          continue;
        }
        if (images.length + newImages.length >= maxImages) {
          setError(t("aiImageLimitError", { max: String(maxImages) }));
          break;
        }

        try {
          const base64Data = await fileToBase64(file);
          newImages.push({ mimeType: file.type, base64Data });
        } catch {
          setError(t("aiImageReadError"));
        }
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    },
    [images, onChange, maxImages, maxSizeBytes, t]
  );

  const removeImage = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index));
    },
    [images, onChange]
  );

  return (
    <div className="space-y-3">
      {error && (
        <ErrorState description={error} />
      )}

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
              disabled={disabled}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60">
            <Upload className="mb-1 h-5 w-5" />
            <span className="text-xs">{images.length === 0 ? t("aiUploadImage") : `${images.length}/${maxImages}`}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void handleFiles(e.target.files)}
              disabled={disabled}
              className="sr-only"
            />
          </label>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { useNoteStore } from "@/stores/noteStore";
import { useObjectStore } from "@/stores/objectStore";
import { useTranslation } from "@/lib/useTranslation";
import { NoteSourceType, NoteAttachment } from "@/lib/types";
import { triggerBackgroundObjectUpdate } from "@/lib/ai/objectIntelligence/update";

interface NoteFormProps {
  initialObjectId?: string;
}

const SOURCE_TYPES: { value: NoteSourceType; labelKey: string }[] = [
  { value: "text", labelKey: "noteSourceText" },
  { value: "chat", labelKey: "noteSourceChat" },
  { value: "email", labelKey: "noteSourceEmail" },
  { value: "social_post", labelKey: "noteSourceSocialPost" },
  { value: "document", labelKey: "noteSourceDocument" },
  { value: "resume", labelKey: "noteSourceResume" },
  { value: "image", labelKey: "noteSourceImage" },
];

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

export function NoteForm({ initialObjectId }: NoteFormProps) {
  const router = useRouter();
  const objects = useObjectStore((s) => s.objects);
  const objectsLoaded = useObjectStore((s) => s.loaded);
  const objectsLoading = useObjectStore((s) => s._loading);
  const loadObjects = useObjectStore((s) => s.load);
  const addNote = useNoteStore((s) => s.addNote);
  const { t } = useTranslation();
  const [objectId, setObjectId] = useState(initialObjectId || "");
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState<NoteSourceType>("text");
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!objectsLoaded && !objectsLoading) {
      void loadObjects();
    }
  }, [objectsLoaded, objectsLoading, loadObjects]);

  const sortedObjects = useMemo(
    () => objects.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [objects]
  );

  const selectedObject = useMemo(
    () => sortedObjects.find((o) => o.id === objectId),
    [sortedObjects, objectId]
  );

  const canSubmit =
    objectsLoaded &&
    sortedObjects.length > 0 &&
    !submitting &&
    objectId.trim().length > 0 &&
    content.trim().length > 0;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setImageError(null);

      const newAttachments: NoteAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setImageError(t("aiImageTypeError"));
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setImageError(t("aiImageSizeError"));
          continue;
        }
        if (attachments.length + newAttachments.length >= MAX_IMAGES) {
          setImageError(t("aiImageLimitError", { max: String(MAX_IMAGES) }));
          break;
        }

        try {
          const base64Data = await fileToBase64(file);
          newAttachments.push({ mimeType: file.type, base64Data });
        } catch {
          setImageError(t("aiImageReadError"));
        }
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
        if (sourceType === "text" && newAttachments.length > 0) {
          setSourceType("image");
        }
      }
    },
    [attachments.length, sourceType, t]
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const selectedObjectId = objectId.trim();
    const noteContent = content.trim();
    if (
      !selectedObjectId ||
      !objects.some((object) => object.id === selectedObjectId)
    ) {
      setError(t("pleaseSelectObject"));
      return;
    }
    if (!noteContent) {
      setError(t("noteContentRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await addNote({
        object_id: selectedObjectId,
        content: noteContent,
        sourceType,
        attachments,
      });

      const targetObject = objects.find((o) => o.id === selectedObjectId);
      if (targetObject?.type === "self") {
        void triggerBackgroundObjectUpdate(targetObject, created);
      } else if (targetObject?.type === "person") {
        const shouldUpdate = confirm(
          t("confirmUpdatePersonAfterNote") ??
            "Note saved. Update this person's AI understanding with the new material?"
        );
        if (shouldUpdate) {
          router.push(`/objects/${created.object_id}/update-ai?noteId=${created.id}`);
          return;
        }
      }

      router.push(`/objects/${created.object_id}`);
    } catch (err) {
      console.error("Failed to create note:", err);
      setError(err instanceof Error ? err.message : t("failedToCreateNote"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("linkToObject")}</label>
        <select
          value={objectId}
          name="object_id"
          onChange={(e) => setObjectId(e.target.value)}
          disabled={!objectsLoaded || sortedObjects.length === 0}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent disabled:bg-muted"
        >
          <option value="" disabled>
            {!objectsLoaded ? t("loading") : t("selectObject")}
          </option>
          {sortedObjects.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.name} ({t(obj.type)})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("noteSourceType")}</label>
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as NoteSourceType)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        >
          {SOURCE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {t(type.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("content")}</label>
        <textarea
          value={content}
          name="content"
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={8}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{t("noteAttachments")}</label>
          <span className="text-xs text-muted-foreground">
            {t("aiImageCount", {
              current: String(attachments.length),
              max: String(MAX_IMAGES),
            })}
          </span>
        </div>

        {imageError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {imageError}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {attachments.map((attachment, index) => (
            <div
              key={`${attachment.mimeType}-${index}`}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:${attachment.mimeType};base64,${attachment.base64Data}`}
                alt={t("aiImagePreview")}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {attachments.length < MAX_IMAGES && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background text-muted-foreground transition-colors hover:border-accent hover:text-accent">
              <Upload className="mb-1 h-5 w-5" />
              <span className="text-xs">{t("aiUploadImage")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void handleFiles(e.target.files)}
                className="sr-only"
              />
            </label>
          )}
        </div>
      </div>

      {selectedObject?.type === "person" && (
        <p className="text-xs text-muted-foreground">
          {t("noteWillFeedPersonAI") ??
            "This note can be used to update the person's AI understanding after saving."}
        </p>
      )}
      {selectedObject?.type === "self" && (
        <p className="text-xs text-muted-foreground">
          {t("noteWillFeedSelfAI") ??
            "This note will gently update your Self understanding in the background."}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("saving") : t("saveNote")}
        </button>
      </div>
    </form>
  );
}

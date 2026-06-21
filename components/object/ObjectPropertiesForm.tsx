"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { LifeObject, ObjectProperties } from "@/lib/types";
import {
  getPropertyLabel,
  formatPropertyValue,
} from "@/lib/objectProperties";
import { ObjectPropertyEditor } from "./ObjectPropertyEditor";
import { useTranslation } from "@/lib/useTranslation";

interface ObjectPropertiesFormProps {
  object: LifeObject;
  onChange: (properties: ObjectProperties) => void | Promise<void>;
}

export function ObjectPropertiesForm({
  object,
  onChange,
}: ObjectPropertiesFormProps) {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ObjectProperties | undefined>(
    object.properties
  );

  const entries = Object.entries(object.properties ?? {});

  const startEditing = () => {
    setDraft(object.properties);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(object.properties);
    setIsEditing(false);
  };

  const saveEditing = async () => {
    if (draft) {
      await onChange(draft);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noProperties")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-border/50 bg-background p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {getPropertyLabel(object.type, key, language)}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatPropertyValue(value)}
                </p>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={startEditing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("editProperties")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ObjectPropertyEditor
        type={object.type}
        properties={draft ?? {}}
        onChange={setDraft}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={cancelEditing}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={() => void saveEditing()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          {t("save")}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { LifeObject, ObjectProperties } from "@/lib/types";
import {
  guessFieldType,
  getPropertyLabel,
  formatPropertyValue,
  getFieldSchema,
  PropertyFieldSchema,
} from "@/lib/objectProperties";
import { useTranslation } from "@/lib/useTranslation";

interface ObjectPropertiesFormProps {
  object: LifeObject;
  onChange: (properties: ObjectProperties) => void | Promise<void>;
}

function valueToEditString(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function editStringToValue(
  type: LifeObject["type"],
  key: string,
  raw: string
): unknown {
  const fieldType = guessFieldType(type, key);
  const trimmed = raw.trim();
  switch (fieldType) {
    case "number": {
      const num = Number(trimmed);
      return Number.isNaN(num) ? 0 : num;
    }
    case "tags":
      return trimmed
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    case "text":
    case "textarea":
    case "date":
    case "select":
    default:
      return trimmed;
  }
}

function SelectInput({
  schema,
  value,
  onChange,
  placeholder,
}: {
  schema: PropertyFieldSchema;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { language } = useTranslation();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
    >
      <option value="">{placeholder ?? ""}</option>
      {schema.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {language === "zh" ? option.labelZh : option.label}
        </option>
      ))}
    </select>
  );
}

export function ObjectPropertiesForm({
  object,
  onChange,
}: ObjectPropertiesFormProps) {
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(object.properties ?? {}).map(([k, v]) => [
        k,
        valueToEditString(v),
      ])
    )
  );

  const entries = Object.entries(object.properties ?? {});

  const startEditing = () => {
    setDraft(
      Object.fromEntries(
        Object.entries(object.properties ?? {}).map(([k, v]) => [
          k,
          valueToEditString(v),
        ])
      )
    );
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async () => {
    const next: ObjectProperties = {};
    for (const [key, raw] of Object.entries(draft)) {
      const trimmedKey = key.trim();
      if (!trimmedKey) continue;
      next[trimmedKey] = editStringToValue(object.type, trimmedKey, raw);
    }
    await onChange(next);
    setIsEditing(false);
  };

  const updateKey = (oldKey: string, newKey: string) => {
    const trimmedNew = newKey.trim();
    if (
      !trimmedNew ||
      (trimmedNew !== oldKey && draft[trimmedNew] !== undefined)
    ) {
      return;
    }
    const { [oldKey]: value, ...rest } = draft;
    setDraft({ ...rest, [trimmedNew]: value });
  };

  const updateValue = (key: string, value: string) => {
    setDraft({ ...draft, [key]: value });
  };

  const deleteProperty = (key: string) => {
    setDraft(
      Object.fromEntries(Object.entries(draft).filter(([k]) => k !== key))
    );
  };

  const addProperty = () => {
    setDraft({ ...draft, "": "" });
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
      <div className="space-y-3">
        {Object.entries(draft).map(([key, value]) => {
          const fieldType = guessFieldType(object.type, key);
          const selectSchema =
            fieldType === "select" ? getFieldSchema(object.type, key) : undefined;

          return (
            <div
              key={key}
              className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_2fr_auto]"
            >
              <input
                type="text"
                value={key}
                onChange={(e) => updateKey(key, e.target.value)}
                placeholder={t("propertyName")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
              {selectSchema ? (
                <SelectInput
                  schema={selectSchema}
                  value={value}
                  onChange={(v) => updateValue(key, v)}
                  placeholder={t("propertyValue")}
                />
              ) : fieldType === "number" ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => updateValue(key, e.target.value)}
                  placeholder={t("propertyValue")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                />
              ) : fieldType === "date" ? (
                <input
                  type="date"
                  value={value}
                  onChange={(e) => updateValue(key, e.target.value)}
                  placeholder={t("propertyValue")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                />
              ) : (
                <textarea
                  value={value}
                  onChange={(e) => updateValue(key, e.target.value)}
                  placeholder={t("propertyValue")}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
                />
              )}
              <button
                type="button"
                onClick={() => deleteProperty(key)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title={t("deleteProperty")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addProperty}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-input px-3 py-2 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        {t("addProperty")}
      </button>

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

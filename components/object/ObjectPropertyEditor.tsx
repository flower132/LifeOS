"use client";

import { Plus, Trash2 } from "lucide-react";
import { LifeObjectType, ObjectProperties } from "@/lib/types";
import {
  getFieldSchema,
  guessFieldType,
  PropertyFieldSchema,
} from "@/lib/objectProperties";
import {
  getFieldLabel,
  getFieldPlaceholder,
  isSystemField,
} from "@/lib/fieldRegistry";
import { useTranslation } from "@/lib/useTranslation";

interface ObjectPropertyEditorProps {
  type: LifeObjectType;
  properties: ObjectProperties;
  onChange: (properties: ObjectProperties) => void;
}

function valueToEditString(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function editStringToValue(
  type: LifeObjectType,
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
          {option.label[language] ?? option.label.en}
        </option>
      ))}
    </select>
  );
}

export function ObjectPropertyEditor({
  type,
  properties,
  onChange,
}: ObjectPropertyEditorProps) {
  const { t, language } = useTranslation();

  const entries = Object.entries(properties ?? {});

  const updateKey = (oldKey: string, newKey: string) => {
    const trimmedNew = newKey.trim();
    if (
      !trimmedNew ||
      (trimmedNew !== oldKey && properties[trimmedNew] !== undefined)
    ) {
      return;
    }
    const { [oldKey]: value, ...rest } = properties;
    onChange({ ...rest, [trimmedNew]: value });
  };

  const updateValue = (key: string, raw: string) => {
    onChange({ ...properties, [key]: editStringToValue(type, key, raw) });
  };

  const deleteProperty = (key: string) => {
    const rest = { ...properties };
    delete rest[key];
    onChange(rest);
  };

  const addProperty = () => {
    onChange({ ...properties, "": "" });
  };

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => {
        const fieldType = guessFieldType(type, key);
        const selectSchema =
          fieldType === "select" ? getFieldSchema(type, key) : undefined;
        const systemField = isSystemField(type, key);
        const fieldLabel = getFieldLabel(type, key, language);
        const fieldPlaceholder =
          getFieldPlaceholder(type, key, language) || t("propertyValue");

        return (
          <div
            key={key}
            className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_2fr_auto]"
          >
            {systemField ? (
              <label className="flex min-h-[2.5rem] items-center rounded-lg border border-transparent px-1 text-sm font-medium text-foreground">
                {fieldLabel}
              </label>
            ) : (
              <input
                type="text"
                value={key}
                onChange={(e) => updateKey(key, e.target.value)}
                placeholder={t("propertyName")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            )}
            {selectSchema ? (
              <SelectInput
                schema={selectSchema}
                value={valueToEditString(value)}
                onChange={(v) => updateValue(key, v)}
                placeholder={fieldPlaceholder}
              />
            ) : fieldType === "number" ? (
              <input
                type="number"
                min={0}
                max={100}
                value={valueToEditString(value)}
                onChange={(e) => updateValue(key, e.target.value)}
                placeholder={fieldPlaceholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            ) : fieldType === "date" ? (
              <input
                type="date"
                value={valueToEditString(value)}
                onChange={(e) => updateValue(key, e.target.value)}
                placeholder={fieldPlaceholder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent"
              />
            ) : (
              <textarea
                value={valueToEditString(value)}
                onChange={(e) => updateValue(key, e.target.value)}
                placeholder={fieldPlaceholder}
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

      <button
        type="button"
        onClick={addProperty}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-input px-3 py-2 text-sm font-medium text-muted-foreground hover:border-accent hover:text-accent"
      >
        <Plus className="h-4 w-4" />
        {t("addProperty")}
      </button>
    </div>
  );
}

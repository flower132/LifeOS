import { Language } from "./i18n";
import {
  PropertyFieldType,
  getFieldSchema,
  getPropertyLabel,
  getPropertyPlaceholder,
  guessFieldType,
} from "./objectProperties";
import { LifeObjectType } from "./types";

export type { PropertyFieldType } from "./objectProperties";

/**
 * Unified field registry for object property labels, placeholders, and types.
 * All field-name display in the UI should go through this module.
 */

export function getFieldLabel(
  type: LifeObjectType,
  key: string,
  language: Language
): string {
  return getPropertyLabel(type, key, language);
}

export function getFieldPlaceholder(
  type: LifeObjectType,
  key: string,
  language: Language
): string {
  return getPropertyPlaceholder(type, key, language);
}

export function getFieldType(
  type: LifeObjectType,
  key: string
): PropertyFieldType {
  return guessFieldType(type, key);
}

export function isSystemField(
  type: LifeObjectType,
  key: string
): boolean {
  return getFieldSchema(type, key) !== undefined;
}

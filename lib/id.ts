import { v4 as uuidv4 } from "uuid";

/**
 * Generate a universally unique identifier.
 *
 * Uses the `uuid` package so it works in browsers, React Native/WebView,
 * Node.js, and test environments where `crypto.randomUUID` may not be
 * available.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a unique identifier with an optional prefix.
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${uuidv4()}`;
}

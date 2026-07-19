#!/usr/bin/env node

/**
 * Finds UI strings which bypass `t("namespace.key")` and translation keys
 * referenced by UI that are absent from the default catalogue. It deliberately
 * excludes AI prompts and domain data: those are model/user content, not UI.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["app", "components", "hooks", "lib", "stores", "utils"];
const ignoredPath = /(^|\/)(translations|prompts|lifebrain|services|__tests__|node_modules)(\/|$)/;
const sourceExtension = /\.(?:ts|tsx)$/;
const uiLiteral = /(?:>|placeholder=|title=|aria-label=|label=)\s*["{]?["']([^"'\n]*(?:[\u4e00-\u9fff]|[A-Za-z]{3,})[^"'\n]*)["']?/g;
const translationCall = /\bt\(\s*["']([^"']+)["']/g;
const ignoredLine = /i18n-ignore/;

async function filesIn(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? filesIn(path) : [path];
    }));
    return nested.flat();
  } catch {
    return [];
  }
}

const sourceFiles = (await Promise.all(roots.map(filesIn)))
  .flat()
  .filter((path) => sourceExtension.test(path) && !ignoredPath.test(path));
const catalogue = await readFile("translations/en-US.ts", "utf8");
const legacyCatalogue = await readFile("lib/i18n.ts", "utf8");
const knownKeys = new Set([
  ...catalogue.matchAll(/["']([^"']+)["']\s*:/g),
  ...legacyCatalogue.matchAll(/^\s{4}([A-Za-z][A-Za-z0-9_]*)\s*:/gm),
].map((match) => match[1]));
const findings = [];
const missingKeys = new Map();

for (const file of sourceFiles) {
  const content = await readFile(file, "utf8");
  const lines = content.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (ignoredLine.test(line)) continue;
    uiLiteral.lastIndex = 0;
    if (uiLiteral.test(line) && !line.includes("t(")) {
      findings.push(`${relative(process.cwd(), file)}:${index + 1}: direct UI text`);
    }
  }
  for (const match of content.matchAll(translationCall)) {
    const key = match[1];
    if (!knownKeys.has(key) && !key.includes("${")) {
      const line = content.slice(0, match.index).split("\n").length;
      missingKeys.set(`${relative(process.cwd(), file)}:${line}`, key);
    }
  }
}

for (const finding of findings) console.warn(`[i18n] ${finding}`);
for (const [location, key] of missingKeys) console.warn(`[i18n] ${location}: missing key \`${key}\``);

console.log(`[i18n] scanned ${sourceFiles.length} files; ${findings.length} direct UI strings, ${missingKeys.size} missing keys.`);
if (process.argv.includes("--strict") && (findings.length || missingKeys.size)) process.exitCode = 1;

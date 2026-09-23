import fs from 'node:fs';
import path from 'node:path';

/**
 * Tailwind v3 (Stitch)-only tokens that Tailwind v4 silently emits no CSS
 * for (ADR-2, R-1). `rounded` and `rounded-sm` are banned only as *exact*
 * utility tokens (after stripping variant prefixes like `hover:`), so
 * `rounded-xs`/`rounded-lg`/`rounded-xl`/`rounded-full` are never flagged.
 */
const BANNED_EXACT = new Set(['rounded', 'rounded-sm']);
const BANNED_PREFIXES = [
  'font-display-lg',
  'font-headline-',
  'font-body-',
  'font-label-',
  'font-code-',
  'flex-shrink-',
  'flex-grow-',
];

export function isBannedToken(token) {
  if (BANNED_EXACT.has(token)) return true;
  return BANNED_PREFIXES.some((prefix) => token.startsWith(prefix));
}

/** Splits a raw utility candidate (post variant-stripping) from a source blob. */
export function findBannedTokens(source) {
  const matches = [];
  const candidates = source.split(/[\s"'`]+/);
  for (const raw of candidates) {
    if (!raw) continue;
    // Strip variant prefixes (`hover:`, `sm:`, `dark:`, stacked `sm:hover:`…).
    const parts = raw.split(':');
    const token = parts[parts.length - 1];
    if (isBannedToken(token)) {
      matches.push({ token, raw });
    }
  }
  return matches;
}

export function walkJsxFiles(rootDir) {
  const results = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsxFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

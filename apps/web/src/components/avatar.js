/** First letters of the first two words of `name`, uppercased (pure). */
export function getInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Four literal Stitch tone pairs (class-literal rule, ADR-2 — never interpolated).
const TONES = [
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-error-container text-on-error-container',
  'bg-surface-container-highest text-on-surface',
  'bg-primary-container text-primary-fixed-dim',
];

/** Deterministically maps `name` to one of the 4 literal tone-pair strings. */
export function toneFor(name) {
  const str = name ?? '';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % TONES.length;
  return TONES[index];
}

// Pure helpers for the breeds page: turning The Cat API's JSON into breeds, and the display rules.
// No DOM and no network here, so all of it is easy to test. The Android app has the same rules
// (CatParser.kt and CatFormat.kt) with matching tests.

export const MSG_LIST = 'Could not load the breed list. Check your connection and try again.';
export const MSG_DATA = 'Error reading breed data';
export const MSG_MISSING = 'The breed data is missing. Run "npm run update-data" (see the README).';
export const UNKNOWN = 'Unknown';

/** Raised when data arrives but is missing or malformed. */
export class DataError extends Error {
  constructor(message = MSG_DATA) {
    super(message);
    this.name = 'DataError';
  }
}

// A missing field or an explicit null gives '' (never the text "null")
const text = (value) => (value === null || value === undefined ? '' : String(value));

/**
 * Turns the API's breed list into breeds: { id, name, origin, temperament, description, lifeSpan, weight, referenceImageId }.
 * Entries without an id or a name are skipped. The result is sorted by name, ignoring upper/lower case.
 */
export function normalizeBreeds(list) {
  if (!Array.isArray(list)) throw new DataError();
  const breeds = [];
  for (const item of list) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) continue;
    const id = text(item.id);
    const name = text(item.name);
    if (id.trim() === '' || name.trim() === '') continue;
    breeds.push({
      id,
      name,
      origin: text(item.origin),
      temperament: text(item.temperament),
      description: text(item.description),
      lifeSpan: text(item.life_span),
      weight: item.weight && typeof item.weight === 'object' ? text(item.weight.metric) : '',
      referenceImageId: text(item.reference_image_id),
    });
  }
  return breeds.sort((a, b) => {
    const x = a.name.toLowerCase();
    const y = b.name.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

// ── Display rules ───────────────────────────────────────────────────────────

/** Any text field: blank shows "Unknown" instead of an empty gap. */
export function orUnknown(value) {
  const trimmed = text(value).trim();
  return trimmed === '' ? UNKNOWN : trimmed;
}

/** "14 - 15 years" */
export function formatLifeSpan(value) {
  const trimmed = text(value).trim();
  return trimmed === '' ? UNKNOWN : `${trimmed} years`;
}

/** "3 - 5 kg" */
export function formatWeight(value) {
  const trimmed = text(value).trim();
  return trimmed === '' ? UNKNOWN : `${trimmed} kg`;
}

/** The photo address from an image lookup. Only https addresses are used. */
export function parseImageUrl(body) {
  if (!body || typeof body.url !== 'string') return null;
  try {
    const url = new URL(body.url);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

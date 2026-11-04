// Makes web/data/breeds.json, the breed list the page shows.
//
// The Cat API's breed list needs an API key, and a web page can't keep a key private, so the list is
// fetched here, once, at deploy time (or by you, locally) and published as a plain data file. The key
// is only ever used by this script. It never goes into the page or the repository.
//
//   npm run update-data
//
// The key is read from the CAT_API_KEY environment variable, or from the Android project's
// CatBreedsApp/local.properties (the same line the Android app uses: CAT_API_KEY=your_key).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeBreeds } from '../src/breeds.js';

export const BREEDS_URL = 'https://api.thecatapi.com/v1/breeds';
const HERE = dirname(fileURLToPath(import.meta.url));

/** The key from the environment, else from the text of a local.properties file, else ''. */
export function findKey(env, localPropertiesText = '') {
  const fromEnv = (env.CAT_API_KEY || '').trim();
  if (fromEnv) return fromEnv;
  for (const rawLine of localPropertiesText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('#') || line.startsWith('!')) continue;
    const match = line.match(/^CAT_API_KEY\s*[=:]\s*(.*)$/);
    if (match && match[1].trim()) return match[1].trim();
  }
  return '';
}

// Only what the page shows, in the API's own shape, so the page uses the same parser for it
const toApiShape = (breed) => ({
  id: breed.id,
  name: breed.name,
  origin: breed.origin,
  temperament: breed.temperament,
  description: breed.description,
  life_span: breed.lifeSpan,
  weight: { metric: breed.weight },
  reference_image_id: breed.referenceImageId,
});

/** The contents of breeds.json for a raw API response. */
export function buildDataFile(rawList, now = new Date()) {
  const breeds = normalizeBreeds(rawList);
  if (breeds.length === 0) throw new Error('The Cat API returned no breeds.');
  return {
    generatedAt: now.toISOString(),
    source: 'https://thecatapi.com',
    breeds: breeds.map(toApiShape),
  };
}

export async function fetchBreeds(key, fetchImpl = fetch) {
  const response = await fetchImpl(BREEDS_URL, { headers: { 'x-api-key': key } });
  if (response.status === 401 || response.status === 403) {
    throw new Error('The Cat API rejected the key. Check it is correct and active.');
  }
  if (!response.ok) throw new Error(`The Cat API answered with status ${response.status}.`);
  return response.json();
}

async function main() {
  let localText = '';
  try {
    localText = readFileSync(join(HERE, '..', '..', 'CatBreedsApp', 'local.properties'), 'utf8');
  } catch {
    // no local.properties: fine, the environment variable may be set
  }
  const key = findKey(process.env, localText);
  if (!key) {
    console.error(
      'No Cat API key found.\n' +
        'Set the CAT_API_KEY environment variable, or add CAT_API_KEY=your_key to CatBreedsApp/local.properties.\n' +
        'Get a free key at https://thecatapi.com',
    );
    process.exit(1);
  }

  const file = buildDataFile(await fetchBreeds(key));
  const out = join(HERE, '..', 'data', 'breeds.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(file, null, 1)}\n`);
  console.log(`Wrote ${file.breeds.length} breeds to web/data/breeds.json`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

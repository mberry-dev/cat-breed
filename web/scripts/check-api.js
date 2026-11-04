// Live contract check: calls the real Cat API and confirms it still answers the way the page expects.
//
//   npm run check:api
//
// - The photo lookup needs no key and is called by the page itself, so it is always checked, including that
//   the service allows requests from a web page (CORS), which a Node script can't test by itself.
// - The breed list needs a key, so it is checked only when CAT_API_KEY is set (it is, on GitHub, from a secret).
//
// Not part of `npm test` because it needs the internet and depends on a service we don't control.

import { IMAGE_URL } from '../src/api.js';
import { normalizeBreeds, parseImageUrl } from '../src/breeds.js';
import { BREEDS_URL } from './update-data.js';

const SITE_ORIGIN = 'https://mberry-dev.github.io';
const SAMPLE_IMAGE = '0XYvRd7oD'; // Abyssinian's photo
let failures = 0;

function check(name, passed, detail = '') {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${passed || !detail ? '' : `  -> ${detail}`}`);
  if (!passed) failures++;
}

// One retry, so a single network blip doesn't fail the check
async function get(url, headers = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, { headers: { Origin: SITE_ORIGIN, ...headers } });
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

async function main() {
  // Photo lookup, no key
  try {
    const response = await get(`${IMAGE_URL}/${SAMPLE_IMAGE}`);
    check('photo lookup answers without a key', response.ok, `status ${response.status}`);
    const allowed = response.headers.get('access-control-allow-origin');
    check('photo lookup allows requests from a web page (CORS)', allowed === '*' || allowed === SITE_ORIGIN, String(allowed));
    const url = parseImageUrl(await response.json());
    check('photo lookup gives an https photo address', url !== null, String(url));
    if (url) {
      const photo = await get(url);
      check('the photo itself loads', photo.ok && (photo.headers.get('content-type') || '').startsWith('image/'), `status ${photo.status}`);
    }
  } catch (error) {
    check('photo lookup reachable', false, error.message);
  }

  // Breed list, needs a key
  const key = (process.env.CAT_API_KEY || '').trim();
  if (!key) {
    console.log('SKIP breed list (no CAT_API_KEY set)');
  } else {
    try {
      const response = await get(BREEDS_URL, { 'x-api-key': key });
      check('breed list answers with the key', response.ok, `status ${response.status}`);
      const breeds = normalizeBreeds(await response.json());
      check('breed list has plenty of breeds', breeds.length >= 30, `${breeds.length} breeds`);
      check('every breed has a name and an id', breeds.every((b) => b.id && b.name));
      check('most breeds have a photo id', breeds.filter((b) => b.referenceImageId).length >= breeds.length * 0.8);
    } catch (error) {
      check('breed list reachable', false, error.message);
    }
  }

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures ? 1 : 0);
}

main();

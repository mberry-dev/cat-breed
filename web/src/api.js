// Loads the data for the page. The breed list is a data file published with the site (made at deploy time
// by scripts/update-data.js, because The Cat API's breed list needs a key and a web page can't keep a key
// private). The photo lookup needs no key, so the page calls The Cat API for that directly.

import { DataError, normalizeBreeds, parseImageUrl } from './breeds.js';

export const DATA_URL = './data/breeds.json';
export const IMAGE_URL = 'https://api.thecatapi.com/v1/images';

export class NetworkError extends Error {
  constructor(message = 'Network error.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** The data file does not exist (it hasn't been generated yet). */
export class DataMissingError extends Error {
  constructor(message = 'The breed data file is missing.') {
    super(message);
    this.name = 'DataMissingError';
  }
}

async function request(fetchImpl, url, signal) {
  try {
    return await fetchImpl(url, { signal });
  } catch (error) {
    if (error && error.name === 'AbortError') throw error; // a cancelled request is not an error to report
    throw new NetworkError(error && error.message ? error.message : undefined);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    throw new DataError('The response is not valid JSON.');
  }
}

/** All breeds, sorted by name. */
export async function loadBreeds({ fetch: fetchImpl, url = DATA_URL, signal } = {}) {
  const response = await request(fetchImpl, url, signal);
  if (response.status === 404) throw new DataMissingError();
  if (!response.ok) throw new NetworkError(`The server answered with status ${response.status}.`);
  const body = await readJson(response);
  const list = Array.isArray(body) ? body : body && body.breeds;
  const breeds = normalizeBreeds(list);
  if (breeds.length === 0) throw new DataError('The breed list is empty.');
  return breeds;
}

/** The photo address for a breed's reference image, or null if it has none. */
export async function getImageUrl(imageId, { fetch: fetchImpl, signal } = {}) {
  const response = await request(fetchImpl, `${IMAGE_URL}/${encodeURIComponent(imageId)}`, signal);
  if (!response.ok) return null;
  return parseImageUrl(await readJson(response));
}

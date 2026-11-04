import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDataFile, fetchBreeds, findKey } from '../scripts/update-data.js';
import { normalizeBreeds } from '../src/breeds.js';

const sample = JSON.parse(readFileSync(new URL('./fixtures/breeds-sample.json', import.meta.url), 'utf8'));

describe('findKey', () => {
  test('uses the environment variable first', () => {
    assert.equal(findKey({ CAT_API_KEY: ' env-key ' }, 'CAT_API_KEY=file-key'), 'env-key');
  });
  test('falls back to local.properties', () => {
    assert.equal(findKey({}, 'sdk.dir=C\\:\\\\sdk\nCAT_API_KEY=file-key\n'), 'file-key');
    assert.equal(findKey({}, 'CAT_API_KEY = spaced\r\n'), 'spaced');
  });
  test('ignores comments and other keys', () => {
    assert.equal(findKey({}, '# CAT_API_KEY=commented\nWEATHER_API_KEY=other'), '');
  });
  test('no key gives an empty string', () => {
    assert.equal(findKey({}, ''), '');
    assert.equal(findKey({}), '');
    assert.equal(findKey({ CAT_API_KEY: '   ' }, 'CAT_API_KEY='), '');
  });
});

describe('buildDataFile', () => {
  const file = buildDataFile(sample, new Date('2026-11-04T12:00:00Z'));
  test('records when and where the data came from', () => {
    assert.equal(file.generatedAt, '2026-11-04T12:00:00.000Z');
    assert.equal(file.source, 'https://thecatapi.com');
  });
  test('keeps only what the page shows, and the page reads it back to the same breeds', () => {
    assert.deepEqual(Object.keys(file.breeds[0]).sort(), [
      'description', 'id', 'life_span', 'name', 'origin', 'reference_image_id', 'temperament', 'weight',
    ]);
    assert.deepEqual(normalizeBreeds(file.breeds), normalizeBreeds(sample));
  });
  test('refuses an empty list rather than publishing an empty page', () => {
    assert.throws(() => buildDataFile([]), /no breeds/);
  });
});

describe('fetchBreeds', () => {
  test('sends the key in the x-api-key header', async () => {
    let init;
    await fetchBreeds('secret', async (url, i) => { init = i; return { ok: true, status: 200, json: async () => [] }; });
    assert.equal(init.headers['x-api-key'], 'secret');
  });
  test('says so plainly when the key is rejected', async () => {
    await assert.rejects(fetchBreeds('bad', async () => ({ ok: false, status: 403 })), /rejected the key/);
  });
  test('reports other failures with the status', async () => {
    await assert.rejects(fetchBreeds('k', async () => ({ ok: false, status: 500 })), /status 500/);
  });
});

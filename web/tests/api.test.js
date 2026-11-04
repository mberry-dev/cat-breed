import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DataMissingError, NetworkError, getImageUrl, loadBreeds } from '../src/api.js';
import { DataError } from '../src/breeds.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const respond = (body, status = 200) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });

describe('loadBreeds', () => {
  test('reads the data file and sorts the breeds', async () => {
    const breeds = await loadBreeds({ fetch: respond({ breeds: fixture('breeds-sample.json') }) });
    assert.deepEqual(breeds.map((b) => b.name), ['Abyssinian', 'Maine Coon', 'Mystery Cat', 'Siberian']);
  });
  test('also accepts a plain list', async () => {
    const breeds = await loadBreeds({ fetch: respond(fixture('breeds-sample.json')) });
    assert.equal(breeds.length, 4);
  });
  test('asks for the data file next to the page', async () => {
    let asked;
    await loadBreeds({ fetch: async (url) => { asked = url; return respond(fixture('breeds-sample.json'))(); } });
    assert.equal(asked, './data/breeds.json');
  });
  test('a missing data file is reported as missing', async () => {
    await assert.rejects(loadBreeds({ fetch: respond({}, 404) }), DataMissingError);
  });
  test('a server error is a network error', async () => {
    await assert.rejects(loadBreeds({ fetch: respond({}, 500) }), NetworkError);
  });
  test('being offline is a network error', async () => {
    await assert.rejects(loadBreeds({ fetch: async () => { throw new TypeError('Failed to fetch'); } }), NetworkError);
  });
  test('invalid JSON is a data error', async () => {
    const fetch = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad'); } });
    await assert.rejects(loadBreeds({ fetch }), DataError);
  });
  test('data without a breed list, or with an empty one, is a data error', async () => {
    await assert.rejects(loadBreeds({ fetch: respond({ nothing: true }) }), DataError);
    await assert.rejects(loadBreeds({ fetch: respond({ breeds: [] }) }), DataError);
  });
  test('a cancelled request is not turned into a network error', async () => {
    const fetch = async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; };
    await assert.rejects(loadBreeds({ fetch }), (error) => error.name === 'AbortError');
  });
});

describe('getImageUrl', () => {
  test('returns the photo address', async () => {
    let asked;
    const url = await getImageUrl('0XYvRd7oD', { fetch: async (u) => { asked = u; return respond(fixture('image-abys.json'))(); } });
    assert.equal(url, 'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg');
    assert.equal(asked, 'https://api.thecatapi.com/v1/images/0XYvRd7oD');
  });
  test('sends no API key, because the lookup needs none and the page must not hold one', async () => {
    let init;
    await getImageUrl('x', { fetch: async (u, i) => { init = i; return respond(fixture('image-abys.json'))(); } });
    assert.equal(JSON.stringify(init).toLowerCase().includes('api-key'), false);
  });
  test('encodes the id', async () => {
    let asked;
    await getImageUrl('a/b?c', { fetch: async (u) => { asked = u; return respond({})(); } });
    assert.equal(asked, 'https://api.thecatapi.com/v1/images/a%2Fb%3Fc');
  });
  test('a failed lookup gives null', async () => {
    assert.equal(await getImageUrl('x', { fetch: respond({}, 404) }), null);
  });
  test('an answer without an https photo address gives null', async () => {
    assert.equal(await getImageUrl('x', { fetch: respond({ url: 'http://example.com/a.jpg' }) }), null);
  });
  test('being offline is a network error', async () => {
    await assert.rejects(getImageUrl('x', { fetch: async () => { throw new TypeError('x'); } }), NetworkError);
  });
});

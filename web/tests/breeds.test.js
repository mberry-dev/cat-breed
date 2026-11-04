import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DataError, formatLifeSpan, formatWeight, normalizeBreeds, orUnknown, parseImageUrl } from '../src/breeds.js';

// These mirror CatParserTest.kt and CatFormatTest.kt in the Android app, value for value: the same sample
// data must give the same breeds on both, and the same words on screen.
const SAMPLE = `[
  {"id":"sibe","name":"Siberian","origin":"Russia","temperament":"Curious, Intelligent","life_span":"12 - 15",
   "weight":{"imperial":"8 - 16","metric":"3 - 7"},"description":"Strong and smart.","reference_image_id":"3bkZAjRh1"},
  {"id":"abys","name":"abyssinian","origin":"Egypt","temperament":"Active, Gentle","life_span":"14 - 15",
   "weight":{"imperial":"7  -  10","metric":"3 - 5"},"description":"Loves to climb.","reference_image_id":"0XYvRd7oD"},
  {"id":"nowt","name":"No Weight Cat","origin":null,"life_span":"10 - 12","description":"Mystery."},
  {"id":"","name":"No Id"},
  {"id":"noname","name":""},
  "not an object"
]`;
const parse = () => normalizeBreeds(JSON.parse(SAMPLE));

describe('normalizeBreeds', () => {
  test('parses every field', () => {
    const abys = parse().find((b) => b.id === 'abys');
    assert.deepEqual(abys, {
      id: 'abys',
      name: 'abyssinian',
      origin: 'Egypt',
      temperament: 'Active, Gentle',
      description: 'Loves to climb.',
      lifeSpan: '14 - 15',
      weight: '3 - 5',
      referenceImageId: '0XYvRd7oD',
    });
  });
  test('sorts by name, ignoring upper and lower case', () => {
    assert.deepEqual(parse().map((b) => b.name), ['abyssinian', 'No Weight Cat', 'Siberian']);
  });
  test('skips entries without an id or a name', () => {
    const breeds = parse();
    assert.equal(breeds.length, 3);
    assert.ok(breeds.every((b) => b.id !== '' && b.name !== ''));
  });
  test('missing or null fields become empty text, never "null" or "undefined"', () => {
    const nowt = parse().find((b) => b.id === 'nowt');
    for (const field of ['origin', 'weight', 'referenceImageId', 'temperament']) assert.equal(nowt[field], '', field);
  });
  test('an empty list gives an empty result', () => {
    assert.deepEqual(normalizeBreeds([]), []);
  });
  test('something that is not a list is a data error', () => {
    for (const bad of [null, undefined, {}, 'text', 5]) assert.throws(() => normalizeBreeds(bad), DataError);
  });
});

describe('display rules', () => {
  test('life span gets the word years', () => {
    assert.equal(formatLifeSpan('14 - 15'), '14 - 15 years');
    assert.equal(formatLifeSpan(' 12 '), '12 years');
  });
  test('weight gets kg', () => {
    assert.equal(formatWeight('3 - 5'), '3 - 5 kg');
  });
  test('missing values show Unknown, not an empty gap or "Unknown kg"', () => {
    assert.equal(formatLifeSpan(''), 'Unknown');
    assert.equal(formatWeight('   '), 'Unknown');
    assert.equal(orUnknown(''), 'Unknown');
    assert.equal(orUnknown(null), 'Unknown');
    assert.equal(orUnknown('Egypt'), 'Egypt');
  });
});

describe('parseImageUrl', () => {
  test('accepts an https photo address', () => {
    assert.equal(parseImageUrl({ url: 'https://cdn2.thecatapi.com/images/a.jpg' }), 'https://cdn2.thecatapi.com/images/a.jpg');
  });
  test('rejects anything else', () => {
    for (const bad of [null, {}, { url: 5 }, { url: 'http://example.com/a.jpg' }, { url: 'javascript:alert(1)' }, { url: 'not a url' }]) {
      assert.equal(parseImageUrl(bad), null);
    }
  });
});

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { mountCatBreeds } from '../src/ui.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });
const settle = async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0)); };
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

// A fake network: routes by URL, records calls, and can hold an answer until the test releases it
function fakeNetwork() {
  const calls = [];
  const routes = [];
  const net = {
    calls,
    on(pattern, handler) { routes.push({ pattern, handler }); return net; },
    fetch: async (url, init) => {
      calls.push(String(url));
      const route = routes.find((r) => r.pattern.test(String(url)));
      if (!route) throw new Error(`unexpected request: ${url}`);
      return route.handler(String(url), init);
    },
    count: (pattern) => calls.filter((u) => pattern.test(u)).length,
  };
  return net;
}

const DATA = /data\/breeds\.json/;
const IMAGE = /v1\/images\//;
const imageFor = (url) => {
  if (url.endsWith('0XYvRd7oD')) return ok(fixture('image-abys.json'));
  if (url.endsWith('3bkZAjRh1')) return ok(fixture('image-sibe.json'));
  if (url.endsWith('OOD3VXAQn')) return ok(fixture('image-mcoo.json'));
  return fail(404);
};
const standardNetwork = () => fakeNetwork().on(DATA, () => ok({ breeds: fixture('breeds-sample.json') })).on(IMAGE, imageFor);

let dom, root, app;
const q = (selector) => root.querySelector(selector);
const text = (selector) => q(selector).textContent;
const optionNames = () => [...root.querySelectorAll('option')].map((o) => o.textContent);

async function pick(id) {
  q('.breed-select').value = id;
  q('.breed-select').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  await settle();
}
async function start(net = standardNetwork()) {
  app = mountCatBreeds(root, { fetch: net.fetch });
  await settle();
  return net;
}

beforeEach(() => {
  dom = new JSDOM('<!doctype html><div id="app"></div>');
  root = dom.window.document.getElementById('app');
});
afterEach(() => {
  app?.destroy();
  app = null;
  dom.window.close();
});

describe('first load', () => {
  test('shows "Loading breeds..." until the list arrives', async () => {
    const gate = deferred();
    const net = fakeNetwork().on(DATA, async () => { await gate.promise; return ok({ breeds: fixture('breeds-sample.json') }); }).on(IMAGE, imageFor);
    app = mountCatBreeds(root, { fetch: net.fetch });
    assert.equal(text('.status'), 'Loading breeds...');
    assert.equal(q('.status').hidden, false);
    assert.equal(q('.breed-select').disabled, true);
    assert.equal(text('.placeholder'), 'Select a breed to see information');
    gate.resolve();
    await settle();
    assert.equal(q('.status').hidden, true);
    assert.equal(q('.breed-select').disabled, false);
  });

  test('fills the dropdown with every breed, sorted by name, with a label for screen readers', async () => {
    await start();
    assert.deepEqual(optionNames(), ['Abyssinian', 'Maine Coon', 'Mystery Cat', 'Siberian']);
    assert.equal(q('label[for="breed-select"]').textContent, 'Breed');
  });

  test('shows the first breed straight away, like the Android dropdown', async () => {
    await start();
    assert.equal(text('.breed-name'), 'Abyssinian');
    assert.equal(q('.breed-select').value, 'abys');
    assert.equal(q('.breed').hidden, false);
    assert.equal(text('.origin'), 'Egypt');
    assert.equal(text('.life-span'), '14 - 15 years');
    assert.equal(text('.weight'), '3 - 5 kg');
    assert.equal(text('.temperament'), 'Active, Energetic, Gentle');
    assert.equal(text('.description'), 'Loves to climb.');
    assert.equal(q('.cat-image').getAttribute('src'), 'https://cdn2.thecatapi.com/images/0XYvRd7oD.jpg');
    assert.equal(q('.cat-image').hidden, false);
    assert.equal(q('.placeholder').hidden, true);
  });

  test('makes one request for the list and one for the first photo, and sends no key', async () => {
    const net = await start();
    assert.equal(net.count(DATA), 1);
    assert.equal(net.count(IMAGE), 1);
    assert.equal(net.calls.some((u) => /key/i.test(u)), false);
  });
});

describe('picking a breed', () => {
  test('shows its details and photo', async () => {
    await start();
    await pick('mcoo');
    assert.equal(text('.breed-name'), 'Maine Coon');
    assert.equal(text('.origin'), 'United States');
    assert.equal(text('.weight'), '4 - 8 kg');
    assert.equal(q('.cat-image').getAttribute('src'), 'https://cdn2.thecatapi.com/images/OOD3VXAQn.jpg');
  });

  test('missing information shows Unknown, and a breed with no photo says so without asking for one', async () => {
    const net = await start();
    const before = net.count(IMAGE);
    await pick('nowt');
    assert.equal(text('.origin'), 'Unknown');
    assert.equal(text('.life-span'), '10 - 12 years');
    assert.equal(text('.weight'), 'Unknown');
    assert.equal(text('.temperament'), 'Unknown');
    assert.equal(q('.cat-image').hidden, true);
    assert.equal(q('.cat-image').hasAttribute('src'), false);
    assert.equal(text('.placeholder'), 'No image available');
    assert.equal(net.count(IMAGE), before);
  });

  test('says "Loading image..." while the photo is on its way', async () => {
    const gate = deferred();
    const net = fakeNetwork().on(DATA, () => ok({ breeds: fixture('breeds-sample.json') }))
      .on(IMAGE, async (url) => { if (url.endsWith('OOD3VXAQn')) await gate.promise; return imageFor(url); });
    await start(net);
    await pick('mcoo');
    assert.equal(text('.placeholder'), 'Loading image...');
    assert.equal(q('.cat-image').hidden, true); // the previous cat is not left on screen
    gate.resolve();
    await settle();
    assert.equal(q('.cat-image').hidden, false);
  });

  test('a slow answer for an earlier breed never replaces the photo of the breed picked last', async () => {
    const gate = deferred();
    const net = fakeNetwork().on(DATA, () => ok({ breeds: fixture('breeds-sample.json') }))
      .on(IMAGE, async (url) => { if (url.endsWith('3bkZAjRh1')) await gate.promise; return imageFor(url); });
    await start(net);
    await pick('sibe');      // slow
    await pick('mcoo');      // fast, picked last
    assert.equal(q('.cat-image').getAttribute('src'), 'https://cdn2.thecatapi.com/images/OOD3VXAQn.jpg');
    gate.resolve();          // the slow answer now arrives
    await settle();
    assert.equal(text('.breed-name'), 'Maine Coon');
    assert.equal(q('.cat-image').getAttribute('src'), 'https://cdn2.thecatapi.com/images/OOD3VXAQn.jpg');
  });

  test('a failed photo lookup says "No image available" and the details stay', async () => {
    const net = fakeNetwork().on(DATA, () => ok({ breeds: fixture('breeds-sample.json') })).on(IMAGE, () => fail(500));
    await start(net);
    assert.equal(text('.breed-name'), 'Abyssinian');
    assert.equal(text('.placeholder'), 'No image available');
    assert.equal(q('.status').hidden, true); // no error banner for a missing photo
  });

  test('a photo lookup that cannot connect also just says "No image available"', async () => {
    const net = fakeNetwork().on(DATA, () => ok({ breeds: fixture('breeds-sample.json') })).on(IMAGE, () => { throw new TypeError('offline'); });
    await start(net);
    assert.equal(text('.placeholder'), 'No image available');
  });

  test('picking the breed that is already shown does nothing', async () => {
    const net = await start();
    const before = net.count(IMAGE);
    await pick('abys');
    assert.equal(net.count(IMAGE), before);
  });
});

describe('errors', () => {
  test('a list that cannot be loaded shows a message and a Retry button, and Retry works', async () => {
    let online = false;
    const net = fakeNetwork()
      .on(DATA, () => { if (!online) throw new TypeError('offline'); return ok({ breeds: fixture('breeds-sample.json') }); })
      .on(IMAGE, imageFor);
    await start(net);
    assert.equal(text('.status'), 'Could not load the breed list. Check your connection and try again.');
    assert.equal(q('.retry-button').hidden, false);
    assert.equal(q('.breed-select').disabled, true);

    online = true;
    q('.retry-button').click();
    await settle();
    assert.equal(q('.retry-button').hidden, true);
    assert.equal(q('.status').hidden, true);
    assert.equal(text('.breed-name'), 'Abyssinian');
  });

  test('a server error gets the same message', async () => {
    await start(fakeNetwork().on(DATA, () => fail(500)));
    assert.match(text('.status'), /Could not load the breed list/);
  });

  test('a missing data file says how to make it', async () => {
    await start(fakeNetwork().on(DATA, () => fail(404)));
    assert.match(text('.status'), /npm run update-data/);
  });

  test('unreadable data gets the data message', async () => {
    await start(fakeNetwork().on(DATA, () => ok({ breeds: 'nope' })));
    assert.equal(text('.status'), 'Error reading breed data');
  });
});

describe('safety', () => {
  test('text from the data can never inject markup', async () => {
    const evil = [{ id: 'x', name: '<img src=x onerror=alert(1)>', origin: '<b>bold</b>', reference_image_id: '' }];
    await start(fakeNetwork().on(DATA, () => ok({ breeds: evil })));
    assert.equal(root.querySelector('.breed-name img'), null);
    assert.equal(root.querySelector('.origin b'), null);
    assert.match(text('.breed-name'), /<img src=x onerror=alert\(1\)>/);
    assert.equal(q('option').textContent, '<img src=x onerror=alert(1)>');
  });

  test('a photo address that is not https is never used', async () => {
    const net = fakeNetwork().on(DATA, () => ok({ breeds: fixture('breeds-sample.json') }))
      .on(IMAGE, () => ok({ url: 'javascript:alert(1)' }));
    await start(net);
    assert.equal(q('.cat-image').hasAttribute('src'), false);
    assert.equal(text('.placeholder'), 'No image available');
  });
});

describe('clean up', () => {
  test('destroy removes the page and ignores answers that arrive afterwards', async () => {
    const gate = deferred();
    const net = fakeNetwork().on(DATA, async () => { await gate.promise; return ok({ breeds: fixture('breeds-sample.json') }); }).on(IMAGE, imageFor);
    app = mountCatBreeds(root, { fetch: net.fetch });
    app.destroy();
    gate.resolve();
    await settle();
    assert.equal(root.children.length, 0);
    app = null;
  });
});

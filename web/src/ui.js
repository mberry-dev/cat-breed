// The breeds page. Builds everything inside `root` with textContent (never innerHTML), so text from the
// API can't inject markup. Fetch is passed in so tests can use a fake network.

import { DataMissingError, NetworkError, getImageUrl, loadBreeds } from './api.js';
import {
  DataError, MSG_DATA, MSG_LIST, MSG_MISSING, formatLifeSpan, formatWeight, orUnknown,
} from './breeds.js';

function messageFor(error) {
  if (error instanceof DataMissingError) return MSG_MISSING;
  if (error instanceof NetworkError) return MSG_LIST;
  if (error instanceof DataError) return MSG_DATA;
  return MSG_LIST;
}

/**
 * Mounts the breeds page into `root`.
 * @param {HTMLElement} root
 * @param {object} [options]
 * @param {typeof fetch} [options.fetch]
 * @param {string} [options.dataUrl]
 */
export function mountCatBreeds(root, options = {}) {
  const doFetch = options.fetch ?? ((...args) => globalThis.fetch(...args));
  const doc = root.ownerDocument;

  let state = {
    breeds: [],
    selected: null,       // the breed being shown
    imageUrl: null,       // its photo, once known
    imageLoading: false,
    loading: false,       // loading the breed list
    error: '',
  };
  let imageRequest = 0;   // each photo lookup gets a number; an answer to an older one is ignored
  let imageController = null;
  let listController = null;

  function el(tag, className, content) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  // ── Build the page once ───────────────────────────────────────────────────

  const app = el('div', 'app');

  const top = el('div', 'top');
  const title = el('h1', 'title', '🐱 Cat Breeds');
  const label = el('label', 'visually-hidden', 'Breed');
  label.htmlFor = 'breed-select';
  const select = el('select', 'breed-select');
  select.id = 'breed-select';
  select.disabled = true;
  const status = el('p', 'status');
  status.setAttribute('role', 'status');
  const retryButton = el('button', 'retry-button', 'Retry');
  retryButton.type = 'button';
  top.append(title, label, select, status, retryButton);

  const content = el('div', 'content');
  const placeholder = el('p', 'placeholder');
  const breedBox = el('section', 'breed');
  breedBox.setAttribute('aria-live', 'polite');
  const image = el('img', 'cat-image');
  const breedName = el('h2', 'breed-name');
  const originValue = el('span', 'origin');
  const lifeSpanValue = el('span', 'life-span');
  const weightValue = el('span', 'weight');
  const temperamentValue = el('p', 'body-text temperament');
  const descriptionValue = el('p', 'body-text description');

  const row = (labelText, valueNode) => {
    const p = el('p', 'row');
    p.append(el('strong', 'row-label', `${labelText} `), valueNode);
    return p;
  };
  breedBox.append(
    image,
    breedName,
    row('Origin:', originValue),
    row('Life Span:', lifeSpanValue),
    row('Weight:', weightValue),
    el('p', 'row-label block-label', 'Temperament:'),
    temperamentValue,
    el('p', 'row-label block-label', 'About:'),
    descriptionValue,
  );
  content.append(placeholder, breedBox);
  app.append(top, content);
  root.replaceChildren(app);

  // ── Draw the current state ────────────────────────────────────────────────

  function render() {
    const { breeds, selected, imageUrl, imageLoading, loading, error } = state;

    // Loading message, or an error with a Retry button, or nothing
    if (loading) {
      status.textContent = 'Loading breeds...';
    } else {
      status.textContent = error;
    }
    status.hidden = status.textContent === '';
    retryButton.hidden = loading || error === '';

    select.disabled = breeds.length === 0;

    if (selected === null) {
      placeholder.textContent = 'Select a breed to see information';
      placeholder.hidden = false;
      breedBox.hidden = true;
      return;
    }

    breedBox.hidden = false;
    breedName.textContent = selected.name;
    originValue.textContent = orUnknown(selected.origin);
    lifeSpanValue.textContent = formatLifeSpan(selected.lifeSpan);
    weightValue.textContent = formatWeight(selected.weight);
    temperamentValue.textContent = orUnknown(selected.temperament);
    descriptionValue.textContent = orUnknown(selected.description);

    if (imageUrl) {
      if (image.getAttribute('src') !== imageUrl) image.setAttribute('src', imageUrl);
      image.alt = `Photo of a ${selected.name} cat`;
      image.hidden = false;
      placeholder.hidden = true;
    } else {
      image.removeAttribute('src');
      image.hidden = true;
      placeholder.textContent = imageLoading ? 'Loading image...' : 'No image available';
      placeholder.hidden = false;
    }
  }

  function fillSelect() {
    select.replaceChildren(
      ...state.breeds.map((breed) => {
        const option = el('option', undefined, breed.name);
        option.value = breed.id;
        return option;
      }),
    );
    if (state.selected) select.value = state.selected.id;
  }

  // ── Loading data ──────────────────────────────────────────────────────────

  async function loadImage(imageId) {
    if (imageController) imageController.abort();
    const id = ++imageRequest;
    state = { ...state, imageUrl: null, imageLoading: Boolean(imageId) };
    render();
    if (!imageId) return;

    imageController = new AbortController();
    let url = null;
    try {
      url = await getImageUrl(imageId, { fetch: doFetch, signal: imageController.signal });
    } catch {
      url = null; // a missing photo is not worth an error message
    }
    if (id !== imageRequest) return; // the user has already picked another breed
    state = { ...state, imageUrl: url, imageLoading: false };
    render();
  }

  function selectBreed(breed) {
    if (state.selected && state.selected.id === breed.id) return;
    state = { ...state, selected: breed };
    render();
    return loadImage(breed.referenceImageId);
  }

  async function load() {
    if (listController) listController.abort();
    listController = new AbortController();
    state = { ...state, loading: true, error: '' };
    render();
    try {
      const breeds = await loadBreeds({ fetch: doFetch, url: options.dataUrl, signal: listController.signal });
      state = { ...state, breeds, loading: false, error: '' };
      fillSelect();
      render();
      // The first breed is shown straight away, like the Android dropdown does
      if (!state.selected) await selectBreed(breeds[0]);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      state = { ...state, loading: false, error: messageFor(error) };
      render();
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────

  const onChange = () => {
    const breed = state.breeds.find((b) => b.id === select.value);
    if (breed) selectBreed(breed);
  };
  const onRetry = () => load();

  select.addEventListener('change', onChange);
  retryButton.addEventListener('click', onRetry);

  render();
  const started = load();

  return {
    getState: () => state,
    ready: started,
    destroy() {
      imageRequest++;
      if (imageController) imageController.abort();
      if (listController) listController.abort();
      select.removeEventListener('change', onChange);
      retryButton.removeEventListener('click', onRetry);
      root.replaceChildren();
    },
  };
}

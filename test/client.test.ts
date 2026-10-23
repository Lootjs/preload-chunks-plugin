// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefetchFromManifest, type PreloadManifest } from '../src/client';

const manifest: PreloadManifest = {
  version: 1,
  base: '/',
  resources: [
    { href: 'assets/index-a1.js', as: 'script' },
    { href: 'assets/index-b2.css', as: 'style' },
    { href: 'assets/logo-c3.png', as: 'image' },
  ],
};

function mockFetch(body: PreloadManifest, ok = true) {
  const fetchMock = vi.fn(async (url: string) => ({ ok, status: ok ? 200 : 404, url, json: async () => body }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const links = () => Array.from(document.head.querySelectorAll<HTMLLinkElement>('link'));

afterEach(() => {
  document.head.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('prefetchFromManifest', () => {
  it('adds prefetch links resolved against the manifest origin', async () => {
    mockFetch(manifest);
    const added = await prefetchFromManifest('https://app.example.com/exposed-resources.json', { waitForIdle: false });

    expect(added).toEqual([
      'https://app.example.com/assets/index-a1.js',
      'https://app.example.com/assets/index-b2.css',
      'https://app.example.com/assets/logo-c3.png',
    ]);
    expect(links().map(link => [link.rel, link.getAttribute('as'), link.getAttribute('crossorigin')])).toEqual([
      ['prefetch', 'script', 'anonymous'],
      ['prefetch', 'style', 'anonymous'],
      ['prefetch', 'image', null],
    ]);
  });

  it('resolves relative base against the manifest URL', async () => {
    mockFetch({ ...manifest, base: './', resources: [manifest.resources[0]] });
    const added = await prefetchFromManifest('https://app.example.com/spa/exposed-resources.json', { waitForIdle: false });
    expect(added).toEqual(['https://app.example.com/spa/assets/index-a1.js']);
  });

  it('supports absolute base and custom rel', async () => {
    mockFetch({ ...manifest, base: 'https://cdn.example.com/v2/', resources: [manifest.resources[0]] });
    await prefetchFromManifest('https://app.example.com/exposed-resources.json', { waitForIdle: false, rel: 'preload' });
    expect(links()[0].href).toBe('https://cdn.example.com/v2/assets/index-a1.js');
    expect(links()[0].rel).toBe('preload');
  });

  it('skips links that already exist', async () => {
    mockFetch(manifest);
    await prefetchFromManifest('https://app.example.com/exposed-resources.json', { waitForIdle: false });
    const added = await prefetchFromManifest('https://app.example.com/exposed-resources.json', { waitForIdle: false });
    expect(added).toEqual([]);
    expect(links()).toHaveLength(3);
  });

  it('does nothing when Data Saver is enabled', async () => {
    const fetchMock = mockFetch(manifest);
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } });
    expect(await prefetchFromManifest('https://app.example.com/m.json', { waitForIdle: false })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when the manifest request fails', async () => {
    mockFetch(manifest, false);
    await expect(prefetchFromManifest('https://app.example.com/m.json', { waitForIdle: false })).rejects.toThrow('404');
  });
});

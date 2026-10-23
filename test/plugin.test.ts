import { fileURLToPath } from 'node:url';
import { build, type InlineConfig } from 'vite';
import { describe, expect, it } from 'vitest';
import preloadChunks, { type PreloadChunksOptions, type PreloadManifest } from '../src/index';

const root = fileURLToPath(new URL('./fixture', import.meta.url));

type Output = { output: { fileName: string; type: string; source?: string | Uint8Array }[] };

async function buildFixture(options?: PreloadChunksOptions, config: InlineConfig = {}) {
  const result = await build({
    root,
    logLevel: 'silent',
    configFile: false,
    plugins: [preloadChunks(options)],
    ...config,
    build: {
      write: false,
      rollupOptions: { input: { main: `${root}/index.html`, about: `${root}/about.html` } },
      ...config.build,
    },
  });
  const { output } = (Array.isArray(result) ? result[0] : result) as Output;
  const manifestFile = output.find(file => file.fileName === (options?.fileName ?? 'exposed-resources.json'));
  const manifest = manifestFile && (JSON.parse(String(manifestFile.source)) as PreloadManifest);
  return { output, manifest };
}

const hrefs = (manifest?: PreloadManifest) => manifest?.resources.map(resource => resource.href) ?? [];

describe('preloadChunks', () => {
  it('includes entry chunks, their static imports and CSS', async () => {
    const { output, manifest } = await buildFixture();
    const chunks = output.filter(file => file.type === 'chunk').map(file => file.fileName);
    const css = output.filter(file => file.fileName.endsWith('.css')).map(file => file.fileName);
    const lazy = chunks.find(name => name.includes('lazy'));

    expect(manifest?.version).toBe(1);
    expect(manifest?.base).toBe('/');
    expect(hrefs(manifest).sort()).toEqual([...chunks.filter(name => name !== lazy), ...css].sort());
    expect(lazy).toBeDefined();
    expect(hrefs(manifest)).toContain(chunks.find(name => name.includes('shared')));
  });

  it('sets the "as" attribute by file type', async () => {
    const { manifest } = await buildFixture();
    for (const resource of manifest!.resources) {
      expect(resource.as).toBe(resource.href.endsWith('.css') ? 'style' : 'script');
    }
  });

  it('adds files by string and RegExp matchers', async () => {
    const { manifest } = await buildFixture({ entries: false, matchers: [/lazy-/, '.css'] });
    expect(hrefs(manifest)).toHaveLength(2);
    expect(hrefs(manifest).some(href => href.includes('lazy-'))).toBe(true);
    expect(hrefs(manifest).some(href => href.endsWith('.css'))).toBe(true);
  });

  it('skips source maps', async () => {
    const { output, manifest } = await buildFixture({ matchers: ['.js'] }, { build: { sourcemap: true } });
    expect(output.some(file => file.fileName.endsWith('.map'))).toBe(true);
    expect(hrefs(manifest).some(href => href.endsWith('.map'))).toBe(false);
  });

  it('uses Vite base and custom options', async () => {
    const { manifest: fromVite } = await buildFixture(undefined, { base: 'https://cdn.example.com/app/' });
    expect(fromVite?.base).toBe('https://cdn.example.com/app/');

    const { manifest } = await buildFixture({ fileName: 'preload.json', base: '/spa/' });
    expect(manifest?.base).toBe('/spa/');
  });

  it('does not emit the manifest for SSR builds', async () => {
    const { manifest } = await buildFixture(undefined, {
      build: { ssr: `${root}/shared.js`, rollupOptions: {} },
    });
    expect(manifest).toBeUndefined();
  });
});

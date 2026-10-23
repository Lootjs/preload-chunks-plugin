import type { Plugin, ResolvedConfig } from 'vite';
import type { PreloadManifest, PreloadResource, ResourceType } from './types';

export type { PreloadManifest, PreloadResource, ResourceType } from './types';

// Derived from Plugin so the types match whichever bundler (Rollup or Rolldown) the installed Vite uses
type OutputBundle = Parameters<Extract<Plugin['generateBundle'], Function>>[1];

export type PreloadChunksOptions = {
  /** Manifest file name inside `build.outDir`. Default: `exposed-resources.json` */
  fileName?: string;
  /** Include entry chunks with their static imports and CSS. Default: `true` */
  entries?: boolean;
  /** Extra files to include: substring or RegExp tested against the output file name */
  matchers?: (string | RegExp)[];
  /** Override `base` written to the manifest. Default: resolved Vite `base` */
  base?: string;
};

const resourceTypes: [RegExp, ResourceType][] = [
  [/\.m?js$/, 'script'],
  [/\.css$/, 'style'],
  [/\.(woff2?|ttf|otf|eot)$/, 'font'],
  [/\.(png|jpe?g|gif|webp|avif|svg|ico)$/, 'image'],
];

export function getResourceType(fileName: string): ResourceType | undefined {
  return resourceTypes.find(([pattern]) => pattern.test(fileName))?.[1];
}

function matches(fileName: string, matcher: string | RegExp) {
  return typeof matcher === 'string' ? fileName.includes(matcher) : matcher.test(fileName);
}

/** Collects files the browser requests when the SPA starts: entry chunks, their static imports and CSS. */
export function collectResources(bundle: OutputBundle, options: PreloadChunksOptions = {}): PreloadResource[] {
  const { entries = true, matchers = [], fileName = 'exposed-resources.json' } = options;
  const files = new Set<string>();

  const visit = (chunkFileName: string) => {
    const chunk = bundle[chunkFileName];
    if (!chunk || chunk.type !== 'chunk' || files.has(chunkFileName)) return;
    files.add(chunkFileName);
    chunk.viteMetadata?.importedCss.forEach(css => files.add(css));
    chunk.imports.forEach(visit);
  };

  if (entries) {
    Object.values(bundle).forEach(file => {
      if (file.type === 'chunk' && file.isEntry) visit(file.fileName);
    });
  }

  Object.keys(bundle).forEach(name => {
    if (matchers.some(matcher => matches(name, matcher))) files.add(name);
  });

  return [...files]
    .filter(name => !name.endsWith('.map') && name !== fileName)
    .map(href => {
      const as = getResourceType(href);
      return as ? { href, as } : { href };
    });
}

export default function preloadChunks(options: PreloadChunksOptions = {}): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'vite-preload-chunks-plugin',
    apply: 'build',
    enforce: 'post',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    generateBundle(_, bundle) {
      if (config.build.ssr) return;

      const manifest: PreloadManifest = {
        version: 1,
        base: options.base ?? config.base,
        resources: collectResources(bundle, options),
      };

      this.emitFile({
        type: 'asset',
        fileName: options.fileName ?? 'exposed-resources.json',
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

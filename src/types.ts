export type ResourceType = 'script' | 'style' | 'font' | 'image';

export type PreloadResource = {
  /** Path relative to `base`, e.g. `assets/index-a1b2.js` */
  href: string;
  /** Value for the `as` attribute of `<link rel="prefetch">` */
  as?: ResourceType;
};

export type PreloadManifest = {
  version: 1;
  /** Vite `base` of the SPA; relative values are resolved against the manifest URL */
  base: string;
  resources: PreloadResource[];
};

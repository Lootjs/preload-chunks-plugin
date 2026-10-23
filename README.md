# Preload chunks plugin for Vite

Generates a manifest of the files your SPA needs on startup, so another site (e.g. a landing page)
can prefetch them. When the user navigates from the landing page to the SPA, its JS and CSS are
already in the browser cache.

### Installation

```
npm i vite-plugin-preload-chunks --save-dev
```

### Usage

#### 1. SPA: generate the manifest

```javascript
// vite.config.js
import preloadChunks from 'vite-plugin-preload-chunks';

export default {
  plugins: [
    preloadChunks(),
  ],
};
```

After `vite build`, `dist/exposed-resources.json` contains the entry chunks, their static imports
and CSS (lazy-loaded chunks are not included):

```json
{
  "version": 1,
  "base": "/",
  "resources": [
    { "href": "assets/index-i6P87MP6.js", "as": "script" },
    { "href": "assets/vendor-BJANJ811.js", "as": "script" },
    { "href": "assets/index-W1erjkBN.css", "as": "style" }
  ]
}
```

#### 2. Landing page: prefetch the resources

```javascript
import { prefetchFromManifest } from 'vite-plugin-preload-chunks/client';

prefetchFromManifest('https://app.example.com/exposed-resources.json');
```

The helper waits for the page `load` event and browser idle time, skips prefetching when Data Saver
is on or the network is 2G, then adds `<link rel="prefetch">` with the right `as` and `crossorigin`
attributes. It resolves to the list of URLs it added.

You can also fetch the manifest yourself and build the links: resolve `base` against the manifest
URL, then each `href` against `base`.

### Options

#### Plugin

| Option     | Default                  | Description                                                                 |
|------------|--------------------------|-----------------------------------------------------------------------------|
| `fileName` | `exposed-resources.json` | Manifest file name inside `build.outDir`                                    |
| `entries`  | `true`                   | Include entry chunks with their static imports and CSS                      |
| `matchers` | `[]`                     | Extra files to include: substrings or RegExps tested against the file name |
| `base`     | Vite `base`              | Base URL written to the manifest                                            |

```javascript
preloadChunks({
  matchers: [/fonts\/.*\.woff2$/, 'dashboard-'],
});
```

#### `prefetchFromManifest(url, options)`

| Option            | Default     | Description                                                     |
|-------------------|-------------|-----------------------------------------------------------------|
| `rel`             | `prefetch`  | `prefetch` for the next navigation, `preload` for the current page |
| `crossOrigin`     | `anonymous` | Must match how the SPA requests assets (Vite uses `crossorigin`) |
| `respectSaveData` | `true`      | Do nothing on Data Saver / 2G                                   |
| `waitForIdle`     | `true`      | Wait for `load` and `requestIdleCallback`                       |
| `fetchOptions`    | —           | Options passed to `fetch` for the manifest                      |

### Requirements for the cache to work

- **Same site.** Browsers partition the HTTP cache by top-level site. Prefetching works between
  `www.example.com` and `app.example.com`, but not between `landing.com` and `app.io`.
- **CORS.** The manifest and the assets are requested from another origin, so the SPA server or CDN
  must send `Access-Control-Allow-Origin` for the landing page origin.
- **Cache headers.** Serve the manifest with `Cache-Control: no-cache` and hashed assets with
  `Cache-Control: max-age=31536000, immutable`.
- **Deploys.** Keep the previous build's assets for a while: a user may have loaded the old manifest.

To also speed up the SPA HTML document itself, combine this with the
[Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API).

### Migrating from 1.x

- The manifest format changed from `{ "preloadables": [...] }` to `{ "version", "base", "resources" }`.
- Files are selected by the build graph instead of the `['index-', 'vendor-']` name matchers.
  Pass `matchers` to add files by name.
- The manifest is not generated for SSR builds.
- The package is ESM-only.

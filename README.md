# Preload chunks plugin for Vite

Vite Plugin generating key chunks map for preloading by external projects

### Installation

```
npm i vite-plugin-preload-chunks --save-dev
```

### Usage

In your Vite configuration, import the plugin:
```javascript
import preloadChunks from 'vite-plugin-preload-chunks';
```

Then invoke the plugin:
```javascript
plugins: [
  preloadChunks(),
]

```

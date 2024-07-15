import fs from 'fs';
import path from 'path';

type ChunkFile = {
  type: string;
  fileName: string;
}

type PreloadChunksConfig = {
  matchers: string[]
}

const defaultMatchers = ['index-', 'vendor-'];

export default function preloadChunks(config?: PreloadChunksConfig) {
  const matchers = config?.matchers || defaultMatchers;

  const shouldSaveChunk = (chunkName: string) => {
    return matchers.find(matcher => chunkName.indexOf(matcher) !== -1 && !chunkName.endsWith('.map'))
  }

  return {
    name: 'vite-preload-chunks-plugin',
    generateBundle(outputOptions: { dir: string }, bundle: Record<string, ChunkFile>) {
      const chunks: string[] = [];
      Object.keys(bundle).forEach(fileName => {
        const file = bundle[fileName];
        if (['chunk', 'asset'].includes(file.type)) {
          const chunkName = file.fileName;

          if (shouldSaveChunk(chunkName)) {
            chunks.push(file.fileName);
          }
        }
      });
      const outputPath = path.join(outputOptions.dir, 'exposed-resources.json');
      fs.writeFileSync(outputPath, JSON.stringify({ preloadables: chunks }, null, 2));
    },
  };
}

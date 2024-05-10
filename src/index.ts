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

  return {
    name: 'vite-preload-chunks-plugin',
    generateBundle(outputOptions: { dir: string }, bundle: Record<string, ChunkFile>) {
      const chunks: string[] = [];
      Object.keys(bundle).forEach(fileName => {
        const file = bundle[fileName];
        if (['chunk', 'asset'].includes(file.type)) {
          const chunkName = file.fileName;

          if (matchers.find(matcher => chunkName.indexOf(matcher) !== -1)) {
            chunks.push(file.fileName);
          }
        }
      });
      const outputPath = path.join(outputOptions.dir, 'exposed-resources.json');
      fs.writeFileSync(outputPath, JSON.stringify({ preloadables: chunks }, null, 2));
    },
  };
}

import fs from 'fs';
import path from 'path';

type ChunkFile = {
  type: string;
  fileName: string;
}

export default function preloadChunks() {
  return {
    name: 'vite-preload-chunks-plugin',
    generateBundle(outputOptions: { dir: string }, bundle: Record<string, ChunkFile>) {
      const chunks: string[] = [];
      Object.keys(bundle).forEach(fileName => {
        const file = bundle[fileName];
        if (['chunk', 'asset'].includes(file.type)) {
          const chunkName = file.fileName;
          // console.log(chunkName);
          if (chunkName.indexOf('index-') !== -1 || chunkName.indexOf('vendor-') !== -1) {
            chunks.push(file.fileName);
          }
        }
      });
      const outputPath = path.join(outputOptions.dir, 'exposed-resources.json');
      fs.writeFileSync(outputPath, JSON.stringify({ preloadables: chunks }, null, 2));
    },
  };
}

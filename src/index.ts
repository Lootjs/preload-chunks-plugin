import fs from 'fs';
import path from 'path';

export default function preloadChunks() {
  return {
    name: 'vite-preload-chunks-plugin',
    generateBundle(outputOptions, bundle) {
      const chunks = [];
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

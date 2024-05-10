import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { dts } from "rollup-plugin-dts";

export default [
    {
        input: 'src/index.ts',
        output: {
            file: 'dist/vite-preload-chunks.js',
            format: 'esm'
        },
        plugins: [
            typescript(),
            commonjs({
                include: /node_modules/
            }),
            terser()
        ],
    },
    {
        input: "./src/index.ts",
        output: { file: "dist/vite-preload-chunks.d.ts", format: "es" },
        plugins: [dts()],
    }
];

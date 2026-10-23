import typescript from '@rollup/plugin-typescript';
import { dts } from 'rollup-plugin-dts';

const inputs = ['index', 'client'];
const external = ['vite'];

export default [
    ...inputs.map(name => ({
        input: `src/${name}.ts`,
        external,
        output: { file: `dist/${name}.js`, format: 'esm' },
        plugins: [typescript()],
    })),
    ...inputs.map(name => ({
        input: `src/${name}.ts`,
        external,
        output: { file: `dist/${name}.d.ts`, format: 'es' },
        plugins: [dts()],
    })),
];

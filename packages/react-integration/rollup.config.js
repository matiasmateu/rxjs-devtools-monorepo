import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  // ES Modules build
  {
    input: 'src/index.ts',
    external: ['react', 'rxjs', 'rxjs/operators'],
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        exclude: ['src/examples.tsx'],
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    external: ['react', 'rxjs', 'rxjs/operators'],
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // Only generate declarations once
      }),
    ],
  },
];


import { config } from 'dotenv';
import * as esbuild from 'esbuild';

config();

const plugins = [];

await esbuild.build({
  entryPoints: ['src/worker.ts'],
  sourcemap: 'external',
  outdir: 'dist',
  minify: true,
  bundle: true,
  format: 'esm',
  plugins: plugins
});

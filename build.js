// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  target: ['es2020'],
  outfile: 'dist/worker.js',
  define: {
    'process.env.NODE_ENV': '"production"'
  }
}).catch(() => process.exit(1));

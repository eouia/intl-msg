import { writeFileSync, mkdirSync } from 'fs'

const emitEsmPackageJson = {
  name: 'emit-esm-package-json',
  writeBundle (options) {
    if (options.format === 'es') {
      const dir = options.file.replace(/\/[^/]+$/, '')
      mkdirSync(dir, { recursive: true })
      writeFileSync(`${dir}/package.json`, JSON.stringify({ type: 'module' }, null, 2))
    }
  }
}

export default [
  {
    input: 'src/main.js',
    output: {
      file: 'dist/cjs/main.cjs',
      format: 'cjs',
      exports: 'default',
    },
  },
  {
    input: 'src/main.js',
    output: {
      file: 'dist/esm/main.js',
      format: 'es',
    },
    plugins: [emitEsmPackageJson],
  },
  {
    input: 'src/compose.js',
    output: {
      file: 'dist/cjs/compose.cjs',
      format: 'cjs',
      exports: 'named',
    },
  },
  {
    input: 'src/compose.js',
    output: {
      file: 'dist/esm/compose.js',
      format: 'es',
    },
    plugins: [emitEsmPackageJson],
  },
  {
    input: 'src/loaders.js',
    output: {
      file: 'dist/cjs/loaders.cjs',
      format: 'cjs',
      exports: 'named',
    },
  },
  {
    input: 'src/loaders.js',
    output: {
      file: 'dist/esm/loaders.js',
      format: 'es',
    },
    plugins: [emitEsmPackageJson],
  },
  {
    input: 'src/main.js',
    output: {
      file: 'dist/browser/intl-msg.js',
      format: 'iife',
      name: 'IntlMsg',
    },
  },
]

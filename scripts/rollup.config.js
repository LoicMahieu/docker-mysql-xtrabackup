
import typescript from 'rollup-plugin-typescript';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: './src/cli.ts',
  output: {
    file: './lib/cli.js',
    format: 'cjs',
    name: 'xtrabackupRunner'
  },
  plugins: [
    typescript(),
    commonjs({
      namedExports: {
        'node_modules/date-fns/index.js': [/* exports you need */]
      }
    })
  ]
}

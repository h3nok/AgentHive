import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.tsx',
  output: {
    file: 'dist/tsc-ai-widget.js',
    format: 'umd',
    name: 'TscAiWidget',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM'
    }
  },
  external: ['react', 'react-dom'],
  plugins: [
    resolve(),
    typescript({
      tsconfig: 'tsconfig.json'
    })
  ]
};

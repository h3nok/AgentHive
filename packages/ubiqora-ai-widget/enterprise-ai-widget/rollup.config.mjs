import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: 'dist/enterprise-ai-widget.js',
      format: 'umd',
      name: 'EnterpriseAiWidget',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        '@mui/material': 'MaterialUI'
      }
    },
    {
      file: 'dist/enterprise-ai-widget.esm.js',
      format: 'esm'
    }
  ],
  external: ['react', 'react-dom', '@mui/material'],
  plugins: [
    resolve(),
    typescript({
      useTsconfigDeclarationDir: true
    })
  ]
};

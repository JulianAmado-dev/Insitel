import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      //Alias principales
      '@': path.resolve(__dirname, './src/'),
      '@assets': path.resolve(__dirname, './src/common/assets'),
      '@contexts': path.resolve(__dirname, './src/common/contexts'),
      '@hooks': path.resolve(__dirname, './src/common/hooks'),
      '@layouts': path.resolve(__dirname, './src/common/layouts'),
      '@pages': path.resolve(__dirname, './src/common/pages'),
      '@styles': path.resolve(__dirname, './src/common/styles'),
      '@employees': path.resolve(__dirname, './src/employees'),
      '@projects': path.resolve(__dirname, './src/projects'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@content': path.resolve(__dirname, './src/content'),
      '@forms': path.resolve(__dirname, './src/forms'),
      '@api': path.resolve(__dirname, './src/common/api'),
      '@schemas': path.resolve(__dirname, './src/common/utils')

    }
  }
})

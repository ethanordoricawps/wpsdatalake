import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base is '/' for local dev; the GitHub Pages workflow sets VITE_BASE to
// '/<repo>/' so built + runtime asset URLs resolve under the project subpath.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})

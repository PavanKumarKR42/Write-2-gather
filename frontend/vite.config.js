// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Add this base property
  base: '/', // Ensure it's explicitly set to '/' for root deployment
  server: {
    port: 5173, // Keep your local dev port consistent, or remove if you prefer Vite's default
    // hmr: { overlay: false } // Keep this if you use it for HMR issues
  }
});
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-rl.png', 'logo-login.png'],
      manifest: {
        name: 'RL Gráfica ERP',
        short_name: 'RL Gráfica',
        description: 'Sistema de Gestão RL Gráfica',
        theme_color: '#D81B60',
        background_color: '#0d1117',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo-rl.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo-rl.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-chart': ['recharts'],
          'vendor-utils': ['axios', 'date-fns', 'lucide-react', 'zod', 'react-hook-form', '@hookform/resolvers'],
        },
      },
    },
  },
})

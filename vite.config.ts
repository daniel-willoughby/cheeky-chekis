import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cheeky-chekis/' : '/',
  server: { host: true, port: 5174, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['cheki.svg', 'icons/*.png'],
      manifest: {
        name: 'Cheeky Chekis',
        short_name: 'Chekis',
        description: 'Collect, tag and share your maid cafe chekis',
        theme_color: '#9b6cff',
        background_color: '#efe4ff',
        display: 'standalone',
        icons: [
          { src: 'cheki.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/logo.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
          { src: 'icons/logo.png', sizes: '256x256', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
}))

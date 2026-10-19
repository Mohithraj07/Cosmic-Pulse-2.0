import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The Python backend (FastAPI) runs on :8000. Vite forwards API calls to it, so
// the browser (and your friends' browsers) only ever talk to ONE address.
const backend = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'
const proxy = {
  '/api': { target: backend, changeOrigin: true },
  '/detect': { target: backend, changeOrigin: true },
  '/health': { target: backend, changeOrigin: true },
  '^/app$': { target: backend, changeOrigin: true }, // original CV upload page
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on the network so friends on your Wi-Fi can open it
    port: 5173,
    allowedHosts: true, // allow tunnel hostnames (ngrok, cloudflared, ...)
    proxy,
  },
  preview: { host: true, port: 4173, allowedHosts: true, proxy },
})

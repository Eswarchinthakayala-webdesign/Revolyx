import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/f2p": {
        target: "https://www.freetogame.com",
        changeOrigin: true,
        rewrite: path => path.replace(/^\/f2p/, "")
      },
      "/api/colormind": {
        target: "http://colormind.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/colormind/, "/api/"),
      },
      "/gita": {
        target: "https://gita-api.vercel.app",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/gita/, ""),
      },
      "/openlib": {
        target: "https://openlibrary.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openlib/, ""),
        secure: false
      },
      '/api/tenders': {
        target: 'https://tenders.guru',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/tenders/, '/api/hu/tenders'),
      },
      "/fruityvice": {
        target: "https://www.fruityvice.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/fruityvice/, ""),
      },
      
    }
  }
})
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
      "/opentopo": {
        target: "https://api.opentopodata.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/opentopo/, ""),
      },
       '/api/covid': {
        target: 'https://data.covid19india.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/covid/, '')
      },
       "/openwhyd": {
        target: "https://openwhyd.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/openwhyd/, "")
      },
      "/ghchart": {
        target: "https://ghchart.rshah.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ghchart/, "")
      },
      "/dictum": {
        target: "https://www.quoterism.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/dictum/, "")
      },
      "/quote": {
        target: "https://api.forismatic.com/api/1.0",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/quote/, ""),
      },
      "/api/stoic": {
        target: "https://stoic.tekloon.net",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/stoic/, ""),
      },
      "/api/iss": {
        target: "http://api.open-notify.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/iss/, "/iss-now.json")
      },
      "/chan": {
        target: "https://a.4cdn.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chan/, "")
      },
      "/aviation": {
        target: "https://api.aviationapi.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aviation/, ""),
      },
      "/openaq": {
        target: "https://api.openaq.org/v3",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/openaq/, ""),
      },
     "/nager": {
        target: "https://date.nager.at",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nager/, "/api/v3"),
      },
       "/api/xrates": {
        target: "https://www.x-rates.com",
        changeOrigin: true,     // set Host header to target
        secure: false,          // allow self-signed certs (not usually needed)
        rewrite: (path) => path.replace(/^\/api\/xrates/, ""),
      },
       "/filterlists": {
        target: "https://api.filterlists.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/filterlists/, ""),
      },
      "/osf": {
        target: "https://api.osf.io",
        changeOrigin: true,
        secure: true,
        // remove the /osf prefix when forwarding
        rewrite: (path) => path.replace(/^\/osf/, ""),
        // optional: log level
        // configure: { logLevel: "debug" }
      },
    }
  }
})
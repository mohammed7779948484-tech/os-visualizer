import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { pythonBridge } from "./server/python-bridge.js"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pythonBridge(),
  ],

  resolve: {
    alias: {
      "@": import.meta.dirname + "/src",
    },
  },
})

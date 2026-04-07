import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  base: process.env.VITE_BASE_PATH || (process.env.VERCEL ? "/" : "/Secure-Files/"),
});

// force restart

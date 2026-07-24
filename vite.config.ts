import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 默认产出自包含的单文件 index.html（base 相对路径，可双击直接打开，无需服务器）
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // 把所有 JS/CSS 内联进单个 HTML，保证 file:// 双击可用
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
})

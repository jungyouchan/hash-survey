// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',        // index.html이 있는 폴더
  base: '/hash-survey/', // 배포/개발 시 경로 앞에 붙음
  publicDir: 'public', // WASM 파일 등 static 파일 위치
  server: {
    port: 5173,     // 개발 서버 포트
  }
});

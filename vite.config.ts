import { defineConfig } from "vite";

export default defineConfig({
  // 阻止 Vite 监听 Rust 编译产物目录，避免 Windows EBUSY 错误
  server: {
    watch: {
      ignored: ["**/src-tauri/target/**"],
    },
  },
});
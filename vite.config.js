import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    String(env.VITE_DEV_PROXY_TARGET || "").trim() || "http://127.0.0.1:5000";

  const proxyConfig = {
    // Pin the backend target to IPv4 by default. This avoids Windows loopback
    // edge cases where `localhost` proxy connections can reset unexpectedly.
    target: proxyTarget,
    changeOrigin: false,
    secure: false,
    timeout: 30000,
    proxyTimeout: 30000,
  };

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": proxyConfig,
        "/uploads": proxyConfig,
      },
    },
  };
});

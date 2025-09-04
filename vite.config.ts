import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    allowedHosts: ["joaodk-devbox.tail0c7363.ts.net"],
  },
  publicDir: 'public',
  assetsInclude: ['**/*.onnx','**/*.json'],
});

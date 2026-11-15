import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    // 기본은 node. 화면 테스트(*.test.tsx)는 파일 첫 줄의 `// @vitest-environment jsdom`으로 jsdom을 쓴다
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "data/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 내보내기: `next build`가 out/에 HTML·CSS·JS만 만든다. Cloudflare에 정적 파일로 올린다(docs/deploy.md)
  // cacheComponents(create-next-app 기본값)는 PPR을 켜서 정적 내보내기와 함께 쓸 수 없어 뺐다. 코드는 'use cache'를 쓰지 않는다
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

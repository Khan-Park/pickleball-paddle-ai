import type { Metadata } from "next";
import paddlesJson from "../../../data/paddles.json";
import { paddlesSchema, toPaddleDisplay } from "../../../data/schema";
import { Saved } from "@/components/saved/Saved";
import { SiteHeader } from "@/components/site/SiteHeader";

/** 기기마다 내용이 다른 개인 화면이라 검색에 올리지 않는다. sitemap에도 넣지 않는다(T-050) */
export const metadata: Metadata = { title: "저장한 추천", robots: { index: false, follow: true } };

const paddles = paddlesSchema.parse(paddlesJson).map(toPaddleDisplay);

export default function SavedPage() {
  return (
    <>
      <SiteHeader current="saved" />
      <main className="flex flex-1 flex-col">
        <Saved paddles={paddles} />
      </main>
    </>
  );
}

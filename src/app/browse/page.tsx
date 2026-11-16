import type { Metadata } from "next";
import paddlesJson from "../../../data/paddles.json";
import { paddlesSchema, toPaddleDisplay } from "../../../data/schema";
import { Browse } from "@/components/browse/Browse";

export const metadata: Metadata = { title: "둘러보기 | 피클볼 패들 추천" };

/** 결과 화면과 같이 빌드할 때 한 번 검증하고 화면용 필드만 보낸다(내부 메모 제외, D-030) */
const paddles = paddlesSchema.parse(paddlesJson).map(toPaddleDisplay);

export default function BrowsePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Browse paddles={paddles} />
    </main>
  );
}

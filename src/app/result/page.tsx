import type { Metadata } from "next";
import paddlesJson from "../../../data/paddles.json";
import { paddlesSchema, toPaddleDisplay } from "../../../data/schema";
import { Result } from "@/components/result/Result";

export const metadata: Metadata = { title: "추천 결과 | 피클볼 패들 추천" };

/**
 * 제품 데이터는 빌드할 때 한 번 검증한다. 형식이 틀리면 빌드가 실패한다.
 * 화면에 쓰는 필드만 골라 브라우저로 보낸다(toPaddleDisplay). 출처 URL, 확인일, 내부 메모는 보내지 않는다.
 */
const paddles = paddlesSchema.parse(paddlesJson).map(toPaddleDisplay);

export default function ResultPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Result paddles={paddles} />
    </main>
  );
}

import { ImageResponse } from "next/og";
import { OG_IMAGE } from "@/lib/shared/site";

/**
 * 공유 미리보기 그림(T-027). 빌드할 때 한 번 만들어 `out/og.png`가 된다(정적 내보내기, GET만).
 * opengraph-image 파일 규칙을 쓰면 확장자 없는 `opengraph-image` 파일이 되어, 확장자로 파일 종류를 정하는 정적 호스팅에서
 * 이미지로 안내되지 않을 수 있다. 그래서 이름에 .png가 붙는 경로로 만들고 layout.tsx에서 주소를 직접 적는다.
 * 글자 없는 그림이다: 한글을 그림에 넣으려면 한글 글꼴 파일이 필요한데 글꼴 라이선스 검토 전이다(phase2 결정 2).
 * 제목·설명은 미리보기의 글자 칸(og:title·og:description)으로 나온다.
 * 그림: 앱 아이콘(src/app/icon.svg) + 형태 4가지 선 그림(시작 화면 ShapeIcon과 같은 비율). 색은 globals.css의 남색·코트 청록 값.
 */
export const dynamic = "force-static";
const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };

const NAVY = "#1e2a44";
const ACCENT = "#0f6e56";
const ACCENT_SOFT = "#e1f5ee";
const ACCENT_BRIGHT = "#1d9e75";
const SURFACE = "#f6f7f9";

/** 형태별 면 크기(ShapeIcon의 FACE와 같은 비율) */
const FACES = [
  { width: 30, height: 38 },
  { width: 36, height: 34 },
  { width: 28, height: 42 },
  { width: 24, height: 46 },
] as const;

function Paddle({ face, highlight }: { face: { width: number; height: number }; highlight: boolean }) {
  const scale = 6;
  const w = face.width * scale;
  const h = face.height * scale;
  const handle = 14 * scale;
  const stroke = highlight ? ACCENT : NAVY;
  return (
    <svg width={w + 24} height={h + handle + 24} viewBox={`0 0 ${w + 24} ${h + handle + 24}`}>
      <rect x={12} y={12} width={w} height={h} rx={Math.min(w, h) * 0.3} fill={highlight ? ACCENT_SOFT : "#ffffff"} stroke={stroke} strokeWidth={12} />
      <rect x={12 + w / 2 - 21} y={12 + h} width={42} height={handle} rx={9} fill={stroke} />
    </svg>
  );
}

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: SURFACE, padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width={96} height={96} viewBox="0 0 64 64">
            <rect width={64} height={64} rx={14} fill={NAVY} />
            <rect x={18} y={8} width={28} height={34} rx={9} fill="none" stroke="#ffffff" strokeWidth={4} />
            <rect x={28.5} y={42} width={7} height={15} rx={2} fill="#ffffff" />
            <circle cx={45} cy={47} r={5} fill={ACCENT_BRIGHT} />
          </svg>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "space-between", paddingTop: 24 }}>
          {FACES.map((face, i) => (
            <Paddle key={i} face={face} highlight={i === 1} />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

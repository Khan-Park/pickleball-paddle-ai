import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OG_IMAGE, openGraphFor, SITE_NAME, SITE_URL, SITEMAP_PATHS } from "@/lib/shared/site";
import { metadata as homeMetadata } from "./page";
import { metadata as browseMetadata } from "./browse/page";
import { metadata as rootMetadata } from "./layout";
import { metadata as resultMetadata } from "./result/page";
import { metadata as sharedMetadata } from "./shared/page";
import robots from "./robots";
import sitemap from "./sitemap";

describe("사이트 정보(T-027)", () => {
  it("주소는 https이고, 제목 틀과 미리보기 그림이 있다", () => {
    expect(new URL(SITE_URL).protocol).toBe("https:");
    expect(rootMetadata.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(rootMetadata.title).toMatchObject({ template: `%s | ${SITE_NAME}` });
    expect(rootMetadata.openGraph?.images).toEqual([OG_IMAGE]);
    // 레이아웃에는 og:url이 없다. 하위 페이지가 시작 화면 주소를 물려받지 않게 한다(T-038)
    expect(rootMetadata.openGraph).not.toHaveProperty("url");
    expect(OG_IMAGE.url.endsWith(".png")).toBe(true);
  });

  it("sitemap에는 시작 화면과 둘러보기만, robots에는 sitemap 주소가 있다", () => {
    expect(sitemap().map((e) => e.url)).toEqual([SITE_URL, `${SITE_URL}/browse`]);
    expect(SITEMAP_PATHS).not.toContain("/result");
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("결과 화면과 공유받은 화면은 검색 색인에서 빼고 sitemap에도 넣지 않는다", () => {
    expect(resultMetadata.robots).toMatchObject({ index: false });
    expect(sharedMetadata.robots).toMatchObject({ index: false });
    expect(SITEMAP_PATHS).not.toContain("/shared");
  });
});

/**
 * 공유 주소에 이메일 아이디가 드러나지 않게 한다(D-030). 아이디 문자열을 저장소에 적지 않으려고
 * git 설정의 이메일에서 아이디를 읽어 비교한다. git 설정이 없는 환경(배포 빌드 등)에서는 건너뛴다.
 */
function emailId(): string | null {
  try {
    const email = execSync("git config user.email", { encoding: "utf8" }).trim();
    const id = email.split("@")[0] ?? "";
    return id.length >= 4 ? id.toLowerCase() : null;
  } catch {
    return null;
  }
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("페이지별 og:url(T-038)", () => {
  it("시작 화면은 /, 둘러보기는 /browse, 공유받은 화면은 og:url 없이 공통 미리보기 값을 쓴다", () => {
    expect(homeMetadata.openGraph).toMatchObject({ url: "/", images: [OG_IMAGE], siteName: SITE_NAME });
    expect(browseMetadata.openGraph).toMatchObject({ url: "/browse", images: [OG_IMAGE], siteName: SITE_NAME });
    expect(sharedMetadata.openGraph).toBeUndefined();
    expect(openGraphFor()).not.toHaveProperty("url");
  });
});

describe.skipIf(emailId() === null)("이메일 아이디 노출 점검(T-027)", () => {
  it("사이트 주소, src, docs에 이메일 아이디가 없다", () => {
    const id = emailId()!;
    expect(SITE_URL.toLowerCase()).not.toContain(id);
    const files = [...filesUnder(join(process.cwd(), "src")), ...filesUnder(join(process.cwd(), "docs"))];
    const hits = files.filter((f) => readFileSync(f, "utf8").toLowerCase().includes(id));
    expect(hits).toEqual([]);
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NotFound from "./not-found";

afterEach(cleanup);

describe("404 화면(T-051)", () => {
  it("패들 그림은 화면 낭독기에 숨기고, 처음 화면과 둘러보기로 가는 링크가 있다", () => {
    render(<NotFound />);
    const art = screen.getByTestId("not-found-art");
    expect(art.querySelector("svg[data-shape='standard']")).not.toBeNull();
    expect(art.querySelector("[data-testid='ball-icon']")).not.toBeNull();
    for (const svg of art.querySelectorAll("svg")) expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("페이지를 찾을 수 없습니다");
    expect(screen.getByRole("link", { name: "처음 화면으로" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "패들 둘러보기" }).getAttribute("href")).toBe("/browse");
  });
});

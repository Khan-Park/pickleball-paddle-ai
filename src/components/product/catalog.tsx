"use client";

import { createContext, useContext } from "react";
import type { PaddleDisplay } from "../../../data/schema";

/**
 * 상세 화면이 "비슷한 제품"을 고르고 열 때 쓰는 정보(T-024). 결과 화면·둘러보기가 채운다.
 * 카드마다 전체 목록을 넘기지 않도록 컨텍스트로 둔다. 없으면(카드만 그린 경우) 비슷한 제품을 보이지 않는다.
 */
export type ProductCatalog = {
  /** 비슷한 제품을 고를 전체 목록 */
  paddles: readonly PaddleDisplay[];
  /** 비슷한 제품에서 뺄 id(결과 화면에서는 이번 추천 3개) */
  exclude: readonly string[];
  /** 기준일(YYYY-MM-DD). 승인 확인 기준(180일)에 쓴다 */
  today: string;
  /** 제품 상세 시트를 연다. 이미 열려 있으면 내용을 그 제품으로 바꾼다 */
  openProduct: (id: string) => void;
};

export const ProductCatalogContext = createContext<ProductCatalog | null>(null);

export const useProductCatalog = () => useContext(ProductCatalogContext);

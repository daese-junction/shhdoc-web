import type { ReactNode } from "react";

export interface ListPageParams {
  page: number;
  pageSize: number;
}

export interface ListPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type FetchListPage<T> = (params: ListPageParams) => Promise<ListPage<T>>;

/** 목록의 열 하나. 셀 내용은 render 가, 너비·정렬은 className 이 정한다. */
export interface ListColumn<T> {
  key: string;
  /** 열 제목. 한 열이라도 있으면 목록 위에 제목 행을 그린다. */
  header?: string;
  /** 너비·정렬 등 셀에 그대로 붙는 클래스. 없으면 남는 폭을 나눠 갖는다. */
  className?: string;
  render: (item: T) => ReactNode;
}

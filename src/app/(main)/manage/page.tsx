"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/common";

/** 관리 첫 화면은 따로 없다 — 기본으로 회사 정보를 보여준다. */
export default function ManagePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/manage/company");
  }, [router]);

  return <Loading fullHeight />;
}

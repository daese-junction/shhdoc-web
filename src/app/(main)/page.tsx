import Link from "next/link";
import { Button } from "@/components/common";

export default function Home() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-text-primary">정션</h1>
      <p className="text-text-secondary">프로젝트 초기 세팅이 완료되었습니다.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/login" className="text-brand-500 hover:underline">
          로그인
        </Link>
        <Link href="/signup" className="text-brand-500 hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}

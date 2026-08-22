"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, PasswordInput } from "@/components/common";
import { AuthCard } from "@/components/feature/auth/AuthCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import { ROUTES } from "@/utils/routes";
import {
  loginSchema,
  getFieldErrors,
  type LoginInput,
  type FieldErrors,
} from "@/utils/validation";

const initialForm: LoginInput = { email: "", password: "" };

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const setUser = useUserStore((state) => state.setUser);
  const [form, setForm] = useState<LoginInput>(initialForm);
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});

  const update = (key: keyof LoginInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return;
    }

    setErrors({});

    // TODO: src/api/auth.ts 의 login() + src/api/user.ts 의 내 정보 조회로 교체할 것.
    // 지금은 화면 흐름을 확인할 수 있도록 임시 토큰과 유저를 넣는다.
    // 역할은 서버가 내려줄 값이라, 그때까지는 이메일에 "admin" 이 들어가면
    // 관리자로 본다 (헤더의 메일/관리 토글과 /manage 접근을 확인하기 위한 임시 규칙).
    login("temp-access-token");
    setUser({
      id: "temp-user",
      name: result.data.email.split("@")[0],
      email: result.data.email,
      role: result.data.email.toLowerCase().includes("admin")
        ? "admin"
        : "user",
    });
    router.replace(ROUTES.mail);
  };

  return (
    <AuthCard
      title="로그인"
      description="회사 이메일로 로그인하세요"
      footer={
        <>
          아직 계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-brand-500 hover:underline"
          >
            회원가입
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
        <Input
          label="이메일"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          error={errors.email}
        />

        <PasswordInput
          label="비밀번호"
          autoComplete="current-password"
          placeholder="비밀번호를 입력하세요"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          error={errors.password}
        />

        <Button type="submit" className="mt-2 h-11 w-full sm:h-10">
          로그인
        </Button>
      </form>
    </AuthCard>
  );
}

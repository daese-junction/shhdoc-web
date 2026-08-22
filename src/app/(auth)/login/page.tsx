"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, PasswordInput } from "@/components/common";
import { AuthCard } from "@/components/feature/auth/AuthCard";
import { useAuthStore } from "@/stores/useAuthStore";
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

    // TODO: src/api/auth.ts 의 login() 으로 교체할 것.
    // 지금은 화면 흐름을 확인할 수 있도록 임시 토큰을 넣는다.
    login("temp-access-token");
    router.replace("/");
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

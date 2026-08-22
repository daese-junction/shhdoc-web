"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

type Side = "login" | "signup";

const FACE = {
  login: {
    title: "로그인",
    description: "회사 계정으로 로그인하세요",
    prompt: "아직 계정이 없으신가요?",
    action: "회원가입",
    path: "/login",
  },
  signup: {
    title: "회원가입",
    description: "회사 도메인을 등록하면 같은 도메인을 쓰는 동료가 내부 수신자로 인식됩니다",
    prompt: "이미 계정이 있으신가요?",
    action: "로그인",
    path: "/signup",
  },
} as const;

interface AuthFlipCardProps {
  initialSide: Side;
}

export function AuthFlipCard({ initialSide }: AuthFlipCardProps) {
  const [side, setSide] = useState<Side>(initialSide);
  const [height, setHeight] = useState<number>();
  /** 회원가입 직후 로그인 면에 채워줄 이메일 */
  const [signedUpEmail, setSignedUpEmail] = useState("");

  const loginRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);

  const isSignup = side === "signup";

  // 두 면의 높이가 달라 컨테이너를 활성 면에 맞춰 늘린다.
  // 두 면 모두 관찰해야 폰트 로드·창 크기 변화까지 따라간다.
  const syncHeight = useCallback(() => {
    const active = (isSignup ? signupRef : loginRef).current;
    if (active) setHeight(active.offsetHeight);
  }, [isSignup]);

  useEffect(() => {
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    if (loginRef.current) observer.observe(loginRef.current);
    if (signupRef.current) observer.observe(signupRef.current);
    return () => observer.disconnect();
  }, [syncHeight]);

  const flip = () => {
    const next: Side = isSignup ? "login" : "signup";
    setSide(next);
    // 라우팅하면 카드가 다시 마운트되어 뒤집기가 끊기므로 주소만 바꾼다.
    window.history.replaceState(null, "", FACE[next].path);
  };

  const face = FACE[side];

  return (
    <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div
          style={{
            perspective: "1800px",
            height,
            transition: "height 0.55s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* 3D 속성은 유틸리티 순서에 영향받지 않도록 인라인으로 확정한다 */}
          <div
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              transform: isSignup ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 0.55s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* 앞면 — 로그인 */}
            <div
              ref={loginRef}
              aria-hidden={isSignup}
              style={{ backfaceVisibility: "hidden" }}
              className={isSignup ? "pointer-events-none" : ""}
            >
              <Card title={FACE.login.title} description={FACE.login.description}>
                {/* key 를 바꿔 가입 직후 이메일이 채워진 상태로 다시 만든다 */}
                <LoginForm key={signedUpEmail} defaultEmail={signedUpEmail} />
              </Card>
            </div>

            {/* 뒷면 — 회원가입 */}
            <div
              ref={signupRef}
              aria-hidden={!isSignup}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
              className={`absolute inset-x-0 top-0 ${
                isSignup ? "" : "pointer-events-none"
              }`}
            >
              <Card
                title={FACE.signup.title}
                description={FACE.signup.description}
              >
                <SignupForm
                  onSuccess={(email) => {
                    setSignedUpEmail(email);
                    flip();
                  }}
                />
              </Card>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-text-secondary">
          {face.prompt}{" "}
          <button
            type="button"
            onClick={flip}
            className="font-medium text-brand-500 hover:underline"
          >
            {face.action}
          </button>
        </p>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border-tertiary bg-surface-primary p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          {title}
        </h1>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      {children}
    </div>
  );
}

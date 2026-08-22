interface LoadingProps {
  /** 스피너 아래에 보여줄 문구. 없으면 스피너만 표시된다. */
  message?: string;
  /** 화면 전체를 채울지 여부 (가드·페이지 전환용) */
  fullHeight?: boolean;
  className?: string;
}

export function Loading({
  message,
  fullHeight = false,
  className = "",
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 py-16 ${
        fullHeight ? "min-h-dvh flex-1" : ""
      } ${className}`}
    >
      <div
        role="status"
        aria-label={message ?? "불러오는 중"}
        className="h-8 w-8 animate-spin rounded-full border-2 border-border-primary border-t-brand-500"
      />
      {message && (
        <p className="text-sm text-text-secondary">{message}</p>
      )}
    </div>
  );
}

import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="flex w-full flex-1 items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col gap-1.5 text-center sm:mb-8">
          <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-text-secondary">{description}</p>
          )}
        </div>

        <div className="rounded-xl border border-border-primary bg-surface-primary p-5 sm:p-6">
          {children}
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-text-secondary">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

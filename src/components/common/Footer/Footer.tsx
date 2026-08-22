export function Footer() {
  return (
    <footer className="flex h-12 items-center justify-center border-t border-border-tertiary bg-surface-primary px-4 text-xs text-text-secondary">
      © {new Date().getFullYear()} 정션
    </footer>
  );
}

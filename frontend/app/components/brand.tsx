import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-[#17140d] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
        <path
          d="M5 12h3l2-5 4 10 2-5h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Brand({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <BrandMark />
      {!compact && (
        <span className="text-sm font-semibold tracking-[-0.03em] text-[var(--text-primary,#f5f5f4)]">
          Sentrix
        </span>
      )}
    </Link>
  );
}

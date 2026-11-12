import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  variant?: "default" | "light";
}

export function BrandMark({ className, size = "md" }: Props) {
  const dim =
    size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm",
        dim,
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[65%] w-[65%]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* carro simplificado */}
        <path d="M3 15l2-5a3 3 0 0 1 2.9-2h8.2A3 3 0 0 1 19 10l2 5" />
        <path d="M3 15v3h3" />
        <path d="M21 15v3h-3" />
        <circle cx="7" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
        {/* gota */}
        <path d="M12 3c-1.5 2.2-3 4.1-3 5.5a3 3 0 0 0 6 0C15 7 13.5 5.2 12 3z" />
      </svg>
    </div>
  );
}

export function BrandLogo({
  className,
  size = "md",
  withTagline = false,
  variant = "default",
}: Props) {
  const text =
    size === "sm"
      ? "text-base"
      : size === "lg"
        ? "text-2xl"
        : "text-lg";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-semibold tracking-tight",
            text,
            variant === "light" ? "text-white" : "text-foreground",
          )}
        >
          LAV<span className="text-secondary">PRO</span>
        </span>
        {withTagline ? (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Sua operação sob controle
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface LuxuryLoadingProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LuxuryLoading({
  label = "Preparing your experience",
  fullScreen = false,
  className = "",
}: LuxuryLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex w-full items-center justify-center bg-background px-6 py-16 ${
        fullScreen ? "min-h-screen" : "min-h-[18rem]"
      } ${className}`}
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="w-full max-w-xs text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center border border-primary/30 bg-card">
          <span className="font-playfair text-xl font-semibold tracking-[0.2em] text-primary">
            M
          </span>
        </div>
        <div className="mb-4 h-px w-full overflow-hidden bg-border">
          <div className="luxury-loading-bar h-full w-1/3 bg-primary" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

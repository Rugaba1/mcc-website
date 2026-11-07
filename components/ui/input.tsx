import * as React from "react"
import { cn } from "cn"

function Input({
  className,
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<"input">) {
  const [numberDraft, setNumberDraft] = React.useState<string | null>(null)
  const isZeroNumber =
    type === "number" &&
    (typeof value === "number"
      ? value === 0
      : typeof value === "string" && value.trim() !== "" && Number(value) === 0)

  return (
    <input
      type={type}
      value={type === "number" ? numberDraft ?? value : value}
      onChange={(event) => {
        if (type === "number" && numberDraft !== null) {
          setNumberDraft(event.currentTarget.value)
        }
        onChange?.(event)
      }}
      onFocus={(event) => {
        if (isZeroNumber && value !== undefined) setNumberDraft("")
        onFocus?.(event)
      }}
      onBlur={(event) => {
        onBlur?.(event)
        if (numberDraft !== null) setNumberDraft(null)
      }}
      data-slot="Input"
      className={cn(
        "h-8 w-full min-w-0  border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }

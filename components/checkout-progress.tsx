import { Check } from "lucide-react";
import { Link } from "@/app/i18n/routing";

const STEPS = [
  { label: "My order", href: "/cart" },
  { label: "Finish ordering", href: "/checkout" },
  { label: "Confirmation", href: null },
] as const;

export function CheckoutProgress({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Order progress" className="mx-auto w-full max-w-6xl px-4">
      <ol className="grid grid-cols-3">
        {STEPS.map((step, index) => {
          const number = index + 1;
          const complete = number < currentStep;
          const current = number === currentStep;
          const content = (
            <>
              <span
                className={`flex size-8 items-center justify-center rounded-full border text-sm ${
                  complete || current
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {complete ? <Check aria-hidden="true" className="size-4" /> : number}
              </span>
              <span
                className={`text-xs sm:text-sm ${
                  current ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li
              key={step.label}
              aria-current={current ? "step" : undefined}
              className="relative flex flex-col items-center gap-2 text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-4 -z-10 h-px w-full ${
                    number <= currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              {complete && step.href ? (
                <Link href={step.href} className="flex flex-col items-center gap-2">
                  {content}
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-2">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

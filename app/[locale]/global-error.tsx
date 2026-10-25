"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
 

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
     
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-20 text-center">
          <p className="font-serif text-[10rem] font-bold leading-none text-foreground sm:text-[12rem]">
            500
          </p>
          <div className="mx-auto mt-2 h-px w-24 bg-primary" />

          <h1 className="mt-8 text-2xl font-bold text-foreground sm:text-3xl">
            Mountain Ceramic hit a snag
          </h1>
          <p className="mt-3 max-w-md text-base text-muted-foreground">
            We couldn&apos;t load this page right now. Please try again or return to Mountain Ceramic.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              onClick={reset}
              className="bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try again
            </Button>
            <a
              href="/"
              className="border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Mountain Ceramic home
            </a>
          </div>
        </main>
    
  );
}

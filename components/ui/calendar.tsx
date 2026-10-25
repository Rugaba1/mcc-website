"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("w-fit p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 flex items-center justify-between",
        button_previous:
          "inline-flex size-8 items-center justify-center border border-transparent text-foreground/70 hover:border-border hover:bg-muted",
        button_next:
          "inline-flex size-8 items-center justify-center border border-transparent text-foreground/70 hover:border-border hover:bg-muted",
        chevron: "size-4 fill-none",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-center text-[0.8rem] font-normal text-muted-foreground",
        weeks: "mt-2",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-md p-0 font-normal text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "[&>button]:font-semibold [&>button]:underline",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground/40 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };

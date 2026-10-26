"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
    ? date
    : undefined;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  disablePast = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disablePast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={selected ? format(selected, "PPP") : placeholder}
          className={cn(
            "w-full justify-start gap-2 text-left font-normal",
            !selected && "text-muted-foreground",
          )}
        >
          <CalendarDays className="size-4" />
          {selected ? format(selected, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          disabled={
            disablePast
              ? { before: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) }
              : undefined
          }
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder,
  allowPast = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowPast?: boolean;
}) {
  const dateValue = value.slice(0, 10);
  const timeValue = value.slice(11, 16) || "00:00";
  const [hour, minute] = timeValue.split(":");
  const today = format(new Date(), "yyyy-MM-dd");
  const minimumTime = new Date();
  minimumTime.setSeconds(0, 0);
  minimumTime.setMinutes(minimumTime.getMinutes() + 1);
  const isToday = dateValue === today;

  function updateTime(nextHour: string, nextMinute: string) {
    if (!dateValue) return;
    const candidate = new Date(`${dateValue}T${nextHour}:${nextMinute}`);
    if (!allowPast && candidate <= minimumTime) return;
    onChange(`${dateValue}T${nextHour}:${nextMinute}`);
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
      <DatePicker
        id={id}
        value={dateValue}
        placeholder={placeholder}
        disablePast={!allowPast}
        onChange={(date) => {
          if (!date) {
            onChange("");
            return;
          }

          const candidate = new Date(`${date}T${timeValue}`);
          const nextTime =
            !allowPast && date === today && candidate <= minimumTime
              ? format(minimumTime, "HH:mm")
              : timeValue;
          onChange(`${date}T${nextTime}`);
        }}
      />
      <div
        role="group"
        aria-label="Choose time"
        className="flex h-8 items-center gap-1 border border-input px-2"
      >
        <Clock3 className="size-4 shrink-0 text-muted-foreground" />
        <Select
          value={hour}
          disabled={!dateValue}
          onValueChange={(nextHour) => updateTime(nextHour, minute)}
        >
          <SelectTrigger aria-label="Hour" className="h-7 min-w-0 border-0 px-1 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {Array.from({ length: 24 }, (_, value) => {
              const option = String(value).padStart(2, "0");
              return (
                <SelectItem
                  key={option}
                  value={option}
                  disabled={!allowPast && isToday && Number(option) < minimumTime.getHours()}
                >
                  {option}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <span aria-hidden="true">:</span>
        <Select
          value={minute}
          disabled={!dateValue}
          onValueChange={(nextMinute) => updateTime(hour, nextMinute)}
        >
          <SelectTrigger aria-label="Minute" className="h-7 min-w-0 border-0 px-1 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {Array.from({ length: 60 }, (_, value) => {
              const option = String(value).padStart(2, "0");
              return (
                <SelectItem
                  key={option}
                  value={option}
                  disabled={
                    !allowPast &&
                    isToday &&
                    Number(hour) === minimumTime.getHours() &&
                    Number(option) < minimumTime.getMinutes()
                  }
                >
                  {option}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

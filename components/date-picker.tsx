"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DatePicker({ date, onChange }: { date?: Date; onChange: (date: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 justify-start rounded-xl border-input bg-background text-left font-bold", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-emerald-400" />
          {date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar mode="single" selected={date} onSelect={onChange} locale={vi} />
      </PopoverContent>
    </Popover>
  );
}

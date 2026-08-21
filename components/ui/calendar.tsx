"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col gap-4",
        month: "space-y-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-black",
        nav: "space-x-1 flex items-center",
        button_previous: cn(buttonVariants({ variant: "outline" }), "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "outline" }), "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-black text-[0.78rem] text-center",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-bold aria-selected:opacity-100"),
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

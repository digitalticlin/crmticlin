
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
  className?: string
}

export function DatePicker({
  mode = "single",
  selected,
  onSelect,
  initialFocus,
  className
}: DatePickerProps) {
  return (
    <Calendar
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      initialFocus={initialFocus}
      className={cn("p-3 pointer-events-auto", className)}
    />
  )
}

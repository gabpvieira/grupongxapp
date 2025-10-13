import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minDate?: Date
}

// Função para converter data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
function formatDateToBR(isoDate: string): string {
  if (!isoDate) return ""
  const date = new Date(isoDate + "T00:00:00")
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

// Função para converter data brasileira (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
function formatDateToISO(brDate: string): string {
  if (!brDate) return ""
  const [day, month, year] = brDate.split("/")
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

// Função para converter string ISO para objeto Date
function parseISODate(isoDate: string): Date | undefined {
  if (!isoDate) return undefined
  return new Date(isoDate + "T00:00:00")
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = parseISODate(value || "")

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      const isoString = format(date, "yyyy-MM-dd")
      onChange(isoString)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            formatDateToBR(value || "")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            return false
          }}
          initialFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
}
import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ReminderSelectProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

export const REMINDER_OPTIONS = [
  { value: 'on_time', label: 'Na hora exata' },
  { value: '5_min_before', label: '5 minutos antes' },
  { value: '15_min_before', label: '15 minutos antes' },
  { value: '30_min_before', label: '30 minutos antes' },
  { value: '1_hour_before', label: '1 hora antes' },
]

export const ReminderSelect: React.FC<ReminderSelectProps> = ({
  value,
  onChange,
  placeholder = "Selecionar lembrete"
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {REMINDER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const getReminderLabel = (value: string): string => {
  const option = REMINDER_OPTIONS.find(opt => opt.value === value)
  return option?.label || value
}
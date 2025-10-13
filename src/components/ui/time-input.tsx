import React, { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimeInput({ value, onChange, placeholder = 'HH:mm', className }: TimeInputProps) {
  const [inputValue, setInputValue] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const formatTime = (input: string): string => {
    // Remove tudo que não for número
    const numbers = input.replace(/\D/g, '')
    
    if (numbers.length === 0) return ''
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 4) {
      const hours = numbers.slice(0, 2)
      const minutes = numbers.slice(2)
      return `${hours}:${minutes}`
    }
    
    // Limita a 4 dígitos
    const hours = numbers.slice(0, 2)
    const minutes = numbers.slice(2, 4)
    return `${hours}:${minutes}`
  }

  const validateTime = (time: string): boolean => {
    if (!time) return true
    
    // Aceita formatos HH:mm ou H:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!timeRegex.test(time)) return false
    
    const [hours, minutes] = time.split(':').map(Number)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTime(e.target.value)
    setInputValue(formatted)
    
    // Só chama onChange se for um horário válido ou vazio
    if (validateTime(formatted) || formatted === '') {
      onChange(formatted)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite apenas números, backspace, delete, tab, enter, e setas
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight']
    const isNumber = /^[0-9]$/.test(e.key)
    
    if (!isNumber && !allowedKeys.includes(e.key)) {
      e.preventDefault()
    }
  }

  const handleClear = () => {
    setInputValue('')
    onChange('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const hasValue = inputValue && inputValue.length > 0

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10",
            hasValue && "pr-10"
          )}
          maxLength={5}
        />
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-destructive/10"
            onClick={handleClear}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>

    </div>
  )
}
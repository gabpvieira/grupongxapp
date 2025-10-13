import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bell, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const PRESET_OPTIONS = [
  { label: 'Sem lembrete', value: '' },
  { label: '15 minutos antes', value: '15min' },
  { label: '30 minutos antes', value: '30min' },
  { label: '1 hora antes', value: '1hour' },
  { label: '2 horas antes', value: '2hours' },
  { label: '1 dia antes', value: '1day' },
  { label: 'Horário personalizado', value: 'custom' }
]

const generateTimeOptions = () => {
  const times = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      times.push(timeString)
    }
  }
  return times
}

const formatTimeDisplay = (value: string) => {
  if (!value) return 'Adicionar lembrete'
  
  switch (value) {
    case '15min':
      return '15 min antes'
    case '30min':
      return '30 min antes'
    case '1hour':
      return '1 hora antes'
    case '2hours':
      return '2 horas antes'
    case '1day':
      return '1 dia antes'
    default:
      // Se for um horário customizado (formato HH:MM)
      if (value.includes(':')) {
        return `Às ${value}`
      }
      return value
  }
}

export function TimePicker({ value, onChange, placeholder = 'Adicionar lembrete', className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [customTime, setCustomTime] = useState('')
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const timeListRef = useRef<HTMLDivElement>(null)

  const timeOptions = generateTimeOptions()

  useEffect(() => {
    if (value) {
      const preset = PRESET_OPTIONS.find(option => option.value === value)
      if (preset) {
        setSelectedPreset(value)
        setShowCustomPicker(false)
      } else if (value.includes(':')) {
        setSelectedPreset('custom')
        setCustomTime(value)
        setShowCustomPicker(true)
      }
    } else {
      setSelectedPreset('')
      setShowCustomPicker(false)
    }
  }, [value])

  const handlePresetSelect = (presetValue: string) => {
    if (presetValue === 'custom') {
      setSelectedPreset(presetValue)
      setShowCustomPicker(true)
      return
    }
    
    setSelectedPreset(presetValue)
    setShowCustomPicker(false)
    onChange(presetValue)
    
    if (presetValue === '') {
      setIsOpen(false)
    }
  }

  const handleCustomTimeSelect = (time: string) => {
    setCustomTime(time)
    onChange(time)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSelectedPreset('')
    setCustomTime('')
    setShowCustomPicker(false)
    setIsOpen(false)
  }

  const scrollToTime = (time: string) => {
    if (timeListRef.current) {
      const timeElement = timeListRef.current.querySelector(`[data-time="${time}"]`)
      if (timeElement) {
        timeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  useEffect(() => {
    if (showCustomPicker && customTime && isOpen) {
      setTimeout(() => scrollToTime(customTime), 100)
    }
  }, [showCustomPicker, customTime, isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-background hover:bg-accent hover:text-accent-foreground",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Bell className="mr-2 h-4 w-4" />
          <span className="flex-1">{formatTimeDisplay(value || '')}</span>
          {value && (
            <X 
              className="ml-2 h-4 w-4 hover:text-destructive" 
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Lembrete
          </h4>
        </div>
        
        <div className="p-2">
          {/* Opções predefinidas */}
          <div className="space-y-1">
            {PRESET_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-8 px-3",
                  selectedPreset === option.value && "bg-accent text-accent-foreground"
                )}
                onClick={() => handlePresetSelect(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Seletor de horário customizado */}
          {showCustomPicker && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Selecionar horário</span>
              </div>
              <div 
                ref={timeListRef}
                className="max-h-48 overflow-y-auto border rounded-md bg-background"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgb(203 213 225) transparent'
                }}
              >
                <div className="py-1">
                  {timeOptions.map((time) => (
                    <div
                      key={time}
                      data-time={time}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                        customTime === time && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleCustomTimeSelect(time)}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
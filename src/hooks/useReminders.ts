import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday, isBefore, addMinutes, subMinutes } from 'date-fns'

interface Tarefa {
  id: string
  titulo: string
  data_vencimento: string
  hora_lembrete: string | null
  reminder: string | null
  lembrete_enviado: boolean
}

interface ReminderPayload {
  taskId: string
  taskTitle: string
  dueDate: string
  reminderTime: string
  reminderType: 'on_time' | '5_min_before' | '15_min_before' | '30_min_before' | '1_hour_before'
  message: string
}

// URL do webhook - pode ser configurada via variável de ambiente
const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://webhook.site/your-webhook-url'

export const useReminders = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const sendWebhook = async (payload: ReminderPayload) => {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          source: 'NGX Growth App'
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`)
      }

      console.log('✅ Webhook enviado com sucesso:', payload.taskTitle)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar webhook:', error)
      return false
    }
  }

  const markReminderAsSent = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tarefas')
        .update({ lembrete_enviado: true })
        .eq('id', taskId)

      if (error) {
        console.error('Erro ao marcar lembrete como enviado:', error)
      }
    } catch (error) {
      console.error('Erro ao atualizar status do lembrete:', error)
    }
  }

  const shouldSendReminder = (reminderTime: Date, currentTime: Date, reminderType: string): boolean => {
    const diffInMinutes = Math.floor((reminderTime.getTime() - currentTime.getTime()) / (1000 * 60))

    switch (reminderType) {
      case 'on_time':
        // Verifica se é exatamente na hora (tolerância de 1 minuto)
        return Math.abs(diffInMinutes) <= 1
      
      case '5_min_before':
        // Verifica se é 5 minutos antes (tolerância de 1 minuto)
        return diffInMinutes >= 4 && diffInMinutes <= 6
      
      case '15_min_before':
        // Verifica se é 15 minutos antes (tolerância de 1 minuto)
        return diffInMinutes >= 14 && diffInMinutes <= 16
      
      case '30_min_before':
        // Verifica se é 30 minutos antes (tolerância de 1 minuto)
        return diffInMinutes >= 29 && diffInMinutes <= 31
      
      case '1_hour_before':
        // Verifica se é 1 hora antes (tolerância de 2 minutos)
        return diffInMinutes >= 58 && diffInMinutes <= 62
      
      default:
        return false
    }
  }

  const getReminderMessage = (type: string, taskTitle: string, dueDate: string, reminderTime: string): string => {
    const messages = {
      'on_time': `🔔 Lembrete: "${taskTitle}" - Horário do lembrete chegou! (${reminderTime})`,
      '5_min_before': `⏰ Lembrete: "${taskTitle}" - 5 minutos para o horário definido (${reminderTime})`,
      '15_min_before': `⏰ Lembrete: "${taskTitle}" - 15 minutos para o horário definido (${reminderTime})`,
      '30_min_before': `⏰ Lembrete: "${taskTitle}" - 30 minutos para o horário definido (${reminderTime})`,
      '1_hour_before': `⏰ Lembrete: "${taskTitle}" - 1 hora para o horário definido (${reminderTime})`
    }
    
    return messages[type as keyof typeof messages] || `🔔 Lembrete: "${taskTitle}"`
  }

  const checkReminders = async () => {
    try {
      const currentTime = new Date()
      const today = format(currentTime, 'yyyy-MM-dd')

      // Busca tarefas com lembretes para hoje que ainda não foram enviados
      const { data: tarefas, error } = await supabase
        .from('tarefas')
        .select('id, titulo, data_vencimento, hora_lembrete, reminder, lembrete_enviado')
        .eq('data_vencimento', today)
        .eq('lembrete_enviado', false)
        .not('hora_lembrete', 'is', null)
        .not('reminder', 'is', null)
        .neq('reminder', '')

      if (error) {
        console.error('Erro ao buscar tarefas para lembretes:', error)
        return
      }

      if (!tarefas || tarefas.length === 0) {
        return
      }

      for (const tarefa of tarefas) {
        if (!tarefa.hora_lembrete || !tarefa.reminder) continue

        // Cria o datetime completo do lembrete
        const reminderDateTime = new Date(`${tarefa.data_vencimento}T${tarefa.hora_lembrete}`)
        
        // Verifica se é hora de enviar o lembrete baseado no tipo configurado
        const shouldSend = shouldSendReminder(reminderDateTime, currentTime, tarefa.reminder)
        
        if (shouldSend) {
          const payload: ReminderPayload = {
            taskId: tarefa.id,
            taskTitle: tarefa.titulo,
            dueDate: tarefa.data_vencimento,
            reminderTime: tarefa.hora_lembrete,
            reminderType: tarefa.reminder as any,
            message: getReminderMessage(tarefa.reminder, tarefa.titulo, tarefa.data_vencimento, tarefa.hora_lembrete)
          }

          const webhookSent = await sendWebhook(payload)
          
          if (webhookSent) {
            // Marca como enviado após enviar o webhook
            await markReminderAsSent(tarefa.id)
          }
        }
      }
    } catch (error) {
      console.error('Erro na verificação de lembretes:', error)
    }
  }

  const startReminderService = () => {
    // Verifica lembretes a cada minuto
    intervalRef.current = setInterval(checkReminders, 60000)
    
    // Executa uma verificação imediata
    checkReminders()
    
    console.log('🔔 Serviço de lembretes iniciado')
  }

  const stopReminderService = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      console.log('🔕 Serviço de lembretes parado')
    }
  }

  useEffect(() => {
    startReminderService()

    return () => {
      stopReminderService()
    }
  }, [])

  return {
    startReminderService,
    stopReminderService,
    checkReminders
  }
}
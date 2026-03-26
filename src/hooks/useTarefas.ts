import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { Tarefa } from '@/types/tarefas'
import { subDays } from 'date-fns'

type TarefaBase = Database['public']['Tables']['tarefas']['Row']
type TarefaInsert = Database['public']['Tables']['tarefas']['Insert']
type TarefaUpdate = Database['public']['Tables']['tarefas']['Update']
type TarefaCompleta = Database['public']['Views']['tarefas_completas']['Row']
type ChecklistItem = Database['public']['Tables']['tarefa_checklist']['Row']
type ChecklistInsert = Database['public']['Tables']['tarefa_checklist']['Insert']
type ChecklistUpdate = Database['public']['Tables']['tarefa_checklist']['Update']

export function useTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [tarefasCompletas, setTarefasCompletas] = useState<TarefaCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTarefas = useCallback(async () => {
    try {
      setLoading(true)
      const JANELA_DIAS = 30
      const limite = subDays(new Date(), JANELA_DIAS)
      
      const { data, error } = await supabase
        .from('tarefas_completas')
        .select(`
          *,
          checklist:tarefa_checklist(
            id,
            texto,
            concluido,
            ordem
          )
        `)
        .or(`status.neq.concluido,and(status.eq.concluido,updated_at.gte.${limite.toISOString()})`)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const tarefasMapped = (data || []).map(tarefa => ({
        ...tarefa,
        checklist: (tarefa.checklist || []).map((item: any) => ({
          ...item,
          done: item.concluido,
          text: item.texto
        }))
      })) as unknown as Tarefa[]
      
      setTarefas(tarefasMapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }, [])

  const refetchTarefa = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tarefas_completas')
        .select(`
          *,
          checklist:tarefa_checklist(
            id,
            texto,
            concluido,
            ordem
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      const tarefaMapped = {
        ...data,
        checklist: (data.checklist || []).map((item: any) => ({
          ...item,
          done: item.concluido,
          text: item.texto
        }))
      } as unknown as Tarefa
      
      setTarefas(prev => prev.map(t => t.id === id ? tarefaMapped : t))
    } catch (err) {
      console.error('Erro ao fazer refetch da tarefa:', err)
    }
  }

  const fetchArquivadas = async () => {
    try {
      const JANELA_DIAS = 30
      const limite = subDays(new Date(), JANELA_DIAS)

      const { data, error } = await supabase
        .from('tarefas_completas')
        .select(`
          *,
          checklist:tarefa_checklist(
            id,
            texto,
            concluido,
            ordem
          )
        `)
        .eq('status', 'concluido')
        .lt('updated_at', limite.toISOString())
        .order('updated_at', { ascending: false })

      if (error) throw error
      
      return (data || []).map(tarefa => ({
        ...tarefa,
        checklist: (tarefa.checklist || []).map((item: any) => ({
          ...item,
          done: item.concluido,
          text: item.texto
        }))
      })) as unknown as Tarefa[]
    } catch (err) {
      console.error('Erro ao buscar arquivadas:', err)
      return []
    }
  }

  const addTarefa = async (tarefa: TarefaInsert) => {
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .insert(tarefa)
        .select()
        .single()

      if (error) throw error
      await fetchTarefas()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar tarefa')
      throw err
    }
  }

  const updateTarefa = async (id: string, updates: TarefaUpdate) => {
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await refetchTarefa(id)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa')
      throw err
    }
  }

  const updateTarefaCompleta = async (tarefa: Tarefa) => {
    try {
      const { checklist, ...tarefaData } = tarefa
      
      const cleanTarefaData = { ...tarefaData };
      delete (cleanTarefaData as any).responsavel_nome;
      delete (cleanTarefaData as any).responsavel_email;
      delete (cleanTarefaData as any).total_checklist;
      delete (cleanTarefaData as any).checklist_concluidos;
      delete (cleanTarefaData as any).checklist;
      delete (cleanTarefaData as any).done;
      delete (cleanTarefaData as any).text;

      const { data: updatedTarefa, error: tarefaError } = await supabase
        .from('tarefas')
        .update(cleanTarefaData)
        .eq('id', tarefa.id)
        .select()
        .single()

      if (tarefaError) throw tarefaError

      await supabase
        .from('tarefa_checklist')
        .delete()
        .eq('tarefa_id', tarefa.id)

      if (checklist && checklist.length > 0) {
        const validChecklistItems = checklist
          .filter(item => (item.text || item.texto) && (item.text || item.texto).trim() !== '')
          .map((item, index) => ({
            tarefa_id: tarefa.id,
            texto: (item.text || item.texto).trim(),
            concluido: item.done || item.concluido || false,
            ordem: index
          }))

        if (validChecklistItems.length > 0) {
          const { error: checklistError } = await supabase
            .from('tarefa_checklist')
            .insert(validChecklistItems)

          if (checklistError) throw checklistError
        }
      }

      await refetchTarefa(tarefa.id)
      return updatedTarefa
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa completa')
      throw err
    }
  }

  const deleteTarefa = async (id: string) => {
    try {
      await supabase
        .from('tarefa_checklist')
        .delete()
        .eq('tarefa_id', id)

      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTarefas(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar tarefa')
      throw err
    }
  }

  const getChecklistItems = async (tarefaId: string) => {
    try {
      const { data, error } = await supabase
        .from('tarefa_checklist')
        .select('*')
        .eq('tarefa_id', tarefaId)
        .order('ordem')

      if (error) throw error
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checklist')
      return []
    }
  }

  const addChecklistItem = async (item: ChecklistInsert) => {
    try {
      const { data, error } = await supabase
        .from('tarefa_checklist')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item do checklist')
      throw err
    }
  }

  const updateChecklistItem = async (id: string, updates: ChecklistUpdate) => {
    try {
      const { data, error } = await supabase
        .from('tarefa_checklist')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item do checklist')
      throw err
    }
  }

  const deleteChecklistItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tarefa_checklist')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar item do checklist')
      throw err
    }
  }

  const getTarefasPorStatus = (status: 'a-fazer' | 'em-andamento' | 'concluido') => {
    return tarefas.filter(t => t.status === status)
  }

  const getTarefasPorPrioridade = (prioridade: 'baixa' | 'media' | 'alta') => {
    return tarefas.filter(t => t.prioridade === prioridade)
  }

  const getTarefasVencidas = () => {
    const hoje = new Date().toISOString().split('T')[0]
    return tarefas.filter(t => t.data_vencimento && t.data_vencimento < hoje && t.status !== 'concluido')
  }

  const getTarefasExecutando = () => {
    return tarefas.filter(t => t.esta_executando)
  }

  useEffect(() => {
    fetchTarefas()
  }, [fetchTarefas])

  return {
    tarefas,
    loading,
    error,
    addTarefa,
    updateTarefa,
    updateTarefaCompleta,
    deleteTarefa,
    getChecklistItems,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    getTarefasPorStatus,
    getTarefasPorPrioridade,
    getTarefasVencidas,
    getTarefasExecutando,
    refetch: fetchTarefas,
    refetchTarefa,
    fetchArquivadas
  }
}
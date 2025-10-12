import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type TarefaBase = Database['public']['Tables']['tarefas']['Row']
type TarefaInsert = Database['public']['Tables']['tarefas']['Insert']
type TarefaUpdate = Database['public']['Tables']['tarefas']['Update']
type TarefaCompleta = Database['public']['Views']['tarefas_completas']['Row']
type ChecklistItem = Database['public']['Tables']['tarefa_checklist']['Row']
type ChecklistInsert = Database['public']['Tables']['tarefa_checklist']['Insert']
type ChecklistUpdate = Database['public']['Tables']['tarefa_checklist']['Update']

// Tipo estendido para tarefa com checklist
export type Tarefa = TarefaBase & {
  checklist: Array<ChecklistItem & { done: boolean }>
}

export function useTarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [tarefasCompletas, setTarefasCompletas] = useState<TarefaCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTarefas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tarefas')
        .select(`
          *,
          checklist:tarefa_checklist(
            id,
            texto,
            concluido,
            ordem
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Mapear os dados para incluir o checklist com as propriedades 'done' e 'text'
      const tarefasWithChecklist = (data || []).map(tarefa => ({
        ...tarefa,
        checklist: (tarefa.checklist || []).map((item: any) => ({
          ...item,
          done: item.concluido,
          text: item.texto
        }))
      }))
      
      setTarefas(tarefasWithChecklist)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }

  const fetchTarefasCompletas = async () => {
    try {
      const { data, error } = await supabase
        .from('tarefas_completas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTarefasCompletas(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas completas')
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
      setTarefas(prev => [data, ...prev])
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
      setTarefas(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa')
      throw err
    }
  }

  const updateTarefaCompleta = async (tarefa: Tarefa) => {
    try {
      // Extrair checklist da tarefa
      const { checklist, ...tarefaData } = tarefa
      
      // Atualizar dados da tarefa (excluindo checklist)
      const { data: updatedTarefa, error: tarefaError } = await supabase
        .from('tarefas')
        .update(tarefaData)
        .eq('id', tarefa.id)
        .select()
        .single()

      if (tarefaError) throw tarefaError

      // Sempre deletar itens existentes do checklist primeiro
      await supabase
        .from('tarefa_checklist')
        .delete()
        .eq('tarefa_id', tarefa.id)

      // Inserir novos itens do checklist se existirem e não estiverem vazios
      if (checklist && checklist.length > 0) {
        // Filtrar itens válidos (com texto não vazio)
        const validChecklistItems = checklist
          .filter(item => (item.text || item.texto) && (item.text || item.texto).trim() !== '')
          .map((item, index) => ({
            tarefa_id: tarefa.id,
            texto: (item.text || item.texto).trim(),
            concluido: item.done || item.concluido || false,
            ordem: index
          }))

        // Só inserir se houver itens válidos
        if (validChecklistItems.length > 0) {
          const { error: checklistError } = await supabase
            .from('tarefa_checklist')
            .insert(validChecklistItems)

          if (checklistError) throw checklistError
        }
      }

      // Recarregar tarefas para obter dados atualizados com checklist
      await fetchTarefas()
      
      return updatedTarefa
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tarefa completa')
      throw err
    }
  }

  const deleteTarefa = async (id: string) => {
    try {
      // Primeiro deletar checklist items
      await supabase
        .from('tarefa_checklist')
        .delete()
        .eq('tarefa_id', id)

      // Depois deletar a tarefa
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

  const startTimer = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .update({
          esta_executando: true,
          inicio_execucao: new Date().toISOString(),
          status: 'em-andamento'
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTarefas(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar timer')
      throw err
    }
  }

  const stopTimer = async (id: string) => {
    try {
      const tarefa = tarefas.find(t => t.id === id)
      if (!tarefa || !tarefa.inicio_execucao) return

      const tempoDecorrido = Math.floor((Date.now() - new Date(tarefa.inicio_execucao).getTime()) / 1000)
      const novoTempoTotal = tarefa.tempo_rastreado + tempoDecorrido

      const { data, error } = await supabase
        .from('tarefas')
        .update({
          esta_executando: false,
          inicio_execucao: null,
          tempo_rastreado: novoTempoTotal
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setTarefas(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao parar timer')
      throw err
    }
  }

  // Funções para checklist
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

  // Funções utilitárias
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
    fetchTarefasCompletas()
  }, [])

  return {
    tarefas,
    tarefasCompletas,
    loading,
    error,
    addTarefa,
    updateTarefa,
    updateTarefaCompleta,
    deleteTarefa,
    startTimer,
    stopTimer,
    getChecklistItems,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    getTarefasPorStatus,
    getTarefasPorPrioridade,
    getTarefasVencidas,
    getTarefasExecutando,
    refetch: fetchTarefas
  }
}
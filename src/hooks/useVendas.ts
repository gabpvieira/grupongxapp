import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Venda = Database['public']['Tables']['vendas']['Row']
type VendaInsert = Database['public']['Tables']['vendas']['Insert']
type VendaUpdate = Database['public']['Tables']['vendas']['Update']
type VendaCompleta = Database['public']['Views']['vendas_completas']['Row']

export function useVendas() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [vendasCompletas, setVendasCompletas] = useState<VendaCompleta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('🔄 useVendas hook inicializado')

  const fetchVendas = async () => {
    try {
      console.log('🔍 Iniciando fetchVendas...')
      setLoading(true)
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('data_fechamento', { ascending: false })

      console.log('📊 Resposta do Supabase:', { data, error, count: data?.length })
      if (error) throw error
      setVendas(data || [])
      console.log('✅ Vendas carregadas:', data?.length || 0)
    } catch (err) {
      console.error('❌ Erro ao carregar vendas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const fetchVendasCompletas = async () => {
    try {
      const { data, error } = await supabase
        .from('vendas_completas')
        .select('*')
        .order('data_fechamento', { ascending: false })

      if (error) throw error
      setVendasCompletas(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar vendas completas')
    }
  }

  const addVenda = async (venda: VendaInsert) => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .insert(venda)
        .select()
        .single()

      if (error) throw error
      setVendas(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar venda')
      throw err
    }
  }

  const updateVenda = async (id: string, updates: VendaUpdate) => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setVendas(prev => prev.map(v => v.id === id ? data : v))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar venda')
      throw err
    }
  }

  const deleteVenda = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id)

      if (error) throw error
      setVendas(prev => prev.filter(v => v.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar venda')
      throw err
    }
  }

  const getTotalVendas = () => {
    const total = vendas.reduce((total, venda) => total + venda.valor, 0)
    console.log('💰 getTotalVendas chamado:', { vendasCount: vendas.length, total })
    return total
  }

  const getVendasPorMes = (mes: number, ano: number) => {
    return vendas.filter(venda => {
      const dataVenda = new Date(venda.data_fechamento)
      return dataVenda.getMonth() === mes && dataVenda.getFullYear() === ano
    })
  }

  const getVendasPorVendedor = (vendedorId: string) => {
    return vendas.filter(venda => venda.responsavel_id === vendedorId)
  }

  const getVendasRecorrentes = () => {
    return vendas.filter(venda => venda.recorrente)
  }

  const getResumoMensal = async (ano: number, mes: number) => {
    try {
      const { data, error } = await supabase
        .from('resumo_mensal_vendas')
        .select('*')
        .eq('mes', `${ano}-${mes.toString().padStart(2, '0')}`)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar resumo mensal')
      return null
    }
  }

  useEffect(() => {
    fetchVendas()
    fetchVendasCompletas()
  }, [])

  return {
    vendas,
    vendasCompletas,
    loading,
    error,
    addVenda,
    updateVenda,
    deleteVenda,
    getTotalVendas,
    getVendasPorMes,
    getVendasPorVendedor,
    getVendasRecorrentes,
    getResumoMensal,
    refetch: fetchVendas
  }
}

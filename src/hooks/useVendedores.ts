import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Vendedor = Database['public']['Tables']['vendedores']['Row']
type VendedorInsert = Database['public']['Tables']['vendedores']['Insert']
type VendedorUpdate = Database['public']['Tables']['vendedores']['Update']

export function useVendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendedores = async () => {
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .order('nome');
    
    if (error) {
      setError(error.message);
    } else {
      setVendedores(data || []);
    }
    setLoading(false);
  };

  const addVendedor = async (vendedor: VendedorInsert) => {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .insert(vendedor)
        .select()
        .single()

      if (error) throw error
      setVendedores(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar vendedor')
      throw err
    }
  }

  const updateVendedor = async (id: string, updates: VendedorUpdate) => {
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setVendedores(prev => prev.map(v => v.id === id ? data : v))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar vendedor')
      throw err
    }
  }

  const deleteVendedor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', id)

      if (error) throw error
      setVendedores(prev => prev.filter(v => v.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar vendedor')
      throw err
    }
  }

  const getVendedorById = (id: string) => {
    return vendedores.find(v => v.id === id)
  }

  const getVendedoresAtivos = () => {
    return vendedores.filter(v => v.ativo)
  }

  useEffect(() => {
    fetchVendedores()
  }, [])

  return {
    vendedores,
    loading,
    error,
    addVendedor,
    updateVendedor,
    deleteVendedor,
    getVendedorById,
    getVendedoresAtivos,
    refetch: fetchVendedores
  }
}
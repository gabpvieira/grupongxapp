import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useVendedores } from './useVendedores'
import type { Database } from '@/lib/supabase'

type Configuracao = Database['public']['Tables']['configuracoes']['Row']
type ConfiguracaoInsert = Database['public']['Tables']['configuracoes']['Insert']
type ConfiguracaoUpdate = Database['public']['Tables']['configuracoes']['Update']

export interface Vendedor {
  id: string
  nome: string
  email: string
  ativo: boolean
}

export interface Config {
  meta: number
  vendedores: Vendedor[]
}

export function useConfig() {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { vendedores, loading: vendedoresLoading } = useVendedores()

  const fetchConfiguracoes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .order('chave')

      if (error) throw error
      setConfiguracoes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const getConfiguracao = (chave: string): string | null => {
    const config = configuracoes.find(c => c.chave === chave)
    return config?.valor || null
  }

  const setConfiguracao = async (chave: string, valor: string, tipo: string = 'string', descricao?: string) => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .upsert({
          chave,
          valor,
          tipo,
          descricao,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'chave'
        })
        .select()
        .single()

      if (error) throw error
      
      setConfiguracoes(prev => {
        const existing = prev.find(c => c.chave === chave)
        if (existing) {
          return prev.map(c => c.chave === chave ? data : c)
        } else {
          return [...prev, data]
        }
      })

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração')
      throw err
    }
  }

  const deleteConfiguracao = async (chave: string) => {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .delete()
        .eq('chave', chave)

      if (error) throw error
      setConfiguracoes(prev => prev.filter(c => c.chave !== chave))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar configuração')
      throw err
    }
  }

  // Funções específicas para compatibilidade com a interface anterior
  const config: Config = {
    meta: parseInt(getConfiguracao('meta_mensal') || '50000'),
    vendedores: vendedores.map(v => ({
      id: v.id,
      nome: v.nome,
      email: v.email,
      ativo: v.ativo
    }))
  }

  const updateConfig = async (newConfig: Partial<Config>) => {
    try {
      if (newConfig.meta !== undefined) {
        await setConfiguracao('meta_mensal', newConfig.meta.toString(), 'number', 'Meta mensal de vendas')
      }
      // vendedores são gerenciados pelo hook useVendedores
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração')
      throw err
    }
  }

  const updateMeta = async (novaMeta: number) => {
    await setConfiguracao('meta_mensal', novaMeta.toString(), 'number', 'Meta mensal de vendas')
  }

  // Funções para configurações gerais
  const getAllConfiguracoes = () => configuracoes

  const getConfiguracoesPorTipo = (tipo: string) => {
    return configuracoes.filter(c => c.tipo === tipo)
  }

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  return {
    config,
    configuracoes,
    loading: loading || vendedoresLoading,
    error,
    updateConfig,
    updateMeta,
    getConfiguracao,
    setConfiguracao,
    deleteConfiguracao,
    getAllConfiguracoes,
    getConfiguracoesPorTipo,
    refetch: fetchConfiguracoes,
    // Manter compatibilidade com interface anterior
    addVendedor: () => {
      throw new Error('Use useVendedores().addVendedor() instead')
    },
    updateVendedor: () => {
      throw new Error('Use useVendedores().updateVendedor() instead')
    },
    removeVendedor: () => {
      throw new Error('Use useVendedores().deleteVendedor() instead')
    }
  }
}

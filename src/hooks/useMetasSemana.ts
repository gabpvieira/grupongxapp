import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface MetaSemanal {
  id: string
  metrica: string
  valor_meta: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface MetricaConfig {
  key: string
  label: string
  description: string
  unit?: string
  format?: 'currency' | 'number' | 'hours'
}

export const METRICAS_DISPONIVEIS: MetricaConfig[] = [
  {
    key: 'mrr_atual',
    label: 'MRR Atual',
    description: 'Receita Recorrente Mensal',
    format: 'currency'
  },
  {
    key: 'clientes_ativos',
    label: 'Clientes Ativos',
    description: 'Número de clientes ativos',
    format: 'number'
  },
  {
    key: 'abordagens_feitas',
    label: 'Abordagens Feitas',
    description: 'Número de abordagens realizadas',
    format: 'number'
  },
  {
    key: 'reunioes_realizadas',
    label: 'Reuniões Realizadas',
    description: 'Número de reuniões realizadas',
    format: 'number'
  },
  {
    key: 'propostas_enviadas',
    label: 'Propostas Enviadas',
    description: 'Número de propostas enviadas',
    format: 'number'
  },
  {
    key: 'fechamentos',
    label: 'Fechamentos',
    description: 'Número de vendas fechadas',
    format: 'number'
  },
  {
    key: 'horas_trabalhadas',
    label: 'Horas Trabalhadas',
    description: 'Total de horas trabalhadas',
    format: 'hours'
  },
  {
    key: 'leads_gerados',
    label: 'Leads Gerados (clientes)',
    description: 'Número de leads gerados',
    format: 'number'
  }
]

export function useMetasSemana() {
  const [metas, setMetas] = useState<MetaSemanal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetas = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('metas_semanais')
        .select('*')
        .eq('ativo', true)
        .order('metrica')

      if (fetchError) {
        throw fetchError
      }

      setMetas(data || [])
    } catch (err) {
      console.error('Erro ao buscar metas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const updateMeta = async (metrica: string, valor_meta: number) => {
    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('metas_semanais')
        .upsert({
          metrica,
          valor_meta,
          ativo: true
        }, {
          onConflict: 'metrica'
        })
        .select()

      if (updateError) {
        throw updateError
      }

      // Atualizar estado local
      setMetas(prev => {
        const existing = prev.find(m => m.metrica === metrica)
        if (existing) {
          return prev.map(m => 
            m.metrica === metrica 
              ? { ...m, valor_meta, updated_at: new Date().toISOString() }
              : m
          )
        } else {
          return [...prev, data[0]]
        }
      })

      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar meta:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  }

  const getMetaByKey = (metrica: string): MetaSemanal | undefined => {
    return metas.find(m => m.metrica === metrica)
  }

  const getMetaValue = (metrica: string): number => {
    const meta = getMetaByKey(metrica)
    return meta?.valor_meta || 0
  }

  const formatValue = (value: number, format?: 'currency' | 'number' | 'hours'): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value)
      case 'hours':
        return `${value}h`
      case 'number':
      default:
        return value.toLocaleString('pt-BR')
    }
  }

  useEffect(() => {
    fetchMetas()
  }, [])

  return {
    metas,
    loading,
    error,
    updateMeta,
    getMetaByKey,
    getMetaValue,
    formatValue,
    refetch: fetchMetas,
    metricasDisponiveis: METRICAS_DISPONIVEIS
  }
}
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useMetasSemana, METRICAS_DISPONIVEIS } from './useMetasSemana'

type MetricaSemanal = Database['public']['Tables']['metricas_semanais']['Row']
type MetricaSemanalInsert = Database['public']['Tables']['metricas_semanais']['Insert']
type MetricaSemanalUpdate = Database['public']['Tables']['metricas_semanais']['Update']
type MetricaIndividual = Database['public']['Tables']['metricas_individuais']['Row']
type MetricaIndividualInsert = Database['public']['Tables']['metricas_individuais']['Insert']
type MetricaIndividualUpdate = Database['public']['Tables']['metricas_individuais']['Update']

export interface WeeklyMetricsData {
  weekStart: string
  weekEnd: string
  saveDate: string
  metrics: {
    id?: string
    name: string
    target: string
    actual: string
    status: 'meta-ultrapassada' | 'meta-atingida' | 'parcial' | 'nao-atingida' | 'sem-meta'
    order: number
  }[]
}

export function useMetricas() {
  const [metricasSemanais, setMetricasSemanais] = useState<MetricaSemanal[]>([])
  const [metricasIndividuais, setMetricasIndividuais] = useState<MetricaIndividual[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<any[]>([])
  const [weeklyHistory, setWeeklyHistory] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hook para metas personalizadas
  const { getMetaValue, formatValue, loading: metasLoading } = useMetasSemana()

  // Função para gerar métricas com metas personalizadas
  const generateMetricsWithCustomTargets = () => {
    return METRICAS_DISPONIVEIS.map((metrica, index) => {
      const metaValue = getMetaValue(metrica.key)
      const target = metaValue > 0 ? formatValue(metaValue, metrica.format) : '-'
      
      return {
        id: (index + 1).toString(),
        name: metrica.label,
        target,
        real: '',
        status: 'sem-meta' as const
      }
    })
  }

  // Métricas padrão (fallback)
  const defaultMetrics = [
    { id: '1', name: 'MRR Atual', target: '-', real: '', status: 'sem-meta' },
    { id: '2', name: 'Clientes ativos', target: '-', real: '', status: 'sem-meta' },
    { id: '3', name: 'Abordagens feitas', target: '70', real: '', status: 'sem-meta' },
    { id: '4', name: 'Reuniões realizadas', target: '2-3', real: '', status: 'sem-meta' },
    { id: '5', name: 'Propostas enviadas', target: '2-3', real: '', status: 'sem-meta' },
    { id: '6', name: 'Fechamentos', target: '0.5-1', real: '', status: 'sem-meta' },
    { id: '7', name: 'Horas trabalhadas', target: '40-50h', real: '', status: 'sem-meta' },
    { id: '8', name: 'Leads gerados (clientes)', target: '100+', real: '', status: 'sem-meta' }
  ]

  // Função para obter a chave da semana atual (domingo a sábado)
  const getCurrentWeekKey = (): string => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    
    // Se hoje é domingo (0), a semana atual começou hoje
    // Se hoje é segunda (1), a semana atual começou ontem (domingo)
    // Se hoje é sábado (6), a semana atual começou 6 dias atrás (domingo)
    const daysToSubtract = day; // Quantos dias subtrair para chegar ao domingo
    startOfWeek.setDate(now.getDate() - daysToSubtract);
    
    return startOfWeek.toISOString().split('T')[0];
  };

  // Função para obter a semana mais recente (semana anterior se hoje for domingo)
  const getMostRecentWeekKey = (): string => {
    const now = new Date();
    const day = now.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    
    if (day === 0) {
      // Se hoje é domingo, pegar a semana anterior (que terminou ontem - sábado)
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7); // 7 dias atrás
      const startOfLastWeek = new Date(lastWeek);
      startOfLastWeek.setDate(lastWeek.getDate() - lastWeek.getDay()); // Domingo da semana anterior
      return startOfLastWeek.toISOString().split('T')[0];
    } else {
      // Para qualquer outro dia, usar a semana atual
      return getCurrentWeekKey();
    }
  };

  // Função para obter o range da semana (domingo a sábado)
  const getWeekRange = (weekKey: string): string => {
    const startDate = new Date(weekKey); // Domingo
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Sábado (6 dias depois do domingo)
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };
    
    return `${formatDate(startDate)} a ${formatDate(endDate)}`;
  };

  // Função para obter o range da semana como objeto (para uso interno)
  const getWeekRangeObject = (weekKey: string) => {
    const startDate = new Date(weekKey); // Domingo
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Sábado (6 dias depois do domingo)
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchMetricasSemanais = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('metricas_semanais')
        .select('*')
        .order('semana_inicio', { ascending: false })

      if (error) throw error
      setMetricasSemanais(data || [])
      
      // Carregar histórico semanal e inicializar currentMetrics
      await loadWeeklyHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas semanais')
      // Fallback para métricas com metas personalizadas ou padrão em caso de erro
      const customMetrics = generateMetricsWithCustomTargets()
      setCurrentMetrics(customMetrics.length > 0 ? customMetrics : defaultMetrics)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetricasIndividuais = async (metricaSemanalId?: string) => {
    try {
      let query = supabase
        .from('metricas_individuais')
        .select('*')
        .order('ordem')

      if (metricaSemanalId) {
        query = query.eq('metrica_semanal_id', metricaSemanalId)
      }

      const { data, error } = await query

      if (error) throw error
      setMetricasIndividuais(data || [])
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas individuais')
      return []
    }
  }

  const saveWeeklyMetrics = async (
    weekStart: string,
    weekEnd: string,
    summary: any,
    metrics: any[]
  ) => {
    try {
      // Primeiro, salvar ou atualizar a métrica semanal
      const { data: metricaSemanal, error: semanalError } = await supabase
        .from('metricas_semanais')
        .upsert({
          semana_inicio: weekStart,
          semana_fim: weekEnd,
          data_salvamento: new Date().toISOString(),
          total_metas: summary.totalMetas,
          metas_atingidas: summary.metasAtingidas,
          metas_ultrapassadas: summary.metasUltrapassadas,
          metas_nao_atingidas: summary.metasNaoAtingidas,
          parciais: summary.parciais,
        })
        .select()
        .single()

      if (semanalError) throw semanalError

      // Deletar métricas individuais existentes para esta semana
      await supabase
        .from('metricas_individuais')
        .delete()
        .eq('metrica_semanal_id', metricaSemanal.id)

      // Inserir novas métricas individuais
      const metricasParaInserir: MetricaIndividualInsert[] = metrics.map(metric => ({
        metrica_semanal_id: metricaSemanal.id,
        nome: metric.nome,
        meta: metric.meta,
        valor_real: metric.valor_real,
        status: metric.status,
        ordem: metric.ordem
      }))

      const { error: individuaisError } = await supabase
        .from('metricas_individuais')
        .insert(metricasParaInserir)

      if (individuaisError) throw individuaisError

      // Atualizar estado local
      await fetchMetricasSemanais()
      await fetchMetricasIndividuais()

      return metricaSemanal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar métricas semanais')
      throw err
    }
  }

  // Função para carregar histórico semanal
  const loadWeeklyHistory = async () => {
    try {
      setLoading(true)
      const { data: semanais, error: errorSemanais } = await supabase
        .from('metricas_semanais')
        .select('*')
        .order('semana_inicio', { ascending: false })

      if (errorSemanais) throw errorSemanais

      const { data: individuais, error: errorIndividuais } = await supabase
        .from('metricas_individuais')
        .select('*')
        .order('ordem')

      if (errorIndividuais) throw errorIndividuais

      // Construir histórico semanal
      const history: any = {}
      
      for (const semanal of semanais || []) {
        const weekKey = semanal.semana_inicio
        const metricsForWeek = individuais?.filter(
          ind => ind.metrica_semanal_id === semanal.id
        ) || []

        history[weekKey] = {
          dateRange: getWeekRange(weekKey),
          metrics: metricsForWeek.map(metric => ({
            id: metric.id,
            name: metric.nome,
            target: metric.meta,
            real: metric.valor_real,
            status: metric.status
          })),
          summary: {
            totalMetas: semanal.total_metas,
            metasAtingidas: semanal.metas_atingidas,
            metasUltrapassadas: semanal.metas_ultrapassadas,
            metasNaoAtingidas: semanal.metas_nao_atingidas,
            parciais: semanal.parciais
          },
          savedAt: semanal.data_salvamento
        }
      }

      setWeeklyHistory(history)

      // Carregar métricas da semana mais recente
      const mostRecentWeekKey = getMostRecentWeekKey()
      if (history[mostRecentWeekKey]) {
        setCurrentMetrics(history[mostRecentWeekKey].metrics)
      } else {
        // Usar métricas com metas personalizadas se disponíveis
        const customMetrics = generateMetricsWithCustomTargets()
        setCurrentMetrics(customMetrics.length > 0 ? customMetrics : defaultMetrics)
      }

      setError(null)
    } catch (err) {
      console.error('Erro ao carregar histórico semanal:', err)
      setError('Erro ao carregar dados')
      // Fallback para métricas com metas personalizadas ou padrão
      const customMetrics = generateMetricsWithCustomTargets()
      setCurrentMetrics(customMetrics.length > 0 ? customMetrics : defaultMetrics)
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar semana atual
  const saveCurrentWeek = async () => {
    try {
      setLoading(true)
      const mostRecentWeekKey = getMostRecentWeekKey()
      const weekRange = getWeekRangeObject(mostRecentWeekKey)
      
      // Calcular resumo
      const summary = calculateSummary(currentMetrics)
      
      // Salvar no Supabase usando a função existente
      await saveWeeklyMetrics(
        weekRange.start,
        weekRange.end,
        summary,
        currentMetrics.map(metric => ({
          nome: metric.name,
          meta: metric.target,
          valor_real: metric.real,
          status: metric.status,
          ordem: parseInt(metric.id)
        }))
      )

      // Recarregar dados
      await loadWeeklyHistory()
      
      setError(null)
    } catch (err) {
      console.error('Erro ao salvar semana:', err)
      setError('Erro ao salvar dados')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular resumo
  const calculateSummary = (metrics: any[]) => {
    let totalMetas = 0
    let metasAtingidas = 0
    let metasUltrapassadas = 0
    let metasNaoAtingidas = 0
    let parciais = 0

    metrics.forEach(metric => {
      if (metric.target !== '-' && metric.real !== '') {
        totalMetas++
        
        switch (metric.status) {
          case 'atingida':
            metasAtingidas++
            break
          case 'ultrapassada':
            metasUltrapassadas++
            break
          case 'nao-atingida':
            metasNaoAtingidas++
            break
          case 'parcial':
            parciais++
            break
        }
      }
    })

    return {
      totalMetas,
      metasAtingidas,
      metasUltrapassadas,
      metasNaoAtingidas,
      parciais
    }
  }

  const getWeeklyMetrics = async (weekStart: string, weekEnd: string): Promise<WeeklyMetricsData | null> => {
    try {
      const { data: metricaSemanal, error: semanalError } = await supabase
        .from('metricas_semanais')
        .select('*')
        .eq('semana_inicio', weekStart)
        .eq('semana_fim', weekEnd)
        .single()

      if (semanalError) {
        if (semanalError.code === 'PGRST116') {
          // Não encontrado, retornar null
          return null
        }
        throw semanalError
      }

      const metricasIndividuais = await fetchMetricasIndividuais(metricaSemanal.id)

      return {
        weekStart: metricaSemanal.semana_inicio,
        weekEnd: metricaSemanal.semana_fim,
        saveDate: metricaSemanal.data_salvamento,
        metrics: metricasIndividuais.map(m => ({
          id: m.id,
          name: m.nome,
          target: m.meta || '',
          actual: m.valor_real || '',
          status: m.status,
          order: m.ordem
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar métricas da semana')
      return null
    }
  }

  const deleteWeeklyMetrics = async (metricaSemanalId: string) => {
    try {
      // Deletar métricas individuais primeiro
      await supabase
        .from('metricas_individuais')
        .delete()
        .eq('metrica_semanal_id', metricaSemanalId)

      // Deletar métrica semanal
      const { error } = await supabase
        .from('metricas_semanais')
        .delete()
        .eq('id', metricaSemanalId)

      if (error) throw error

      // Atualizar estado local
      setMetricasSemanais(prev => prev.filter(m => m.id !== metricaSemanalId))
      setMetricasIndividuais(prev => prev.filter(m => m.metrica_semanal_id !== metricaSemanalId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar métricas semanais')
      throw err
    }
  }

  const getMetricasSemanalPorPeriodo = (dataInicio: string, dataFim: string) => {
    return metricasSemanais.filter(m => 
      m.semana_inicio >= dataInicio && m.semana_fim <= dataFim
    )
  }

  const getResumoMetricas = () => {
    const total = metricasSemanais.length
    const totalMetas = metricasSemanais.reduce((acc, m) => acc + m.total_metas, 0)
    const metasAtingidas = metricasSemanais.reduce((acc, m) => acc + m.metas_atingidas, 0)
    const metasUltrapassadas = metricasSemanais.reduce((acc, m) => acc + m.metas_ultrapassadas, 0)
    const metasNaoAtingidas = metricasSemanais.reduce((acc, m) => acc + m.metas_nao_atingidas, 0)
    const parciais = metricasSemanais.reduce((acc, m) => acc + m.parciais, 0)

    return {
      totalSemanas: total,
      totalMetas,
      metasAtingidas,
      metasUltrapassadas,
      metasNaoAtingidas,
      parciais,
      percentualSucesso: totalMetas > 0 ? ((metasAtingidas + metasUltrapassadas) / totalMetas) * 100 : 0
    }
  }

  useEffect(() => {
    fetchMetricasSemanais()
  }, [])

  // Aguardar carregamento das metas antes de carregar histórico
  useEffect(() => {
    if (!metasLoading) {
      loadWeeklyHistory()
    }
  }, [metasLoading])

  return {
    metricasSemanais,
    metricasIndividuais,
    currentMetrics,
    setCurrentMetrics,
    weeklyHistory,
    loading,
    error,
    defaultMetrics,
    getCurrentWeekKey,
    getMostRecentWeekKey,
    getWeekRange,
    saveWeeklyMetrics,
    saveCurrentWeek,
    loadWeeklyHistory,
    getWeeklyMetrics,
    deleteWeeklyMetrics,
    fetchMetricasIndividuais,
    getMetricasSemanalPorPeriodo,
    getResumoMetricas,
    refetch: fetchMetricasSemanais
  }
}
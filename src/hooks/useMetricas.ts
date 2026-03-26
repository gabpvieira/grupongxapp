import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfWeek, endOfWeek, format, addDays, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Tipos ---
export type StatusMetrica = 'meta-ultrapassada' | 'meta-atingida' | 'parcial' | 'nao-atingida' | 'sem-meta';
export type UnidadeMetrica = 'numero' | 'horas' | 'percentual' | 'moeda';

export interface MetaConfigurada {
  id: string;
  metrica: string;
  valor_meta: number;
  ativo: boolean;
  unidade: UnidadeMetrica;
  icone: string;
  descricao: string;
}

export interface MetricaIndividual {
  id: string;
  metrica_semanal_id: string;
  nome: string;
  meta: string;
  valor_real: string;
  status: StatusMetrica;
  ordem: number;
  unidade: UnidadeMetrica;
  nota: string | null;
}

export interface SemanaSalva {
  id: string;
  semana_inicio: string;
  semana_fim: string;
  total_metas: number;
  metas_atingidas: number;
  metas_ultrapassadas: number;
  metas_nao_atingidas: number;
  parciais: number;
  score_percentual: number;
  observacao_geral: string | null;
  metricas: MetricaIndividual[];
}

// --- Helpers ---
export const calcularStatus = (real: number, meta: number): StatusMetrica => {
  if (meta === 0) return 'sem-meta';
  const pct = real / meta;
  if (pct >= 1.1) return 'meta-ultrapassada';  // >110%
  if (pct >= 1.0) return 'meta-atingida';      // 100–110%
  if (pct >= 0.5) return 'parcial';       // 50–99%
  return 'nao-atingida';                  // <50%
};

// --- Hook ---
export function useMetricas() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [semana, setSemana] = useState<SemanaSalva | null>(null);
  const [semanaAnterior, setSemanaAnterior] = useState<SemanaSalva | null>(null);
  const [historico, setHistorico] = useState<SemanaSalva[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Debounce refs
  const timeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const inicioSemana = startOfWeek(dataAtual, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(dataAtual, { weekStartsOn: 1 });

  const fetchSemana = useCallback(async (data: Date) => {
    try {
      setLoading(true);
      const inicio = format(startOfWeek(data, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // 1. Buscar em metricas_semanais
      const { data: semanaExistente, error: errorSemana } = await supabase
        .from('metricas_semanais')
        .select(`
          *,
          metricas:metricas_individuais(*)
        `)
        .eq('semana_inicio', inicio)
        .maybeSingle();

      if (errorSemana) throw errorSemana;

      if (semanaExistente) {
        // Ordenar métricas por ordem
        const sortedMetricas = (semanaExistente.metricas || []).sort((a: any, b: any) => a.ordem - b.ordem);
        setSemana({ ...semanaExistente, metricas: sortedMetricas });
      } else {
        // 2. Se não existir, criar automaticamente
        const { data: metasAtivas, error: errorMetas } = await supabase
          .from('metas_semanais')
          .select('*')
          .eq('ativo', true)
          .order('metrica');

        if (errorMetas) throw errorMetas;

        const fim = format(endOfWeek(data, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        
        const { data: novaSemana, error: errorInsert } = await supabase
          .from('metricas_semanais')
          .insert({
            semana_inicio: inicio,
            semana_fim: fim,
            total_metas: metasAtivas.length,
            metas_atingidas: 0,
            metas_ultrapassadas: 0,
            metas_nao_atingidas: metasAtivas.length,
            parciais: 0,
            score_percentual: 0
          })
          .select()
          .single();

        if (errorInsert) throw errorInsert;

        const metricasInsert = metasAtivas.map((meta, index) => ({
          metrica_semanal_id: novaSemana.id,
          nome: meta.metrica,
          meta: meta.valor_meta.toString(),
          unidade: meta.unidade || 'numero',
          valor_real: '0',
          status: 'nao-atingida',
          ordem: index
        }));

        const { data: novasMetricas, error: errorMetricas } = await supabase
          .from('metricas_individuais')
          .insert(metricasInsert)
          .select();

        if (errorMetricas) throw errorMetricas;

        setSemana({ ...novaSemana, metricas: novasMetricas });
      }

      // Buscar semana anterior para comparação
      const inicioAnt = format(startOfWeek(subDays(startOfWeek(data, { weekStartsOn: 1 }), 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const { data: antSemana } = await supabase
        .from('metricas_semanais')
        .select('*, metricas:metricas_individuais(*)')
        .eq('semana_inicio', inicioAnt)
        .maybeSingle();
      
      setSemanaAnterior(antSemana as any);

    } catch (err: any) {
      console.error('Erro useMetricas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistorico = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('metricas_semanais')
        .select('*')
        .order('semana_inicio', { ascending: false })
        .limit(12);

      if (error) throw error;
      setHistorico(data as any);
    } catch (err: any) {
      console.error('Erro Historico:', err);
    }
  }, []);

  useEffect(() => {
    fetchSemana(dataAtual);
    fetchHistorico();
  }, [dataAtual, fetchSemana, fetchHistorico]);

  const navegarSemana = (direcao: 'anterior' | 'proxima') => {
    setDataAtual(prev => addDays(prev, direcao === 'anterior' ? -7 : 7));
  };

  const selecionarSemana = (inicio: string) => {
    setDataAtual(parseISO(inicio));
  };

  const recalcularScoreSemana = async (semanaId: string) => {
    const { data: metricas } = await supabase
      .from('metricas_individuais')
      .select('status')
      .eq('metrica_semanal_id', semanaId);

    if (!metricas) return;

    const total = metricas.filter(m => m.status !== 'sem-meta').length;
    const atingidas = metricas.filter(m => m.status === 'meta-atingida').length;
    const ultrapassadas = metricas.filter(m => m.status === 'meta-ultrapassada').length;
    const parciais = metricas.filter(m => m.status === 'parcial').length;
    const naoAtingidas = metricas.filter(m => m.status === 'nao-atingida').length;
    const score = total > 0 ? ((atingidas + ultrapassadas) / total) * 100 : 0;

    const { data: semanaAtualizada } = await supabase
      .from('metricas_semanais')
      .update({
        total_metas: total,
        metas_atingidas: atingidas,
        metas_ultrapassadas: ultrapassadas,
        metas_nao_atingidas: naoAtingidas,
        parciais,
        score_percentual: score,
        updated_at: new Date().toISOString()
      })
      .eq('id', semanaId)
      .select()
      .single();
    
    if (semanaAtualizada) {
      setSemana(prev => prev ? { ...prev, ...semanaAtualizada } : null);
    }
  };

  const atualizarMetrica = useCallback(async (id: string, valor_real: string) => {
    if (!semana) return;

    // Atualização otimista no estado local
    setSemana(prev => {
      if (!prev) return null;
      return {
        ...prev,
        metricas: prev.metricas.map(m => {
          if (m.id === id) {
            const realNum = parseFloat(valor_real) || 0;
            const metaNum = parseFloat(m.meta) || 0;
            return {
              ...m,
              valor_real,
              status: calcularStatus(realNum, metaNum)
            };
          }
          return m;
        })
      };
    });

    setSaving('saving');

    if (timeouts.current[id]) clearTimeout(timeouts.current[id]);

    timeouts.current[id] = setTimeout(async () => {
      try {
        const metrica = semana.metricas.find(m => m.id === id);
        if (!metrica) return;

        const realNum = parseFloat(valor_real) || 0;
        const metaNum = parseFloat(metrica.meta) || 0;
        const status = calcularStatus(realNum, metaNum);

        const { error } = await supabase
          .from('metricas_individuais')
          .update({ 
            valor_real, 
            status,
            updated_at: new Date().toISOString() 
          })
          .eq('id', id);

        if (error) throw error;

        await recalcularScoreSemana(semana.id);
        setSaving('saved');
        setTimeout(() => setSaving('idle'), 2000);
      } catch (err) {
        setSaving('error');
        console.error('Erro salvar:', err);
      }
    }, 800);
  }, [semana]);

  const atualizarObservacao = useCallback(async (obs: string) => {
    if (!semana) return;

    setSemana(prev => prev ? { ...prev, observacao_geral: obs } : null);
    setSaving('saving');

    if (timeouts.current['obs']) clearTimeout(timeouts.current['obs']);

    timeouts.current['obs'] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('metricas_semanais')
          .update({ 
            observacao_geral: obs,
            updated_at: new Date().toISOString()
          })
          .eq('id', semana.id);

        if (error) throw error;
        setSaving('saved');
        setTimeout(() => setSaving('idle'), 2000);
      } catch (err) {
        setSaving('error');
      }
    }, 1000);
  }, [semana]);

  const salvarNotaMetrica = async (id: string, nota: string | null) => {
    if (!semana) return;
    
    try {
      const { error } = await supabase
        .from('metricas_individuais')
        .update({ nota, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setSemana(prev => {
        if (!prev) return null;
        return {
          ...prev,
          metricas: prev.metricas.map(m => m.id === id ? { ...m, nota } : m)
        };
      });
    } catch (err) {
      console.error('Erro nota:', err);
    }
  };

  return {
    semana,
    semanaAnterior,
    historico,
    loading,
    saving,
    error,
    inicioSemana,
    fimSemana,
    navegarSemana,
    selecionarSemana,
    atualizarMetrica,
    atualizarObservacao,
    salvarNotaMetrica
  };
}
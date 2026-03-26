import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';
import { format } from 'date-fns';
import type { UpdateParcelaPayload, VendaCompleta as VendaCompletaLocal } from '@/types/financeiro';

export type Venda = Database['public']['Tables']['vendas']['Row'];
export type VendaInsert = Database['public']['Tables']['vendas']['Insert'];
export type VendaUpdate = Database['public']['Tables']['vendas']['Update'];
export type { VendaCompletaLocal as VendaCompleta };
export type ResumoMensal = Database['public']['Views']['resumo_mensal_vendas']['Row'];

export interface FinanceiroFilters {
  dataInicio: Date;
  dataFim: Date;
  responsavelId?: string;
  tipo?: 'recorrente' | 'unico' | 'todos';
}

export function useFinanceiro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getKpis = useCallback(async (dataInicio: Date, dataFim: Date) => {
    try {
      setLoading(true);

      // Buscar via view para ter valor_efetivo e status
      const { data: vendasPeriodo, error: errorVendas } = await supabase
        .from('vendas_completas')
        .select('valor_efetivo, status_pagamento')
        .gte('data_fechamento', format(dataInicio, 'yyyy-MM-dd'))
        .lte('data_fechamento', format(dataFim, 'yyyy-MM-dd'));

      const { data: metaConfig, error: errorMeta } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'meta_mensal')
        .single();

      if (errorVendas) throw errorVendas;
      if (errorMeta) throw errorMeta;

      const metaMensal = metaConfig ? parseFloat(metaConfig.valor) : 2500;
      // Excluir cancelados dos KPIs
      const ativas = (vendasPeriodo || []).filter((v) => v.status_pagamento !== 'cancelado');
      const totalVendas = ativas.reduce((acc, v) => acc + Number((v as any).valor_efetivo ?? 0), 0);
      const qtdNegocios = ativas.length;
      const percentMeta = (totalVendas / metaMensal) * 100;

      return { totalVendas, qtdNegocios, percentMeta, metaMensal };
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError('Erro ao carregar indicadores financeiros');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVendas = useCallback(async (filters: FinanceiroFilters) => {
    try {
      setLoading(true);
      let query = supabase.from('vendas_completas').select('*')
        .gte('data_fechamento', format(filters.dataInicio, 'yyyy-MM-dd'))
        .lte('data_fechamento', format(filters.dataFim, 'yyyy-MM-dd'));

      if (filters.responsavelId && filters.responsavelId !== 'todos') {
        query = query.eq('responsavel_email', filters.responsavelId);
      }

      if (filters.tipo && filters.tipo !== 'todos') {
        query = query.eq('recorrente', filters.tipo === 'recorrente');
      }

      const { data, error } = await query.order('data_fechamento', { ascending: false });

      if (error) throw error;
      return (data || []) as VendaCompletaLocal[];
    } catch (err) {
      console.error('Error fetching Vendas:', err);
      setError('Erro ao carregar lista de lançamentos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createVenda = async (venda: VendaInsert) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendas')
        .insert(venda)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating Venda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateVenda = async (id: string, updates: VendaUpdate) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating Venda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateParcela = async (id: string, payload: UpdateParcelaPayload) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('vendas')
        .update(payload as Record<string, unknown>)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating Parcela:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteVenda = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting Venda:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getKpis,
    getVendas,
    createVenda,
    updateVenda,
    updateParcela,
    deleteVenda
  };
}

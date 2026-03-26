// src/hooks/useOrcamentos.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Orcamento, StatusOrcamento, OrcamentoItem, OrcamentoFormPayload } from '@/types/orcamentos';
import { useToast } from '@/hooks/use-toast';

export function useOrcamentos(mostrarArquivados: boolean = false) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrcamentos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orcamentos_completos')
        .select('*')
        .eq('arquivado', mostrarArquivados)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrcamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      toast({
        title: 'Erro ao buscar orçamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [mostrarArquivados, toast]);

  const fetchItens = useCallback(async (orcamentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamentoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as OrcamentoItem[];
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return [];
    }
  }, []);

  const criarOrcamento = async (payload: OrcamentoFormPayload) => {
    try {
      const { itens, ...dadosOrcamento } = payload;

      // 1. Criar o orçamento (valor_total será 0 inicialmente, trigger atualizará depois)
      const { data: novo, error: errOrc } = await supabase
        .from('orcamentos')
        .insert(dadosOrcamento)
        .select()
        .single();

      if (errOrc) throw errOrc;

      // 2. Inserir itens
      if (itens.length > 0) {
        const { error: errItens } = await supabase
          .from('orcamento_itens')
          .insert(
            itens.map((it, idx) => ({
              ...it,
              orcamento_id: novo.id,
              ordem: it.ordem ?? idx
            }))
          );
        if (errItens) throw errItens;
      }

      await fetchOrcamentos();
      toast({ title: 'Orçamento criado com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: 'Erro ao criar orçamento',
        variant: 'destructive',
      });
      return false;
    }
  };

  const editarOrcamento = async (id: string, payload: OrcamentoFormPayload) => {
    try {
      const { itens, ...dadosOrcamento } = payload;

      // 1. Atualizar dados básicos
      const { error: errOrc } = await supabase
        .from('orcamentos')
        .update(dadosOrcamento)
        .eq('id', id);

      if (errOrc) throw errOrc;

      // 2. Sincronizar itens (Delete + Insert conforme solicitado)
      const { error: errDel } = await supabase
        .from('orcamento_itens')
        .delete()
        .eq('orcamento_id', id);

      if (errDel) throw errDel;

      if (itens.length > 0) {
        const { error: errIns } = await supabase
          .from('orcamento_itens')
          .insert(
            itens.map((it, idx) => ({
              ...it,
              orcamento_id: id,
              ordem: idx
            }))
          );
        if (errIns) throw errIns;
      }

      await fetchOrcamentos();
      toast({ title: 'Orçamento atualizado com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao editar orçamento:', error);
      toast({
        title: 'Erro ao editar orçamento',
        variant: 'destructive',
      });
      return false;
    }
  };

  const mudarStatus = async (id: string, status: StatusOrcamento) => {
    try {
      const updates: any = { status };
      
      if (status === 'aprovado') {
        updates.aprovado_em = new Date().toISOString();
      } else if (status === 'assinado') {
        updates.assinado_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orcamentos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchOrcamentos();
      toast({ title: 'Status do orçamento atualizado!' });
      return true;
    } catch (error) {
      console.error('Erro ao mudar status:', error);
      toast({
        title: 'Erro ao mudar status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const arquivarOrcamento = async (id: string, arquivado: boolean) => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update({ arquivado })
        .eq('id', id);

      if (error) throw error;
      await fetchOrcamentos();
      toast({ title: arquivado ? 'Orçamento arquivado!' : 'Orçamento restaurado!' });
      return true;
    } catch (error) {
      console.error('Erro ao (des)arquivar:', error);
      toast({
        title: 'Erro ao processar',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deletarOrcamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchOrcamentos();
      toast({ title: 'Orçamento apagado permanentemente!' });
      return true;
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast({
        title: 'Erro ao deletar',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, [fetchOrcamentos]);

  return {
    orcamentos,
    loading,
    fetchOrcamentos,
    fetchItens,
    criarOrcamento,
    editarOrcamento,
    mudarStatus,
    arquivarOrcamento,
    deletarOrcamento
  };
}

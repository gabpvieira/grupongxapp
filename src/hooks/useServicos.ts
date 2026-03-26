// src/hooks/useServicos.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Servico, ServicoFormPayload } from '@/types/servicos';
import { useToast } from '@/hooks/use-toast';

export function useServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServicos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      toast({
        title: 'Erro ao buscar serviços',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addServico = async (payload: ServicoFormPayload) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .insert({
          ...payload,
          ordem: servicos.length > 0 ? Math.max(...servicos.map(s => s.ordem || 0)) + 1 : 0
        });

      if (error) throw error;
      await fetchServicos();
      toast({ title: 'Serviço adicionado com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      toast({
        title: 'Erro ao adicionar serviço',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateServico = async (id: string, payload: ServicoFormPayload) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      await fetchServicos();
      toast({ title: 'Serviço atualizado!' });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      toast({
        title: 'Erro ao atualizar serviço',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteServico = async (id: string) => {
    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchServicos();
      toast({ title: 'Serviço removido!' });
      return true;
    } catch (error) {
      console.error('Erro ao remover serviço:', error);
      toast({
        title: 'Erro ao remover serviço',
        variant: 'destructive',
      });
      return false;
    }
  };

  const categorias = Array.from(new Set(servicos.map(s => s.categoria))).sort();

  useEffect(() => {
    fetchServicos();
  }, [fetchServicos]);

  return {
    servicos,
    loading,
    categorias,
    fetchServicos,
    addServico,
    updateServico,
    deleteServico,
  };
}

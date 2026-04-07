// src/hooks/usePropostas.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Proposta, PropostaFormPayload } from '@/types/propostas';
import { useToast } from '@/hooks/use-toast';

export function usePropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPropostas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPropostas(data || []);
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
      toast({
        title: 'Erro ao buscar propostas',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addProposta = async (payload: PropostaFormPayload) => {
    try {
      const { error } = await supabase
        .from('propostas')
        .insert(payload);

      if (error) throw error;
      await fetchPropostas();
      toast({ title: 'Proposta publicada com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao publicar proposta:', error);
      toast({
        title: 'Erro ao publicar proposta',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleAtiva = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('propostas')
        .update({ ativa: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchPropostas();
      toast({ title: `Proposta ${!currentStatus ? 'ativada' : 'desativada'}!` });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProposta = async (id: string) => {
    try {
      const { error } = await supabase
        .from('propostas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchPropostas();
      toast({ title: 'Proposta excluída!' });
      return true;
    } catch (error) {
      console.error('Erro ao excluir proposta:', error);
      toast({
        title: 'Erro ao excluir proposta',
        variant: 'destructive',
      });
      return false;
    }
  };

  const incrementView = async (slug: string) => {
    try {
      const { error } = await supabase.rpc('increment_proposta_view', { p_slug: slug });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao incrementar visualização:', error);
    }
  };

  const getPropostaBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('propostas')
        .select('*')
        .eq('slug', slug)
        .eq('ativa', true)
        .single();

      if (error) return null;
      return data as Proposta;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    fetchPropostas();
  }, [fetchPropostas]);

  return {
    propostas,
    loading,
    fetchPropostas,
    addProposta,
    toggleAtiva,
    deleteProposta,
    incrementView,
    getPropostaBySlug,
  };
}

// src/hooks/useCrm.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lead, Atividade, EtapaLead, OrigemLead, TipoAtividade } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

export function useCrm() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async (showLost = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('crm_leads_completos')
        .select('*')
        .order('ordem', { ascending: true })
        .order('created_at', { ascending: false });

      if (!showLost) {
        query = query.neq('etapa', 'perdido');
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: 'Erro ao buscar leads',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAtividades = async (leadId: string) => {
    const { data, error } = await supabase
      .from('crm_atividades')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return [];
    }
    return data as Atividade[];
  };

  const moverEtapa = async (leadId: string, novaEtapa: EtapaLead, responsavelId?: string) => {
    try {
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({ etapa: novaEtapa, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Log automático de mudança de etapa
      const { error: activityError } = await supabase
        .from('crm_atividades')
        .insert({
          lead_id: leadId,
          tipo: 'etapa_alterada',
          descricao: `Etapa alterada para ${novaEtapa.replace('_', ' ')}`,
          responsavel_id: responsavelId,
        });

      if (activityError) console.error('Erro ao registrar mudança de etapa:', activityError);

      await fetchLeads();
      toast({ title: 'Lead movido com sucesso!' });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: 'Erro ao mover lead',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const criarLead = async (lead: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .insert({
          ...lead,
          ordem: leads.length > 0 ? Math.max(...leads.map(l => l.ordem || 0)) + 1 : 0
        });

      if (error) throw error;
      await fetchLeads();
      toast({ title: 'Lead criado com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: 'Erro ao criar lead',
        description: 'Verifique os campos e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const registrarAtividade = async (atividade: Partial<Atividade>) => {
    try {
      const { error } = await supabase
        .from('crm_atividades')
        .insert(atividade);

      if (error) throw error;
      toast({ title: 'Atividade registrada!' });
      return true;
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      toast({
        title: 'Erro ao registrar atividade',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    fetchLeads,
    fetchAtividades,
    moverEtapa,
    criarLead,
    registrarAtividade
  };
}

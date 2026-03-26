import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Vendedor {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at?: string;
}

export interface MetaSemanal {
  id: string;
  metrica: string;
  valor_meta: number;
  ativo: boolean;
  descricao?: string;
  unidade?: string;
}

export const useConfiguracoes = () => {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  // Estados de dados
  const [metaMensal, setMetaMensal] = useState<number>(0);
  const [metasSemanais, setMetasSemanais] = useState<MetaSemanal[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, metasRes, vendsRes] = await Promise.all([
        supabase.from('configuracoes').select('*').eq('chave', 'meta_mensal').maybeSingle(),
        supabase.from('metas_semanais').select('*').eq('ativo', true).order('metrica'),
        supabase.from('vendedores').select('*').order('nome')
      ]);

      if (configRes.error) throw configRes.error;
      if (metasRes.error) throw metasRes.error;
      if (vendsRes.error) throw vendsRes.error;

      setMetaMensal(parseFloat(configRes.data?.valor || '0'));
      setMetasSemanais(metasRes.data || []);
      setVendedores(vendsRes.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const salvarMetaMensal = async (novoValor: number) => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          chave: 'meta_mensal',
          valor: novoValor.toString(),
          tipo: 'number',
          updated_at: new Date().toISOString()
        }, { onConflict: 'chave' });

      if (error) throw error;
      setMetaMensal(novoValor);
      toast.success('Meta mensal salva');
    } catch (error: any) {
      toast.error('Erro ao salvar meta mensal');
    } finally {
      setSalvando(false);
    }
  };

  const salvarTodasMetas = async (alteracoes: Record<string, string>) => {
    setSalvando(true);
    try {
      const updates = Object.entries(alteracoes).map(([metrica, valor]) =>
        supabase
          .from('metas_semanais')
          .update({ 
            valor_meta: parseFloat(valor), 
            updated_at: new Date().toISOString() 
          })
          .eq('metrica', metrica)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) throw new Error('Algumas metas não puderam ser salvas');

      toast.success('Metas semanais atualizadas');
      await fetchData(); // Recarregar para garantir sincronia
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar metas');
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const toggleVendedorAtivo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendedores')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setVendedores(prev => prev.map(v => v.id === id ? { ...v, ativo: !currentStatus } : v));
      toast.success(`Vendedor ${!currentStatus ? 'ativado' : 'desativado'}`);
    } catch (error: any) {
      toast.error('Erro ao alterar status');
    }
  };

  const deletarVendedor = async (id: string) => {
    try {
      const { error } = await supabase.from('vendedores').delete().eq('id', id);
      if (error) throw error;
      setVendedores(prev => prev.filter(v => v.id !== id));
      toast.success('Vendedor removido');
    } catch (error: any) {
      toast.error('Erro ao remover vendedor');
    }
  };

  const adicionarVendedor = async (nome: string, email: string) => {
    setSalvando(true);
    try {
      const { data, error } = await supabase
        .from('vendedores')
        .insert({ nome, email, ativo: true })
        .select()
        .single();

      if (error) throw error;
      setVendedores(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      toast.success('Vendedor adicionado');
      return true;
    } catch (error: any) {
      toast.error('Erro ao adicionar vendedor');
      return false;
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    salvando,
    metaMensal,
    metasSemanais,
    vendedores,
    salvarMetaMensal,
    salvarTodasMetas,
    toggleVendedorAtivo,
    deletarVendedor,
    adicionarVendedor,
    refresh: fetchData
  };
};

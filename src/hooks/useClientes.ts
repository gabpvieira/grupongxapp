// src/hooks/useClientes.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Cliente, ClienteInsert, ClienteUpdate, StatusCliente } from '@/types/clientes';
import { useToast } from '@/hooks/use-toast';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClientes = useCallback(async (filters?: { status?: StatusCliente | 'todos', search?: string }) => {
    try {
      setLoading(true);
      let query = supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true });

      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        // Busca por nome ou documento (removendo caracteres não numéricos para documento se necessário)
        const searchTerm = `%${filters.search}%`;
        query = query.or(`nome.ilike.${searchTerm},documento.ilike.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: 'Erro ao buscar clientes',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addCliente = async (cliente: ClienteInsert) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert(cliente)
        .select()
        .single();

      if (error) throw error;
      
      setClientes(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      toast({ title: 'Cliente cadastrado com sucesso!' });
      return data;
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast({
        title: 'Erro ao cadastrar cliente',
        description: error instanceof Error ? error.message : 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCliente = async (id: string, updates: ClienteUpdate) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setClientes(prev => prev.map(c => c.id === id ? data : c).sort((a, b) => a.nome.localeCompare(b.nome)));
      toast({ title: 'Cliente atualizado com sucesso!' });
      return data;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClientes(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Cliente excluído com sucesso!' });
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro ao excluir cliente',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const searchClientes = async (query: string) => {
    if (!query) return [];
    try {
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, segmento, status')
        .or(`nome.ilike.${searchTerm},documento.ilike.${searchTerm}`)
        .order('nome', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao pesquisar clientes:', error);
      return [];
    }
  };


  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  return {
    clientes,
    loading,
    fetchClientes,
    addCliente,
    updateCliente,
    deleteCliente,
    searchClientes
  };

}

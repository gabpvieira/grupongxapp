import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Tarefa } from '@/types/tarefas';

export const useCronometro = (tarefa: Tarefa, refetchTarefa: (id: string) => Promise<void>) => {
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Calcular segundos totais para exibição (sem salvar no banco)
  const calcularTotal = () => {
    let total = tarefa.tempo_rastreado ?? 0;
    if (tarefa.esta_executando && tarefa.inicio_execucao) {
      const iniciado = new Date(tarefa.inicio_execucao).getTime();
      const agora = Date.now();
      total += Math.floor((agora - iniciado) / 1000);
    }
    return total;
  };

  useEffect(() => {
    setDisplaySeconds(calcularTotal());

    if (tarefa.esta_executando) {
      // Limpa intervalo anterior se existir
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(calcularTotal());
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tarefa.esta_executando, tarefa.inicio_execucao, tarefa.tempo_rastreado]);

  const iniciar = async () => {
    try {
      const { error } = await supabase.rpc('iniciar_cronometro', { p_tarefa_id: tarefa.id });
      if (error) throw error;
      // Refetch da tarefa para atualizar inicio_execucao no estado local
      await refetchTarefa(tarefa.id);
    } catch (err) {
      console.error('Erro ao iniciar cronômetro:', err);
    }
  };

  const pausar = async () => {
    try {
      const { error } = await supabase.rpc('pausar_cronometro', { p_tarefa_id: tarefa.id });
      if (error) throw error;
      if (intervalRef.current) clearInterval(intervalRef.current);
      await refetchTarefa(tarefa.id);
    } catch (err) {
      console.error('Erro ao pausar cronômetro:', err);
    }
  };

  const resetar = async () => {
    try {
      const { error } = await supabase.rpc('resetar_cronometro', { p_tarefa_id: tarefa.id });
      if (error) throw error;
      setDisplaySeconds(0);
      await refetchTarefa(tarefa.id);
    } catch (err) {
      console.error('Erro ao resetar cronômetro:', err);
    }
  };

  const formatarTempoCompacto = (segundos: number): string => {
    if (segundos === 0) return '0s';
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  };

  return { displaySeconds, iniciar, pausar, resetar, rodando: tarefa.esta_executando, formatarTempoCompacto };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardData {
  totalVendas: number;
  qtdNegocios: number;
  metaMensal: number;
  ranking: {
    vendedor_id: string;
    nome: string;
    total: number;
    qtd: number;
  }[];
  ultimosLancamentos: {
    id: string;
    cliente: string;
    servico: string;
    valor: number;
    data_fechamento: string;
    vendedor_nome: string;
  }[];
  tarefas: {
    pendentes: number;
    emAndamento: number;
    atrasadas: number;
  };
  evolucao: {
    mes: string;
    valor: number;
  }[];
  percentualMeta: number;
  excedente: number;
  superouMeta: boolean;
  nivel: string | null;
  mensagemFeedback: string | null;
  totalMesAnterior: number;
  variacaoVsMesAnterior: number | null;
  mesAnteriorLabel: string;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const inicioMes = format(startOfMonth(now), 'yyyy-MM-dd');
      const fimMes = format(endOfMonth(now), 'yyyy-MM-dd');
      const inicioMesAnterior = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const fimMesAnterior = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const seisMesesAtras = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd');

      const [
        resVendas,
        resVendasAnterior,
        resConfig,
        resUltimos,
        resTarefas,
        resEvolucao
      ] = await Promise.all([
        // 1. Vendas do mês atual (Total e Ranking)
        supabase
          .from('vendas_completas')
          .select('valor_efetivo, responsavel_id, responsavel_nome, status_pagamento')
          .gte('data_fechamento', inicioMes)
          .lte('data_fechamento', fimMes)
          .neq('status_pagamento', 'cancelado'),

        // 1.1 Vendas do mês anterior
        supabase
          .from('vendas_completas')
          .select('valor_efetivo')
          .gte('data_fechamento', inicioMesAnterior)
          .lte('data_fechamento', fimMesAnterior)
          .neq('status_pagamento', 'cancelado'),

        // 2. Meta específica do mês atual via RPC (Fallback automático p/ global no SQL)
        supabase.rpc('get_meta_mes', { 
          p_ano: now.getFullYear(), 
          p_mes: now.getMonth() + 1 
        }),

        // 3. Últimos 5 lançamentos (Alinhado com mês atual e data de fechamento)
        supabase
          .from('vendas_completas')
          .select('id, cliente, servico, valor_efetivo, data_fechamento, responsavel_nome')
          .gte('data_fechamento', inicioMes)
          .lte('data_fechamento', fimMes)
          .neq('status_pagamento', 'cancelado')
          .order('data_fechamento', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5),

        // 4. Tarefas pendentes
        supabase
          .from('tarefas')
          .select('status, data_vencimento')
          .in('status', ['pendente', 'em_andamento']),

        // 5. Evolução mensal (últimos 6 meses)
        supabase
          .from('vendas_completas')
          .select('valor_efetivo, data_fechamento')
          .gte('data_fechamento', seisMesesAtras)
          .neq('status_pagamento', 'cancelado')
      ]);

      if (resVendas.error) throw resVendas.error;
      if (resVendasAnterior.error) throw resVendasAnterior.error;
      if (resUltimos.error) throw resUltimos.error;
      if (resTarefas.error) throw resTarefas.error;
      if (resEvolucao.error) throw resEvolucao.error;

      // Processar ranking e totais
      const vendasAtuais = (resVendas.data || []) as any[];
      const totalVendas = vendasAtuais.reduce((acc, v) => acc + Number(v.valor_efetivo || 0), 0);
      
      const rankingMap = new Map<string, { nome: string; total: number; qtd: number }>();
      vendasAtuais.forEach(v => {
        const vendedorNome = v.responsavel_nome || 'Desconhecido';
        const current = rankingMap.get(v.responsavel_id) || { nome: vendedorNome, total: 0, qtd: 0 };
        current.total += Number(v.valor_efetivo || 0);
        current.qtd += 1;
        rankingMap.set(v.responsavel_id, current);
      });

      const ranking = Array.from(rankingMap.entries())
        .map(([id, stats]) => ({
          vendedor_id: id,
          ...stats
        }))
        .sort((a, b) => b.total - a.total);

      // Processar tarefas
      const todasTarefas = resTarefas.data || [];
      const hoje = new Date();
      const tarefasAtrasadas = todasTarefas.filter(t => 
        t.data_vencimento && new Date(t.data_vencimento) < hoje
      ).length;

      // Processar evolução mensal
      const vendasEvolucao = resEvolucao.data || [];
      const evolucaoMap = new Map<string, number>();
      
      // Inicializar últimos 6 meses com zero
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, 'yyyy-MM');
        evolucaoMap.set(key, 0);
      }

      vendasEvolucao.forEach(v => {
        const key = v.data_fechamento.substring(0, 7); // yyyy-MM
        if (evolucaoMap.has(key)) {
          evolucaoMap.set(key, (evolucaoMap.get(key) || 0) + Number((v as any).valor_efetivo || 0));
        }
      });

      const evolucao = Array.from(evolucaoMap.entries()).map(([mes, valor]) => {
        const d = new Date(mes + '-02');
        return {
          mes: format(d, 'MMM', { locale: ptBR }),
          valor
        };
      });

      // 6. Comparação com mês anterior
      const totalMesAnterior = (resVendasAnterior.data || []).reduce((acc, v) => acc + Number(v.valor_efetivo || 0), 0);
      const variacaoVsMesAnterior = totalMesAnterior > 0 
        ? ((totalVendas - totalMesAnterior) / totalMesAnterior) * 100 
        : null;
      const mesAnteriorLabel = format(subMonths(now, 1), 'MMMM', { locale: ptBR });

      // 7. Lógica de Gamificação e Feedback
      const metaMensal = Number(resConfig.data || 2500);
      const percentualMeta = (totalVendas / metaMensal) * 100;
      const excedente = totalVendas - metaMensal;
      const superouMeta = percentualMeta >= 100;
      
      let nivel = null;
      let mensagemFeedback = null;

      if (superouMeta) {
        if (percentualMeta >= 300) nivel = 'Lendário';
        else if (percentualMeta >= 200) nivel = 'Extraordinário';
        else if (percentualMeta >= 150) nivel = 'Excelente';
        else if (percentualMeta >= 120) nivel = 'Acima do Esperado';
        else nivel = 'Meta Batida';

        const feedbacks: Record<string, string[]> = {
          'Meta Batida':          ['Meta cumprida. Sólido.', 'Entregou o que foi prometido.', 'Resultado garantido.'],
          'Acima do Esperado':    ['Acima do planejado. Bom trabalho.', 'Superou as expectativas do mês.', 'Ritmo consistente.'],
          'Excelente':            ['Mês forte. Mantém?', 'Quase o dobro da meta.', 'Esse é o padrão que queremos.'],
          'Extraordinário':       ['Dobrou a meta. Histórico.', 'Número que poucos atingem.', 'Mês que entra no hall.'],
          'Lendário':             ['3x a meta. Isso é outro nível.', 'Número absurdo. Bem absurdo.', 'Lendário não é exagero aqui.'],
        };

        const monthIdx = now.getMonth();
        const feedbackOptions = feedbacks[nivel];
        mensagemFeedback = feedbackOptions[monthIdx % feedbackOptions.length];
      }

      setData({
        totalVendas,
        qtdNegocios: vendasAtuais.length,
        metaMensal,
        percentualMeta,
        excedente,
        superouMeta,
        nivel,
        mensagemFeedback,
        ranking,
        ultimosLancamentos: (resUltimos.data || []).map(v => ({
          id: v.id,
          cliente: v.cliente,
          servico: v.servico,
          valor: Number((v as any).valor_efetivo || 0),
          data_fechamento: v.data_fechamento,
          vendedor_nome: (v as any).responsavel_nome || 'Desconhecido'
        })),
        tarefas: {
          pendentes: todasTarefas.filter(t => t.status === 'pendente').length,
          emAndamento: todasTarefas.filter(t => t.status === 'em_andamento').length,
          atrasadas: tarefasAtrasadas
        },
        evolucao,
        totalMesAnterior,
        variacaoVsMesAnterior,
        mesAnteriorLabel
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Falha ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

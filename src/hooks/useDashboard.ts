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
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const inicioMes = startOfMonth(now).toISOString();
      const fimMes = endOfMonth(now).toISOString();
      const seisMesesAtras = startOfMonth(subMonths(now, 5)).toISOString();

      const [
        resVendas,
        resConfig,
        resUltimos,
        resTarefas,
        resEvolucao
      ] = await Promise.all([
        // 1. Vendas do mês atual (Total e Ranking)
        supabase
          .from('vendas')
          .select('valor, responsavel_id, vendedores(nome)')
          .gte('data_fechamento', inicioMes)
          .lte('data_fechamento', fimMes),

        // 2. Meta mensal das configurações
        supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'meta_mensal')
          .maybeSingle(),

        // 3. Últimos 5 lançamentos
        supabase
          .from('vendas')
          .select('id, cliente, servico, valor, data_fechamento, vendedores(nome)')
          .order('created_at', { ascending: false })
          .limit(5),

        // 4. Tarefas pendentes
        supabase
          .from('tarefas')
          .select('status, data_vencimento')
          .in('status', ['pendente', 'em_andamento']),

        // 5. Evolução mensal (últimos 6 meses)
        supabase
          .from('vendas')
          .select('valor, data_fechamento')
          .gte('data_fechamento', seisMesesAtras)
      ]);

      if (resVendas.error) throw resVendas.error;
      if (resUltimos.error) throw resUltimos.error;
      if (resTarefas.error) throw resTarefas.error;
      if (resEvolucao.error) throw resEvolucao.error;

      // Processar ranking e totais
      const vendasAtuais = resVendas.data || [];
      const totalVendas = vendasAtuais.reduce((acc, v) => acc + v.valor, 0);
      
      const rankingMap = new Map<string, { nome: string; total: number; qtd: number }>();
      vendasAtuais.forEach(v => {
        const vendedorNome = (v.vendedores as any)?.nome || 'Desconhecido';
        const current = rankingMap.get(v.responsavel_id) || { nome: vendedorNome, total: 0, qtd: 0 };
        current.total += v.valor;
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
          evolucaoMap.set(key, (evolucaoMap.get(key) || 0) + v.valor);
        }
      });

      const evolucao = Array.from(evolucaoMap.entries()).map(([mes, valor]) => {
        const d = new Date(mes + '-02');
        return {
          mes: format(d, 'MMM', { locale: ptBR }),
          valor
        };
      });

      setData({
        totalVendas,
        qtdNegocios: vendasAtuais.length,
        metaMensal: Number(resConfig.data?.valor || 2500),
        ranking,
        ultimosLancamentos: (resUltimos.data || []).map(v => ({
          id: v.id,
          cliente: v.cliente,
          servico: v.servico,
          valor: v.valor,
          data_fechamento: v.data_fechamento,
          vendedor_nome: (v.vendedores as any)?.nome || 'Desconhecido'
        })),
        tarefas: {
          pendentes: todasTarefas.filter(t => t.status === 'pendente').length,
          emAndamento: todasTarefas.filter(t => t.status === 'em_andamento').length,
          atrasadas: tarefasAtrasadas
        },
        evolucao
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

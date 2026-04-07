import { useDashboard } from "@/hooks/useDashboard";
import { CircularGauge } from "@/components/CircularGauge";
import KpiCard from "@/components/dashboard/KpiCard";
import RankingVendedores from "@/components/dashboard/RankingVendedores";
import UltimosLancamentos from "@/components/dashboard/UltimosLancamentos";
import TarefasResumo from "@/components/dashboard/TarefasResumo";
import EvolucaoMensal from "@/components/dashboard/EvolucaoMensal";
import { 
  DollarSign, 
  Briefcase, 
  Target, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Flame,
  Trophy
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';

const Dashboard = () => {
  const { data, loading, error } = useDashboard();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#a3e635] animate-spin" />
        <p className="text-white/40  animate-pulse uppercase tracking-[0.3em] text-xs">
          Carregando indicadores...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <h2 className="text-white text-xl font-bold">Oops! Algo deu errado</h2>
        <p className="text-white/40 max-w-md">{error || "Não conseguimos carregar os dados do painel."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all text-sm font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const percentMeta = Math.min((data.totalVendas / data.metaMensal) * 100, 100);
  const currentMonthName = format(new Date(), 'MMMM', { locale: ptBR });

  return (
    <PageLayout>
      <PageHeader
        icon={<Target size={18} className="text-[#a3e635]" />}
        title="Dashboard"
        subtitle={`Resultados de ${currentMonthName}`}
      />

      <div className="p-6 space-y-8">
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Metrics & Main Gauge */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <KpiCard 
                title="Total em Vendas" 
                value={formatCurrency(data.totalVendas)}
                icon={DollarSign}
                description="Acumulado do mês"
              />
              <KpiCard 
                title="Negócios Fechados" 
                value={data.qtdNegocios}
                icon={Briefcase}
                description="Contratos ativos"
              />
              
              {/* Card de Meta Simplificado */}
              <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#a3e635]/20 transition-all">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Progresso da Meta</p>
                  <Target size={14} className={data.superouMeta ? "text-[#a3e635]" : "text-white/20"} />
                </div>

                <div className="flex flex-col gap-1 mt-auto">
                  <p className={`text-2xl font-bold tracking-tight transition-colors ${data.superouMeta ? 'text-white' : 'text-white/60'}`}>
                    {data.percentualMeta.toFixed(1)}%
                  </p>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    Meta: {formatCurrency(data.metaMensal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0d0d0d] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-between min-h-[420px]">
                
                {data.percentualMeta >= 100 && (
                  <div className="w-full mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-fit ${
                      data.nivel === 'Lendário' ? 'bg-purple-400/10 border-purple-400/20 text-purple-400' :
                      data.nivel === 'Extraordinário' ? 'bg-orange-400/10 border-orange-400/20 text-orange-400' :
                      data.nivel === 'Excelente' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                      data.nivel === 'Acima do Esperado' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
                      'bg-lime-400/10 border-lime-400/20 text-lime-400'
                    }`}>
                      {data.nivel === 'Lendário' && <Trophy size={12} />}
                      {data.nivel === 'Extraordinário' && <Flame size={12} />}
                      {data.nivel === 'Excelente' && <Zap size={12} />}
                      {data.nivel === 'Acima do Esperado' && <TrendingUp size={12} />}
                      {data.nivel === 'Meta Batida' && <CheckCircle2 size={12} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{data.nivel}</span>
                    </div>
                    <span className="text-[#a3e635] text-xs font-bold tabular-nums">
                      +{formatCurrency(data.excedente)} acima
                    </span>
                  </div>
                )}

                <CircularGauge 
                  value={data.totalVendas} 
                  max={data.metaMensal} 
                  label="Vendas vs Meta" 
                >
                  {data.variacaoVsMesAnterior !== null && (
                    <div className={`
                      flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest
                      px-2 py-1 rounded-full border
                      ${data.variacaoVsMesAnterior >= 0
                        ? 'bg-lime-400/10 border-lime-400/20 text-lime-400'
                        : 'bg-rose-400/10 border-rose-400/20 text-rose-400'
                      }
                    `}>
                      {data.variacaoVsMesAnterior >= 0
                        ? <TrendingUp size={10} className="shrink-0" />
                        : <TrendingDown size={10} className="shrink-0" />
                      }
                      <span className="tabular-nums">
                        {data.variacaoVsMesAnterior >= 0 ? '+' : ''}
                        {data.variacaoVsMesAnterior.toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        })}% vs {data.mesAnteriorLabel}
                      </span>
                    </div>
                  )}
                </CircularGauge>

                <div className="text-center mt-4">
                  <p className="text-5xl font-extrabold text-[#a3e635] tracking-tighter">
                    {formatCurrency(data.totalVendas)}
                  </p>
                  <p className="text-xs font-bold text-white/20 uppercase tracking-[0.3em] mt-2">
                    Total em Vendas
                  </p>
                </div>

                {data.percentualMeta >= 100 && (
                  <div className="w-full mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 italic text-center">"{data.mensagemFeedback}"</p>
                  </div>
                )}
              </div>

              <EvolucaoMensal 
                data={data.evolucao} 
                meta={data.metaMensal} 
              />
            </div>

            {/* Bottom Row: Latest Transactions */}
            <UltimosLancamentos lancamentos={data.ultimosLancamentos} />
          </div>

          {/* Right Column: Ranking & Tasks */}
          <div className="lg:col-span-4 space-y-6">
            <RankingVendedores ranking={data.ranking} />
            <TarefasResumo tarefas={data.tarefas} />
            
            {/* Quick Actions / Status Footer */}
            <div className="bg-[#a3e635]/5 border border-[#a3e635]/10 rounded-xl p-6">
              <p className="text-[#a3e635] text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                Sistemas Grupo NGX
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-white/60 text-xs font-bold">Banco de Dados</p>
                  <p className="text-[#a3e635] text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
                    Operacional
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-white/60 text-xs font-bold">Sessão</p>
                  <p className="text-[#a3e635] text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                    Protegida
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;


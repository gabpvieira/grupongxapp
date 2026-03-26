import React, { useState } from 'react';
import { useMetricas } from '@/hooks/useMetricas';
import ScoreHeader from '@/components/metricas/ScoreHeader';
import KpiResumo from '@/components/metricas/KpiResumo';
import MetricaCard from '@/components/metricas/MetricaCard';
import HistoricoDrawer from '@/components/metricas/HistoricoDrawer';
import { Loader2, Info, CheckCircle2, AlertCircle, BarChart2, History } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';

const Metricas: React.FC = () => {
  const {
    semana,
    semanaAnterior,
    historico,
    loading,
    saving,
    inicioSemana,
    fimSemana,
    navegarSemana,
    selecionarSemana,
    atualizarMetrica,
    atualizarObservacao,
    salvarNotaMetrica
  } = useMetricas();

  const [historyOpen, setHistoryOpen] = useState(false);

  if (loading && !semana) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-[#a3e635] animate-spin" />
        <p className="text-white/40 text-sm animate-pulse font-light tracking-widest uppercase">Carregando métricas...</p>
      </div>
    );
  }

  if (!semana) return null;

  return (
    <PageLayout>
      <PageHeader
        icon={<BarChart2 size={18} className="text-[#a3e635]" />}
        title="Métricas da Semana"
        subtitle="Acompanhe suas metas e performance semanal"
        action={
          <button onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl
              bg-white/5 border border-white/8 text-white/50 text-xs font-medium
              hover:border-white/15 hover:text-white/70 transition-all"
          >
            <History size={13} /> Ver Histórico
          </button>
        }
      />

      <div className="p-6 space-y-8 animate-in fade-in duration-700">
        {/* Indicador de Salvamento Flutuante */}
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-300 ${saving !== 'idle' ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          {saving === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 text-[#a3e635] animate-spin" />
              <span className="text-xs text-white/60 font-medium">Salvando alterações...</span>
            </>
          )}
          {saving === 'saved' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
              <span className="text-xs text-white/60 font-medium">Alterações salvas</span>
            </>
          )}
          {saving === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500 font-medium">Erro ao salvar</span>
            </>
          )}
        </div>

        {/* Header com Score e Navegação */}
        <ScoreHeader 
          inicio={inicioSemana}
          fim={fimSemana}
          score={semana.score_percentual}
          onAnterior={() => navegarSemana('anterior')}
          onProxima={() => navegarSemana('proxima')}
          onOpenHistory={() => setHistoryOpen(true)}
        />

        {/* Resumo KPIs */}
        <KpiResumo semana={semana} />

        {/* Grade de Métricas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {semana.metricas.map((metrica) => (
            <MetricaCard 
              key={metrica.id}
              metrica={metrica}
              onUpdate={atualizarMetrica}
              onSaveNota={salvarNotaMetrica}
            />
          ))}
        </div>

        {/* Observação Geral */}
        <div className="bg-[#0d0d0d] border border-white/5 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-white/60">
            <Info className="w-4 h-4" />
            <h3 className="text-sm font-medium">Contexto da semana</h3>
          </div>
          <div className="relative">
            <textarea 
              value={semana.observacao_geral || ''}
              onChange={(e) => atualizarObservacao(e.target.value)}
              placeholder="O que aconteceu nesta semana? Destaques, impedimentos or aprendizados..."
              maxLength={1000}
              className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm text-white/80 placeholder:text-white/10 focus:outline-none focus:border-[#a3e635]/30 min-h-[120px] resize-none"
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/20">
              {(semana.observacao_geral || '').length}/1000
            </div>
          </div>
        </div>

        {/* Histórico Drawer */}
        <HistoricoDrawer 
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          historico={historico}
          onSelectSemana={selecionarSemana}
          semanaAtualId={semana.id}
        />
      </div>
    </PageLayout>
  );
};

export default Metricas;

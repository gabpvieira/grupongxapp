// src/pages/Crm.tsx
import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Users, Plus, TrendingUp, DollarSign, CheckCircle2, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import { useCrm } from '@/hooks/useCrm';
import { ETAPAS, Lead, EtapaLead } from '@/types/crm';
import { CrmColuna } from '@/components/crm/CrmColuna';
import { LeadDrawer } from '@/components/crm/LeadDrawer';
import { NovoLeadModal } from '@/components/crm/NovoLeadModal';

export default function Crm() {
  const { leads, loading, fetchLeads } = useCrm();
  const [showLost, setShowLost] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialEtapaModal, setInitialEtapaModal] = useState<EtapaLead | undefined>();

  // Agrupar leads por etapa
  const leadsPorEtapa = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    ETAPAS.forEach(e => { groups[e.id] = []; });
    leads.forEach(lead => {
      if (groups[lead.etapa]) {
        groups[lead.etapa].push(lead);
      }
    });
    return groups;
  }, [leads]);

  // KPIs
  const kpis = useMemo(() => {
    const total = leads.length;
    const emNegociacao = leads.filter(l => l.etapa === 'negociacao').length;
    const fechados = leads.filter(l => l.etapa === 'fechado').length;
    const valorTotal = leads.reduce((acc, l) => acc + (l.valor_estimado || 0), 0);

    return [
      { label: 'Total de Leads',    valor: total,        icon: Users,      cor: 'white'    },
      { label: 'Em Negociação',     valor: emNegociacao, icon: TrendingUp, cor: '#f97316'  },
      { label: 'Fechados no Mês',   valor: fechados,     icon: CheckCircle2, cor: '#a3e635' },
      { label: 'Valor em Pipeline', valor: Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal), icon: DollarSign, cor: '#a3e635' },
    ];
  }, [leads]);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleQuickAdd = (etapaId: EtapaLead) => {
    setInitialEtapaModal(etapaId);
    setIsModalOpen(true);
  };

  const toggleShowLost = () => {
    const newValue = !showLost;
    setShowLost(newValue);
    fetchLeads(newValue);
  };

  return (
    <PageLayout className="bg-[#000]">
      <PageHeader
        icon={<Users size={18} />}
        title="Leads & Clientes"
        subtitle="Gerencie seu funil de vendas e oportunidades"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={toggleShowLost}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider
                ${showLost 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' 
                  : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
            >
              {showLost ? <EyeOff size={14} /> : <Eye size={14} />}
              {showLost ? 'Ocultar Perdidos' : 'Ver Perdidos'}
            </button>
            <button 
              onClick={() => { setInitialEtapaModal(undefined); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-[#a3e635] hover:opacity-90 text-black font-bold text-sm
                transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)] active:scale-[0.98]"
            >
              <Plus size={15} strokeWidth={2.5} /> Novo Lead
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-8 px-6 pb-12">
        {/* KPIs Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-[#0d0d0d] border border-white/5 p-5 rounded-2xl flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5"
                style={{ color: kpi.cor }}
              >
                <kpi.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{kpi.label}</p>
                <p className="text-xl font-bold text-white mt-0.5 tabular-nums" style={{ color: kpi.cor === 'white' ? 'inherit' : kpi.cor }}>
                  {kpi.valor}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="relative">
          {loading && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin" />
              <p className="text-white/20 text-sm font-medium animate-pulse uppercase tracking-widest">Carregando pipeline...</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {ETAPAS.map(etapa => (
                <CrmColuna 
                  key={etapa.id} 
                  etapa={etapa} 
                  leads={leadsPorEtapa[etapa.id]} 
                  onLeadClick={handleLeadClick}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals & Drawers */}
      <LeadDrawer
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={() => fetchLeads(showLost)}
      />

      <NovoLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialEtapa={initialEtapaModal}
      />
    </PageLayout>
  );
}

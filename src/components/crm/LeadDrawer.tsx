// src/components/crm/LeadDrawer.tsx
import React, { useState, useEffect } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Users, 
  Mail, 
  Phone, 
  Building2, 
  Target, 
  User, 
  Calendar,
  MessageSquare,
  History,
  Trash2,
  X
} from 'lucide-react';
import { ETAPAS, Lead, Atividade, EtapaLead } from '@/types/crm';
import { useCrm } from '@/hooks/useCrm';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BadgeOrigem } from './BadgeOrigem';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const LeadDrawer = ({ lead, isOpen, onClose, onUpdate }: LeadDrawerProps) => {
  const { moverEtapa, registrarAtividade, fetchAtividades } = useCrm();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [tipoAtividade, setTipoAtividade] = useState('nota');
  const [descAtividade, setDescAtividade] = useState('');
  const [loadingAtividades, setLoadingAtividades] = useState(false);

  useEffect(() => {
    if (lead && isOpen) {
      loadAtividades();
    }
  }, [lead, isOpen]);

  const loadAtividades = async () => {
    if (!lead) return;
    setLoadingAtividades(true);
    const data = await fetchAtividades(lead.id);
    setAtividades(data);
    setLoadingAtividades(false);
  };

  const handleMoverEtapa = async (novaEtapa: EtapaLead) => {
    if (!lead) return;
    await moverEtapa(lead.id, novaEtapa, lead.responsavel_id || undefined);
    onUpdate();
  };

  const handleRegistrarAtividade = async () => {
    if (!lead || !descAtividade.trim()) return;
    
    const success = await registrarAtividade({
      lead_id: lead.id,
      tipo: tipoAtividade as any,
      descricao: descAtividade,
      responsavel_id: lead.responsavel_id
    });

    if (success) {
      setDescAtividade('');
      loadAtividades();
      onUpdate();
    }
  };

  const etapaIndex = (id: string) => ETAPAS.findIndex(e => e.id === id);
  const currentEtapaIdx = lead ? etapaIndex(lead.etapa) : -1;

  if (!lead) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#000] border-white/5 p-0 overflow-y-auto">
        {/* Header Custom */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-white">{lead.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/40 text-xs flex items-center gap-1">
                  <Building2 size={12} /> {lead.empresa || 'Sem empresa'}
                </span>
                <span className="text-white/10">•</span>
                <BadgeOrigem origem={lead.origem} />
              </div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Fluxo do Pipeline</span>
              <span className="text-[10px] font-bold text-[#a3e635] uppercase tracking-widest">
                {ETAPAS[currentEtapaIdx]?.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {ETAPAS.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => handleMoverEtapa(e.id)}
                  disabled={lead.etapa === e.id}
                  className={`flex-1 h-1.5 rounded-full transition-all relative group
                    ${lead.etapa === e.id
                      ? 'opacity-100 shadow-[0_0_8px_rgba(163,230,53,0.3)]'
                      : currentEtapaIdx > i
                      ? 'opacity-60 hover:opacity-80'
                      : 'opacity-15 hover:opacity-30'
                    }`}
                  style={{ backgroundColor: e.cor }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                    <div className="bg-[#111] text-white text-[10px] py-1 px-2 rounded border border-white/10 whitespace-nowrap">
                      {e.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Informações */}
          <section>
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={14} /> Informações de Contato
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                  <Mail size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase">E-mail</p>
                  <p className="text-sm text-white/70">{lead.email || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase">Telefone</p>
                  <p className="text-sm text-white/70">{lead.telefone || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#a3e635]">
                  <span className="text-xs font-bold">$</span>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase">Valor Estimado</p>
                  <p className="text-sm text-[#a3e635] font-bold">
                    {lead.valor_estimado 
                      ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_estimado)
                      : 'R$ 0,00'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-[10px] text-white/30 font-bold uppercase">Responsável</p>
                  <p className="text-sm text-white/70">{lead.responsavel_nome || 'Sem responsável'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Registrar Atividade */}
          <section className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
              <MessageSquare size={14} /> Registrar Atividade
            </h3>
            <div className="flex flex-col gap-3">
              <FilterSelect
                value={tipoAtividade}
                onChange={setTipoAtividade}
                options={[
                  { value: 'nota',     label: '📝 Nota'     },
                  { value: 'ligacao',  label: '📞 Ligação'  },
                  { value: 'email',    label: '✉️ E-mail'   },
                  { value: 'reuniao',  label: '🤝 Reunião'  },
                  { value: 'whatsapp', label: '💬 WhatsApp' },
                ]}
                className="w-full"
              />
              <textarea
                value={descAtividade}
                onChange={e => setDescAtividade(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                rows={3}
                className="w-full bg-black/50 border-none rounded-xl px-4 py-3
                  text-white/70 text-sm placeholder:text-white/20 resize-none
                  focus:outline-none focus:ring-1 focus:ring-[#a3e635]/20"
              />
              <button
                onClick={handleRegistrarAtividade}
                disabled={!descAtividade.trim()}
                className="w-full h-10 rounded-xl bg-[#a3e635] text-black text-sm font-bold
                  hover:bg-[#84cc16] transition-all disabled:opacity-30 active:scale-[0.98]"
              >
                Salvar Atividade
              </button>
            </div>
          </section>

          {/* Histórico */}
          <section>
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><History size={14} /> Histórico de Atividades</div>
              <span className="text-[10px] font-medium">{atividades.length} entries</span>
            </h3>
            
            <div className="space-y-4">
              {loadingAtividades ? (
                <div className="py-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin" />
                </div>
              ) : atividades.length === 0 ? (
                <p className="text-center py-8 text-white/20 text-xs italic">Nenhuma atividade registrada ainda.</p>
              ) : (
                atividades.map((atv) => (
                  <div key={atv.id} className="relative pl-6 pb-4 border-l border-white/5 last:pb-0">
                    <div className={`absolute left-[-4.5px] top-0 w-2 h-2 rounded-full border border-black
                      ${atv.tipo === 'etapa_alterada' ? 'bg-[#a3e635]' : 'bg-white/20'}`} />
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-white/30 uppercase">
                        {atv.tipo.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-white/20">
                        {format(new Date(atv.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {atv.descricao}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="pt-6 border-t border-white/5">
            <button 
              onClick={() => handleMoverEtapa('perdido')}
              className="flex items-center gap-2 text-red-500/50 hover:text-red-500 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Trash2 size={14} /> Mover para Perdido
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// src/components/crm/NovoLeadModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, User, Building2, Mail, Phone, Target, Wallet } from 'lucide-react';
import { ETAPAS, Lead, EtapaLead, OrigemLead } from '@/types/crm';
import { useCrm } from '@/hooks/useCrm';
import { useVendedores } from '@/hooks/useVendedores';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { formatCurrency, parseCurrency } from '@/lib/utils';

interface NovoLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEtapa?: EtapaLead;
}

export const NovoLeadModal = ({ isOpen, onClose, initialEtapa }: NovoLeadModalProps) => {
  const { criarLead } = useCrm();
  const { vendedores } = useVendedores();
  
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    email: '',
    telefone: '',
    valor_estimado: '',
    origem: 'manual' as OrigemLead,
    etapa: initialEtapa || 'novo_lead' as EtapaLead,
    responsavel_id: '',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);

  const ORIGENS: { value: OrigemLead; label: string }[] = [
    { value: 'manual',     label: 'Manual'     },
    { value: 'formulario', label: 'Formulário' },
    { value: 'whatsapp',   label: 'WhatsApp'   },
    { value: 'indicacao',  label: 'Indicação'  },
    { value: 'outro',      label: 'Outro'      },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) return;

    setLoading(true);
    const success = await criarLead({
      ...formData,
      valor_estimado: formData.valor_estimado ? parseCurrency(formData.valor_estimado) : null,
      responsavel_id: formData.responsavel_id || null
    });

    if (success) {
      onClose();
      setFormData({
        nome: '',
        empresa: '',
        email: '',
        telefone: '',
        valor_estimado: '',
        origem: 'manual',
        etapa: 'novo_lead',
        responsavel_id: '',
        observacoes: ''
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/5 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
              <Plus size={18} strokeWidth={3} />
            </div>
            Novo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-6">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Nome do Lead *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  required
                  value={formData.nome}
                  onChange={e => setFormData({...formData, nome: e.target.value})}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Empresa</label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={formData.empresa}
                  onChange={e => setFormData({...formData, empresa: e.target.value})}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="Nome da empresa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Telefone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    value={formData.telefone}
                    onChange={e => setFormData({...formData, telefone: e.target.value})}
                    className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Valor Estimado</label>
                <div className="relative">
                  <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={formData.valor_estimado}
                    onChange={e => setFormData({...formData, valor_estimado: formatCurrency(e.target.value)})}
                    className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Origem</label>
                <FilterSelect
                  value={formData.origem}
                  onChange={v => setFormData({...formData, origem: v as OrigemLead})}
                  options={ORIGENS}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Responsável</label>
              <FilterSelect
                value={formData.responsavel_id}
                onChange={v => setFormData({...formData, responsavel_id: v})}
                options={[
                  { value: '', label: 'Sem responsável' },
                  ...vendedores.map(v => ({ value: v.id, label: v.nome }))
                ]}
                placeholder="Selecione um vendedor"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Etapa Inicial</label>
              <FilterSelect
                value={formData.etapa}
                onChange={v => setFormData({...formData, etapa: v as EtapaLead})}
                options={ETAPAS.map(e => ({ value: e.id, label: e.label }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={e => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all resize-none"
              placeholder="Notas internas sobre o lead..."
            />
          </div>

          <DialogFooter className="col-span-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-xl text-white/40 text-sm font-bold hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !formData.nome}
              className="h-11 px-8 rounded-xl bg-[#a3e635] text-black text-sm font-bold
                hover:bg-[#84cc16] transition-all disabled:opacity-30 active:scale-[0.98]
                shadow-[0_0_20px_rgba(163,230,53,0.1)]"
            >
              {loading ? 'Criando...' : 'Criar Lead'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

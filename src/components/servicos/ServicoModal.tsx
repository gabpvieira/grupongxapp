// src/components/servicos/ServicoModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Briefcase, X, Tag, DollarSign, Repeat, Info, Plus, Save } from 'lucide-react';
import type { Servico, Periodicidade, ServicoFormPayload } from '@/types/servicos';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { formatCurrency, parseCurrency } from '@/lib/utils';

interface ServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ServicoFormPayload) => Promise<boolean>;
  servicoParaEditar?: Servico | null;
  categoriasExistentes: string[];
}

interface ServicoFormState {
  nome: string;
  descricao: string | null;
  categoria: string;
  preco: string;
  recorrente: boolean;
  periodicidade: Periodicidade | null;
  ativo: boolean;
}

export const ServicoModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  servicoParaEditar, 
  categoriasExistentes 
}: ServicoModalProps) => {
  const [formData, setFormData] = useState<ServicoFormState>({
    nome: '',
    descricao: '',
    categoria: '',
    preco: 'R$ 0,00',
    recorrente: false,
    periodicidade: null,
    ativo: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (servicoParaEditar) {
      setFormData({
        nome: servicoParaEditar.nome,
        descricao: servicoParaEditar.descricao || '',
        categoria: servicoParaEditar.categoria,
        preco: formatCurrency(servicoParaEditar.preco),
        recorrente: servicoParaEditar.recorrente,
        periodicidade: servicoParaEditar.periodicidade,
        ativo: servicoParaEditar.ativo
      });
    } else {
      setFormData({
        nome: '',
        descricao: '',
        categoria: '',
        preco: 'R$ 0,00',
        recorrente: false,
        periodicidade: null,
        ativo: true
      });
    }
  }, [servicoParaEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.categoria) return;

    setLoading(true);
    // Ensure periodicidade is null if not recurrent
    const payload: ServicoFormPayload = {
      nome: formData.nome,
      descricao: formData.descricao,
      categoria: formData.categoria,
      preco: parseCurrency(formData.preco),
      recorrente: formData.recorrente,
      periodicidade: formData.recorrente ? formData.periodicidade : null,
      ativo: formData.ativo
    };
    
    const success = await onSubmit(payload);
    if (success) {
      onClose();
    }
    setLoading(false);
  };

  const periodicidades: { value: Periodicidade; label: string }[] = [
    { value: 'mensal',     label: 'Mensal'     },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral',  label: 'Semestral'  },
    { value: 'anual',      label: 'Anual'      },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-[#0a0a0a] border-white/5 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
              {servicoParaEditar ? <Save size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={3} />}
            </div>
            {servicoParaEditar ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Nome do Serviço *</label>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                required
                maxLength={200}
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                placeholder="Ex: Consultoria em Marketing"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Categoria *</label>
            <div className="relative">
              <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                list="categorias-list"
                required
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value})}
                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                placeholder="Marketing, Design, TI..."
              />
              <datalist id="categorias-list">
                {categoriasExistentes.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          {/* Preço e Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Preço (R$) *</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-xs font-bold pointer-events-none">R$</div>
                <input
                  required
                  type="text"
                  value={formData.preco}
                  onChange={e => setFormData({...formData, preco: formatCurrency(e.target.value)})}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Status</label>
              <div className="flex items-center gap-3 h-11 px-4 bg-white/5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={e => setFormData({...formData, ativo: e.target.checked})}
                  className="w-4 h-4 rounded bg-black/50 border-white/10 text-[#a3e635] focus:ring-[#a3e635]/20"
                />
                <label htmlFor="ativo" className="text-sm text-white/60 cursor-pointer">
                  Disponível para venda
                </label>
              </div>
            </div>
          </div>

          {/* Recorrência */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 h-11 px-4 bg-white/5 rounded-xl border border-white/5">
              <input
                type="checkbox"
                id="recorrente"
                checked={formData.recorrente}
                onChange={e => setFormData({...formData, recorrente: e.target.checked})}
                className="w-4 h-4 rounded bg-black/50 border-white/10 text-[#a3e635] focus:ring-[#a3e635]/20"
              />
              <label htmlFor="recorrente" className="text-sm text-white/60 flex items-center gap-2 cursor-pointer">
                Serviço recorrente (Assinatura)
              </label>
            </div>

            {formData.recorrente && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Periodicidade</label>
                <FilterSelect
                  value={formData.periodicidade || ''}
                  onChange={v => setFormData({...formData, periodicidade: v as Periodicidade})}
                  options={periodicidades}
                  placeholder="Selecione a periodicidade"
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Descrição (opcional)</label>
            <textarea
              maxLength={1000}
              value={formData.descricao || ''}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              rows={3}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all resize-none"
              placeholder="Descreva detalhes do serviço..."
            />
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-xl text-white/40 text-sm font-bold hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading || !formData.nome || !formData.categoria}
              className="h-11 px-8 rounded-xl bg-[#a3e635] text-black text-[13px] font-black uppercase tracking-wider
                hover:bg-[#84cc16] transition-all disabled:opacity-30 active:scale-[0.98]
                shadow-[0_0_20px_rgba(163,230,53,0.1)]"
            >
              {loading ? 'Salvando...' : (servicoParaEditar ? 'Atualizar Serviço' : 'Criar Serviço')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// src/components/ClienteModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  Globe, 
  MapPin, 
  Calendar,
  X,
  FileText,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Cliente, TipoDocumento, StatusCliente, ClienteInsert, ClienteUpdate } from '@/types/clientes';
import { maskCPF, maskCNPJ, maskPhone, unmask } from '@/lib/masks';
import { useVendedores } from '@/hooks/useVendedores';
import { FilterSelect } from '@/components/ui/FilterSelect';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
  onSave: (data: any) => Promise<any>;
}

const SEGMENTOS = [
  { value: 'Barbearia', label: 'Barbearia' },
  { value: 'Restaurante', label: 'Restaurante' },
  { value: 'Automotivo', label: 'Automotivo' },
  { value: 'Varejo', label: 'Varejo' },
  { value: 'Estética', label: 'Estética' },
  { value: 'Saúde', label: 'Saúde' },
  { value: 'Outro', label: 'Outro' },
];

const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'churned', label: 'Churned' },
];

export const ClienteModal = ({ isOpen, onClose, cliente, onSave }: ClienteModalProps) => {
  const isMobile = useIsMobile();
  const { vendedores } = useVendedores();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    tipo_documento: 'cpf' as TipoDocumento,
    documento: '',
    telefone: '',
    email: '',
    instagram: '',
    site: '',
    segmento: '',
    data_inicio: '',
    cidade: '',
    estado: '',
    responsavel_id: '',
    status: 'ativo' as StatusCliente,
    informacoes_adicionais: ''
  });

  useEffect(() => {
    if (cliente) {
      setFormData({
        nome: cliente.nome || '',
        tipo_documento: cliente.tipo_documento || 'cpf',
        documento: cliente.documento || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        instagram: cliente.instagram || '',
        site: cliente.site || '',
        segmento: cliente.segmento || '',
        data_inicio: cliente.data_inicio || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        responsavel_id: cliente.responsavel_id || '',
        status: cliente.status || 'ativo',
        informacoes_adicionais: cliente.informacoes_adicionais || ''
      });
    } else {
      setFormData({
        nome: '',
        tipo_documento: 'cpf',
        documento: '',
        telefone: '',
        email: '',
        instagram: '',
        site: '',
        segmento: '',
        data_inicio: '',
        cidade: '',
        estado: '',
        responsavel_id: '',
        status: 'ativo',
        informacoes_adicionais: ''
      });
    }
  }, [cliente, isOpen]);

  const handleDocumentoChange = (val: string) => {
    const numeric = val.replace(/\D/g, "");
    const masked = formData.tipo_documento === 'cpf' ? maskCPF(numeric) : maskCNPJ(numeric);
    setFormData({ ...formData, documento: masked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Higienizar dados: converter strings vazias em null para campos opcionais no Supabase
      const sanitizedData = {
        ...formData,
        // PostgreSQL não aceita "" em colunas DATE ou UUID
        data_inicio: formData.data_inicio || null,
        responsavel_id: formData.responsavel_id || null,
        
        // Remove máscaras de formatação para salvar dados limpos
        documento: unmask(formData.documento) || null,
        telefone: unmask(formData.telefone) || null,
        
        // Campos de texto opcionais (nulos são semanticamente melhores que "")
        segmento: formData.segmento || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        instagram: formData.instagram || null,
        site: formData.site || null,
        informacoes_adicionais: formData.informacoes_adicionais || null,
      };

      await onSave(sanitizedData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const FormContent = (
    <form id="cliente-form" onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Nome do Cliente *</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                required
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                placeholder="Nome completo ou Razão Social"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_documento: 'cpf', documento: '' })}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${formData.tipo_documento === 'cpf' ? 'bg-[#a3e635] text-black' : 'text-white/40 hover:text-white'}`}
              >
                Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo_documento: 'cnpj', documento: '' })}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${formData.tipo_documento === 'cnpj' ? 'bg-[#a3e635] text-black' : 'text-white/40 hover:text-white'}`}
              >
                Pessoa Jurídica
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">
                {formData.tipo_documento === 'cpf' ? 'CPF' : 'CNPJ'}
              </label>
              <div className="relative">
                <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={formData.documento}
                  onChange={e => handleDocumentoChange(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder={formData.tipo_documento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Telefone</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="exemplo@gmail.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Instagram</label>
              <div className="relative flex items-center">
                <Instagram size={14} className="absolute left-3 text-white/20" />
                <span className="absolute left-8 text-white/40 text-sm">@</span>
                <input
                  value={formData.instagram}
                  onChange={e => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="perfil"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Site</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={formData.site}
                  onChange={e => setFormData({ ...formData, site: e.target.value })}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="www.site.com.br"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Segmento</label>
            <FilterSelect
              value={formData.segmento}
              onChange={v => setFormData({ ...formData, segmento: v })}
              options={SEGMENTOS}
              placeholder="Selecione o nicho"
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Data de Início</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
              <input
                type="date"
                value={formData.data_inicio}
                onChange={e => setFormData({ ...formData, data_inicio: e.target.value })}
                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Cidade</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  value={formData.cidade}
                  onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full h-11 bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                  placeholder="Cidade"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Estado</label>
              <input
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value.toUpperCase().slice(0, 2) })}
                className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all"
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Responsável</label>
              <FilterSelect
                value={formData.responsavel_id}
                onChange={v => setFormData({...formData, responsavel_id: v})}
                options={[
                  { value: '', label: 'Sem responsável' },
                  ...vendedores.map(v => ({ value: v.id, label: v.nome }))
                ]}
                placeholder="Vendedor"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 block">Status</label>
              <FilterSelect
                value={formData.status}
                onChange={v => setFormData({...formData, status: v as StatusCliente})}
                options={STATUS_OPTIONS}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Full Width */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">Informações Adicionais</label>
            <span className={`text-[10px] font-medium ${formData.informacoes_adicionais.length > 1800 ? 'text-amber-400' : 'text-white/20'}`}>
              {formData.informacoes_adicionais.length} / 2000
            </span>
          </div>
          <textarea
            value={formData.informacoes_adicionais}
            onChange={e => setFormData({ ...formData, informacoes_adicionais: e.target.value.slice(0, 2000) })}
            rows={4}
            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-[#a3e635]/20 focus:outline-none transition-all resize-none"
            placeholder="Observações importantes, histórico de negociação, etc..."
          />
        </div>
      </div>
    </form>
  );

  const FormFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="h-11 px-6 rounded-xl text-white/40 text-sm font-bold hover:text-white transition-all"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="cliente-form"
        disabled={loading || !formData.nome}
        className="h-11 px-8 rounded-xl bg-[#a3e635] text-black text-sm font-bold
          hover:bg-[#84cc16] transition-all disabled:opacity-30 active:scale-[0.98]
          shadow-[0_0_20px_rgba(163,230,53,0.1)] flex items-center gap-2"
      >
        {loading ? 'Salvando...' : (cliente ? 'Salvar Alterações' : 'Cadastrar Cliente')}
      </button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="bg-[#0a0a0a] border-white/5 outline-none max-h-[90vh]">
          <DrawerHeader className="border-b border-white/5">
            <DrawerTitle className="text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
                <BadgeCheck size={18} />
              </div>
              {cliente ? 'Editar Cliente' : 'Novo Cliente'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto pb-6">
            {FormContent}
          </div>
          <DrawerFooter className="border-t border-white/5 flex-row gap-2">
            {FormFooter}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/5 p-0 overflow-hidden outline-none">
        <DialogHeader className="p-6 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a3e635]/10 flex items-center justify-center text-[#a3e635]">
                <BadgeCheck size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p>{cliente ? 'Editar Cliente' : 'Novo Cliente'}</p>
                <p className="text-xs font-normal text-white/30">Preencha as informações para {cliente ? 'atualizar' : 'cadastrar'} o cliente no sistema.</p>
              </div>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          {FormContent}
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-white/5 bg-white/[0.01]">
          {FormFooter}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

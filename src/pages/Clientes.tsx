// src/pages/Clientes.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Instagram, 
  Globe, 
  Building2,
  Filter,
  MoreHorizontal,
  ExternalLink,
  ChevronRight,
  Calendar
} from 'lucide-react';

import { useClientes } from '@/hooks/useClientes';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ClienteModal } from '@/components/ClienteModal';

import { StatusCliente } from '@/types/clientes';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVendedores } from '@/hooks/useVendedores';
import { formatDate } from '@/lib/utils';

const STATUS_FILTERS: { value: StatusCliente | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'churned', label: 'Churned' },
];

const Clientes = () => {
  const { clientes, loading, fetchClientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const { vendedores } = useVendedores();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusCliente | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClientes({ status: statusFilter, search: searchTerm });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, fetchClientes]);

  const handleOpenModal = (cliente?: any) => {
    setSelectedCliente(cliente || null);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (selectedCliente) {
      await updateCliente(selectedCliente.id, data);
    } else {
      await addCliente(data);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir o cliente "${name}"?`)) {
      await deleteCliente(id);
    }
  };

  const getStatusBadge = (status: StatusCliente) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-lime-400/10 text-lime-400 border-lime-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">Ativo</Badge>;
      case 'prospecto':
        return <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">Prospecto</Badge>;
      case 'inativo':
        return <Badge className="bg-white/10 text-white/50 border-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">Inativo</Badge>;
      case 'churned':
        return <Badge className="bg-red-400/10 text-red-400 border-red-400/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">Churned</Badge>;
      default:
        return <Badge className="bg-white/5 text-white/40">{status}</Badge>;
    }
  };

  return (
    <PageLayout className="bg-[#000]">
      <PageHeader
        icon={<Users size={18} />}
        title="Clientes"
        subtitle="Gerencie a base de dados de clientes e parceiros."
        action={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-[#a3e635] hover:opacity-90 text-black font-bold text-sm
              transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)] active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.5} /> Novo Cliente
          </button>
        }
      >
        {/* Filtros e Busca dentro do Header */}
        <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              placeholder="Buscar por nome ou documento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-xs focus:border-[#a3e635]/20 focus:outline-none transition-all placeholder:text-white/20"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`flex-shrink-0 px-4 h-8 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === filter.value 
                    ? 'bg-white/10 text-white shadow-lg' 
                    : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-8 px-6 pb-12">
        {/* Lista / Tabela */}
        <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Nome / Detalhes</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Documento</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Redes / Site</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Segmento</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic">Responsável</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/30 uppercase tracking-widest italic text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="px-6 py-4" colSpan={7}>
                        <Skeleton className="h-6 w-full bg-white/5 rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                          <Users size={32} />
                        </div>
                        <div>
                          <p className="text-white font-bold opacity-40">Nenhum cliente encontrado</p>
                          <p className="text-white/20 text-sm mt-1">Tente ajustar seus filtros ou cadastre um novo.</p>
                        </div>
                        <button
                          onClick={() => handleOpenModal()}
                          className="mt-2 text-[#a3e635] text-xs font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} strokeWidth={3} />
                          Cadastrar primeiro cliente
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  clientes.map(cliente => (
                    <tr key={cliente.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white truncate group-hover:text-[#a3e635] transition-colors">
                            {cliente.nome}
                          </span>
                          <span className="text-[10px] text-white/30 truncate flex items-center gap-1 mt-1">
                            <Calendar size={10} />
                            Início: {cliente.data_inicio ? formatDate(cliente.data_inicio) : '---'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-white/40">
                          {cliente.documento || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {cliente.instagram && (
                            <a 
                              href={`https://instagram.com/${cliente.instagram}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-[#a3e635] transition-all"
                              title={`@${cliente.instagram}`}
                            >
                              <Instagram size={14} />
                            </a>
                          )}
                          {cliente.site && (
                            <a 
                              href={cliente.site.startsWith('http') ? cliente.site : `https://${cliente.site}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-[#a3e635] transition-all"
                            >
                              <Globe size={14} />
                            </a>
                          )}
                          {!cliente.instagram && !cliente.site && <span className="text-white/10 text-[10px]">---</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Building2 size={12} className="text-white/20" />
                          {cliente.segmento || 'Não inf.'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(cliente.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {cliente.responsavel_id ? (
                            <>
                              <div className="w-6 h-6 rounded-lg bg-[#a3e635]/20 flex items-center justify-center text-[#a3e635] text-[10px] font-bold">
                                {vendedores.find(v => v.id === cliente.responsavel_id)?.nome.charAt(0) || '?'}
                              </div>
                              <span className="text-xs text-white/50">
                                {vendedores.find(v => v.id === cliente.responsavel_id)?.nome || 'Vendedor'}
                              </span>
                            </>
                          ) : (
                            <span className="text-white/10 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(cliente)}
                            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id, cliente.nome)}
                            className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClienteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        cliente={selectedCliente}
        onSave={handleSave}
      />
    </PageLayout>
  );
};

export default Clientes;


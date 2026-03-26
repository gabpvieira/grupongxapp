// src/pages/Servicos.tsx
import React, { useState, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  Briefcase, 
  Plus, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Pencil, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { useServicos } from '@/hooks/useServicos';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { ServicoCard } from '@/components/servicos/ServicoCard';
import { ServicoModal } from '@/components/servicos/ServicoModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Servico, ServicoFormPayload } from '@/types/servicos';

export default function Servicos() {
  const { 
    servicos, 
    loading, 
    categorias, 
    addServico, 
    updateServico, 
    deleteServico 
  } = useServicos();

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'lista'>('grid');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [servicoParaEditar, setServicoParaEditar] = useState<Servico | null>(null);
  
  const [idParaDeletar, setIdParaDeletar] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filtragem
  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      const matchBusca = !busca || 
        s.nome.toLowerCase().includes(busca.toLowerCase()) ||
        s.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
        s.categoria.toLowerCase().includes(busca.toLowerCase());
      
      const matchCategoria = !filtroCategoria || s.categoria === filtroCategoria;
      
      const matchStatus = !filtroStatus || 
        (filtroStatus === 'ativo' ? s.ativo : !s.ativo);

      return matchBusca && matchCategoria && matchStatus;
    });
  }, [servicos, busca, filtroCategoria, filtroStatus]);

  const handleOpenModal = (servico?: Servico) => {
    setServicoParaEditar(servico || null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload: ServicoFormPayload) => {
    if (servicoParaEditar) {
      return await updateServico(servicoParaEditar.id, payload);
    } else {
      return await addServico(payload);
    }
  };

  const handleConfirmDelete = (id: string) => {
    setIdParaDeletar(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (idParaDeletar) {
      await deleteServico(idParaDeletar);
      setIsDeleteDialogOpen(false);
      setIdParaDeletar(null);
    }
  };

  return (
    <PageLayout className="bg-[#000]">
      <PageHeader
        icon={<Briefcase size={18} />}
        title="Meus Serviços"
        subtitle="Gerencie seu catálogo de serviços e preços"
        action={
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-[#a3e635] hover:opacity-90 text-black font-bold text-sm
              transition-all shadow-[0_0_20px_rgba(163,230,53,0.15)] active:scale-[0.98]"
          >
            <Plus size={15} strokeWidth={2.5} /> Novo Serviço
          </button>
        }
      />

      {/* Barra de busca e controles */}
      <div className="flex flex-col md:flex-row items-center gap-4 px-6 py-4 border-b border-white/5 bg-[#050505]/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, descrição ou categoria..."
            className="w-full h-10 bg-white/5 border border-white/5 rounded-xl
              pl-10 pr-4 text-sm text-white placeholder:text-white/20
              focus:outline-none focus:ring-1 focus:ring-[#a3e635]/20 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <FilterSelect
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            placeholder="Categorias"
            options={[
              { value: '', label: 'Todas as categorias' },
              ...categorias.map(c => ({ value: c, label: c }))
            ]}
            className="flex-1 md:w-48"
          />

          <FilterSelect
            value={filtroStatus}
            onChange={setFiltroStatus}
            placeholder="Status"
            options={[
              { value: '',      label: 'Todos os status' },
              { value: 'ativo', label: 'Disponíveis'     },
              { value: 'inativo', label: 'Indisponíveis'  },
            ]}
            className="flex-1 md:w-40"
          />

          <div className="flex items-center bg-[#0d0d0d] border border-white/8 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all
                ${viewMode === 'grid'
                  ? 'bg-[#a3e635] text-black shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/5'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('lista')}
              className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all
                ${viewMode === 'lista'
                  ? 'bg-[#a3e635] text-black shadow-[0_0_10px_rgba(163,230,53,0.2)]'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/5'}`}
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && servicos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin" />
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando catálogo...</p>
          </div>
        ) : servicosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#0d0d0d]/30 border border-dashed border-white/5 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-4">
              <Briefcase size={32} />
            </div>
            <h3 className="text-white/60 font-bold">Nenhum serviço encontrado</h3>
            <p className="text-white/20 text-sm mt-1">Tente ajustar seus filtros ou busca.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicosFiltrados.map(s => (
              <ServicoCard 
                key={s.id} 
                servico={s} 
                onEdit={handleOpenModal} 
                onDelete={handleConfirmDelete} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {servicosFiltrados.map(s => (
              <div key={s.id} className="group flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-bold truncate">{s.nome}</p>
                  {s.descricao && (
                    <p className="text-white/25 text-[11px] truncate mt-0.5">{s.descricao}</p>
                  )}
                </div>

                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest w-32 text-right flex-shrink-0">
                  {s.categoria}
                </span>

                <div className="w-24 text-right flex-shrink-0">
                  {s.recorrente && s.periodicidade ? (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-white/30 text-[9px] font-bold uppercase tracking-wider">
                      {s.periodicidade}
                    </span>
                  ) : (
                    <span className="text-white/10 text-[10px]">—</span>
                  )}
                </div>

                <span className="text-[#a3e635] font-black text-sm w-32 text-right flex-shrink-0 tabular-nums">
                  {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.preco)}
                </span>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenModal(s)}
                    className="w-8 h-8 rounded-lg border border-white/8 text-white/30
                      hover:border-white/20 hover:text-white/60 flex items-center justify-center transition-all bg-white/5"
                  >
                    <Pencil size={12} />
                  </button>
                  <button 
                    onClick={() => handleConfirmDelete(s.id)}
                    className="w-8 h-8 rounded-lg border border-white/8 text-white/20
                      hover:border-red-500/30 hover:text-red-400 flex items-center justify-center transition-all bg-white/5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ServicoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        servicoParaEditar={servicoParaEditar}
        categoriasExistentes={categorias}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0a0a0a] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita e ele deixará de aparecer no catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white border-none"
            >
              Excluir Serviço
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}

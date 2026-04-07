// src/components/ClienteComboBox.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Loader2, 
  Check, 
  Building2, 
  User, 
  X,
  ChevronDown
} from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClienteModal } from './ClienteModal';
import { StatusCliente } from '@/types/clientes';

interface ClienteComboBoxProps {
  value?: string; // id
  clienteNome?: string; // nome texto
  onChange: (id: string | null, nome: string) => void;
  className?: string;
}

export const ClienteComboBox = ({ value, clienteNome, onChange, className }: ClienteComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(clienteNome || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { searchClientes, addCliente } = useClientes();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar busca interna com o nome externo quando o valor muda
  useEffect(() => {
    if (clienteNome !== undefined) {
      setSearch(clienteNome);
    }
  }, [clienteNome]);

  const handleSearch = async (term: string) => {
    setSearch(term);
    onChange(null, term); // Mantém retrocompatibilidade salvando o que o usuário digita

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (term.length < 2) {
      setResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      const data = await searchClientes(term);
      setResults(data);
      setLoading(false);
    }, 300);
  };

  const handleSelect = (cliente: any) => {
    onChange(cliente.id, cliente.nome);
    setSearch(cliente.nome);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, '');
    setSearch('');
    setResults([]);
  };

  const handleCreateNew = async (data: any) => {
    const newCliente = await addCliente(data);
    if (newCliente) {
      handleSelect(newCliente);
    }
  };

  const getStatusBadge = (status: StatusCliente) => {
    switch (status) {
      case 'ativo': return <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />;
      case 'prospecto': return <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />;
      case 'inativo': return <div className="w-1.5 h-1.5 rounded-full bg-white/20" />;
      case 'churned': return <div className="w-1.5 h-1.5 rounded-full bg-red-400" />;
      default: return null;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative group">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              open ? "text-[#a3e635]" : "text-white/20"
            )} />
            
            <input
              type="text"
              placeholder="Buscar ou digitar nome do cliente..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setOpen(true)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 text-sm text-white focus:border-[#a3e635]/40 focus:outline-none transition-all placeholder:text-white/20"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {loading && <Loader2 className="w-4 h-4 text-[#a3e635] animate-spin" />}
              {search && !loading && (
                <button 
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-md text-white/20 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={14} />
                </button>
              )}
              <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", open && "rotate-180")} />
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#111] border-white/10 shadow-2xl rounded-xl overflow-hidden z-50" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="bg-transparent">
            <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {results.length > 0 ? (
                <CommandGroup heading={<span className="text-[10px] uppercase font-bold tracking-widest text-white/20 px-2 pt-2">Resultados da base</span>}>
                  {results.map((cliente) => (
                    <CommandItem
                      key={cliente.id}
                      onSelect={() => handleSelect(cliente)}
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer aria-selected:bg-white/5 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#a3e635] transition-colors">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white group-hover:text-[#a3e635] transition-colors">
                            {cliente.nome}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {cliente.segmento || 'Sem segmento'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(cliente.status)}
                        {value === cliente.id && <Check size={14} className="text-[#a3e635]" />}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : search.length >= 2 && !loading && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-white/40">Nenhum cliente cadastrado com esse nome.</p>
                  <p className="text-[10px] text-white/20 mt-1 italic">O nome digitado será salvo como texto livre.</p>
                </div>
              )}

              <div className="p-2 border-t border-white/5 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-[#a3e635] hover:bg-[#a3e635]/10 transition-all"
                >
                  <Plus size={14} strokeWidth={3} />
                  Cadastrar Novo Cliente
                </button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ClienteModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleCreateNew}
      />
    </div>
  );
};

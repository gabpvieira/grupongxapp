import { useEffect } from "react";
import { LayoutDashboard, Plus, List, Settings, Menu, X, BarChart3, CheckSquare } from "lucide-react";
import { NavLink } from "react-router-dom";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, description: "Visão geral" },
  { title: "Novo Lançamento", url: "/lancamento", icon: Plus, description: "Criar registro" },
  { title: "Ver Lançamentos", url: "/vendas", icon: List, description: "Histórico" },
  { title: "Métricas da Semana", url: "/metricas-semana", icon: BarChart3, description: "Análises" },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare, description: "Gerenciar" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, description: "Ajustes" },
];

export function AppSidebar({ isOpen, onClose, onOpen }: AppSidebarProps) {
  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest(".sidebar-container") && !target.closest(".menu-trigger")) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Botão de Menu Moderno */}
      <button
        onClick={onOpen}
        className="menu-trigger fixed top-6 left-6 z-50 h-12 w-12 flex items-center justify-center rounded-xl bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 text-slate-200 hover:bg-slate-800 hover:border-[#8bdb00]/50 hover:text-white transition-all duration-300 shadow-lg hover:shadow-[#8bdb00]/20 group"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Sidebar - só renderiza quando aberta */}
      {isOpen && (
        <>
          {/* Overlay Premium */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-fade-in"
            onClick={onClose}
          />

          {/* Sidebar Container Premium */}
          <aside className="sidebar-container fixed left-0 top-0 h-full w-80 bg-slate-900/98 backdrop-blur-xl border-r border-slate-700/50 shadow-2xl z-50 animate-slide-in-left flex flex-col max-w-[85vw]">
            
            {/* Header Flutuante */}
            <div className="p-6">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/30 shadow-xl mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#8bdb00] to-[#7bc400] flex items-center justify-center border border-[#8bdb00]/30 shadow-lg shadow-[#8bdb00]/20 hover:shadow-[#8bdb00]/30 transition-all duration-300 group-hover:scale-105">
                        <span className="text-white font-bold text-lg">G</span>
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-[#8bdb00] rounded-full border-2 border-slate-900 animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-white group-hover:text-[#8bdb00] transition-colors duration-200">
                        Grupo NGX
                      </div>
                      <div className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors duration-200 flex items-center gap-2">
                        <div className="h-2 w-2 bg-[#8bdb00] rounded-full animate-pulse"></div>
                        Gestão Empresarial
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                    aria-label="Fechar menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Premium */}
             <nav className="flex-1 px-6 pb-6 space-y-1 overflow-y-auto">
               <div className="mb-4">
                 <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-1.5 flex items-center gap-2">
                   <div className="h-1 w-1 bg-[#8bdb00] rounded-full"></div>
                   Menu Principal
                 </h2>
              </div>
              
              {menuItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end={item.url === "/"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-[#8bdb00]/20 to-[#7bc400]/10 text-white border border-[#8bdb00]/30 shadow-lg shadow-[#8bdb00]/10"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent hover:border-slate-700/50"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Bolinha Toggle Moderna */}
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-all duration-300 ${
                        isActive ? 'bg-gradient-to-b from-[#8bdb00] to-[#7bc400] shadow-lg shadow-[#8bdb00]/50' : 'bg-transparent'
                      }`} />
                      
                      {/* Ícone Container */}
                      <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-[#8bdb00]/20 text-[#8bdb00] shadow-lg shadow-[#8bdb00]/20' 
                          : 'bg-slate-800/50 text-slate-400 group-hover:bg-slate-700/50 group-hover:text-slate-300'
                      }`}>
                        <item.icon className="h-4 w-4" />
                        {isActive && (
                          <div className="absolute inset-0 bg-[#8bdb00]/10 rounded-lg animate-pulse"></div>
                        )}
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {item.title}
                        </div>
                        <div className={`text-xs transition-colors duration-200 ${
                          isActive ? 'text-[#8bdb00]/80' : 'text-slate-500 group-hover:text-slate-400'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                      
                      {/* Indicador Ativo */}
                      {isActive && (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 bg-[#8bdb00] rounded-full animate-pulse"></div>
                          <div className="h-1 w-1 bg-[#8bdb00] rounded-full"></div>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer Compacto */}
             <div className="p-4">
               <div className="flex items-center gap-3 group cursor-pointer">
                 <div className="relative">
                   <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                     <span className="text-slate-200 font-medium text-xs">U</span>
                   </div>
                   <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-[#8bdb00] rounded-full border-2 border-slate-900"></div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="font-medium text-xs text-white group-hover:text-[#8bdb00] transition-colors duration-200">
                     Usuário
                   </div>
                   <div className="text-xs text-slate-400">
                     Online
                   </div>
                 </div>
               </div>
             </div>
          </aside>
        </>
      )}
    </>
  );
}

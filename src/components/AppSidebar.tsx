import { useEffect } from "react";
import { LayoutDashboard, Plus, List, Settings, Menu, X, BarChart3, CheckSquare, ChevronRight } from "lucide-react";
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
      {/* Botão de Menu Fixo - ClickUp Style */}
      <button
        onClick={onOpen}
        className="menu-trigger fixed top-6 left-6 z-50 h-10 w-10 flex items-center justify-center rounded-lg bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-elevated group"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 group-hover:scale-110 transition-transform" />
      </button>

      {/* Sidebar - só renderiza quando aberta */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            onClick={onClose}
          />

          {/* Sidebar Container */}
          <aside className="sidebar-container fixed left-0 top-0 h-full w-80 sm:w-72 bg-sidebar border-r border-sidebar-border shadow-elevated-lg z-50 animate-slide-in-left flex flex-col max-w-[85vw]">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">N</span>
                  </div>
                  <div>
                    <h1 className="text-sidebar-foreground font-semibold text-lg">Grupo NGX</h1>
                    <p className="text-muted-foreground text-xs">Gestão Empresarial</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
                  aria-label="Fechar menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              <div className="mb-4">
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
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
                    `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-1.5 rounded-md ${isActive ? 'bg-primary-foreground/20' : 'bg-sidebar-accent group-hover:bg-sidebar-accent'}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className={`text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {item.description}
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-medium text-xs">U</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-sidebar-foreground">Usuário</div>
                  <div className="text-xs text-muted-foreground">Administrador</div>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

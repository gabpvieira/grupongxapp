import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  DollarSign,
  BarChart2,
  CheckSquare,
  Settings,
  LogOut,
  X,
  Users,
  Briefcase,
  FileText,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", sub: "Visão geral", icon: LayoutDashboard, path: "/app/dashboard" },
  { label: "CRM", sub: "Leads & Atendimento", icon: Users, path: "/app/crm" },
  { label: "Clientes", sub: "Base de dados", icon: Users, path: "/app/clientes" },
  { label: "Serviços", sub: "Catálogo e preços", icon: Briefcase, path: "/app/servicos" },
  { label: "Orçamentos", sub: "Propostas e contratos", icon: FileText, path: "/app/orcamentos" },
  { label: "Propostas", sub: "Páginas HTML", icon: Globe, path: "/admin/propostas" },
  { label: "Financeiro", sub: "Lançamentos e KPIs", icon: DollarSign, path: "/app/financeiro" },
  { label: "Métricas da Semana", sub: "Análises", icon: BarChart2, path: "/app/metricas" },
  { label: "Tarefas", sub: "Gerenciar", icon: CheckSquare, path: "/app/tarefas" },
  { label: "Configurações", sub: "Ajustes", icon: Settings, path: "/app/configuracoes" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Fechar ao navegar (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  // Nome e inicial do usuário
  const nomeUsuario =
    user?.user_metadata?.nome ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const nomeInicial = nomeUsuario.charAt(0).toUpperCase();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[240px] bg-[#0a0a0a] border-r border-white/5
          flex flex-col z-30
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <img src="/logo.png" alt="Grupo NGX" className="h-9 w-auto object-contain" />
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-lg
                  border-l-[3px] transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#a3e635]/10 border-[#a3e635] text-white"
                      : "border-transparent text-white/50 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-[#a3e635]" : "text-white/40 group-hover:text-white/70 transition-colors"}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold leading-none">{item.label}</span>
                  <span className={`text-[10px] mt-0.5 ${isActive ? "text-[#a3e635]/70" : "text-white/30"}`}>
                    {item.sub}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Rodapé — Usuário */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {nomeInicial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{nomeUsuario}</p>
              <p className="text-white/40 text-xs">Online</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

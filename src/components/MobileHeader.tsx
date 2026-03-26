import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center px-4 h-14 border-b border-white/5 bg-black sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menu"
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
      >
        <Menu size={20} />
      </button>
      <img
        src="/logo.png"
        alt="Grupo NGX"
        className="h-7 w-auto object-contain absolute left-1/2 -translate-x-1/2"
      />
    </header>
  );
}

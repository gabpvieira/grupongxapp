import React from 'react';

interface PageHeaderProps {
  icon?: React.ReactNode;          // ícone opcional à esquerda do título
  title: string;                   // título principal
  subtitle?: string;               // subtítulo/descrição opcional
  action?: React.ReactNode;        // botão ou elemento à direita (ex: "Nova Tarefa")
  children?: React.ReactNode;      // slot extra abaixo do título (ex: tabs, filtros)
}

export const PageHeader = ({
  icon, title, subtitle, action, children
}: PageHeaderProps) => (
  <div className="border-b border-white/5">

    {/* Linha principal */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5">

      {/* Esquerda: ícone + título + subtítulo */}
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#a3e635]/12 border border-[#a3e635]/20
            flex items-center justify-center flex-shrink-0">
            <span className="text-[#a3e635]">{icon}</span>
          </div>
        )}
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/35 text-xs mt-1 font-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Direita: action slot */}
      {action && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {action}
        </div>
      )}
    </div>

    {/* Slot extra — tabs, filtros, controles secundários */}
    {children && (
      <div className="px-6 pb-4">
        {children}
      </div>
    )}

  </div>
);

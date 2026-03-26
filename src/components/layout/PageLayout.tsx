import React from 'react';

// Container flutuante com bordas arredondadas que envolve o conteúdo de cada página
interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout = ({ children, className = '' }: PageLayoutProps) => (
  <div className={`
    m-4 lg:m-6
    bg-[#0a0a0a]
    border border-white/5
    rounded-2xl
    min-h-[calc(100vh-48px)]
    overflow-hidden
    ${className}
  `}>
    {children}
  </div>
);

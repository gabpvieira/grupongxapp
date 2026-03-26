import React from 'react';

const PublicPlaceholder = () => {
  return (
    <div className="min-h-screen bg-[#070c09] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
        <img 
          src="/logo.png" 
          alt="Grupo NGX Logo" 
          className="h-20 w-auto object-contain"
        />
        <div className="text-center space-y-2">
          <h1 className="text-white text-3xl font-bold tracking-tighter sm:text-4xl font-syne">
            Grupo NGX
          </h1>
          <p className="text-white/40 text-lg font-light tracking-wide italic">
            Em breve, algo extraordinário.
          </p>
        </div>
        <div className="w-12 h-[1px] bg-[#a3e635]/30" />
      </div>
    </div>
  );
};

export default PublicPlaceholder;

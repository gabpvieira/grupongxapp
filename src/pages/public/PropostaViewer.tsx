// src/pages/public/PropostaViewer.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePropostas } from '@/hooks/usePropostas';
import type { Proposta } from '@/types/propostas';
import { Loader2 } from 'lucide-react';

export default function PropostaViewer() {
  const { slug } = useParams<{ slug: string }>();
  const { getPropostaBySlug, incrementView } = usePropostas();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProposta() {
      if (!slug) return;
      
      const data = await getPropostaBySlug(slug);
      if (data) {
        setProposta(data);
        incrementView(slug);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }

    loadProposta();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-black text-white">
        <Loader2 className="w-10 h-10 text-[#a3e635] animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Carregando Proposta...</p>
      </div>
    );
  }

  if (notFound || !proposta) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center">
        <img src="/logo.png" alt="Grupo NGX" className="h-12 w-auto mb-8 opacity-50" />
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">404</h1>
        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
          Proposta não encontrada ou desativada. Entre em contato com seu consultor.
        </p>
        <div className="mt-10 pt-10 border-t border-white/5 w-full max-w-[200px]">
          <a 
            href="https://www.ngxgrupo.com" 
            className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] hover:opacity-80 transition-all"
          >
            Ir para o Site →
          </a>
        </div>
      </div>
    );
  }

  const iframeContent = `
    <html>
      <head>
        <style>
          html, body { 
            overflow-x: hidden !important; 
            max-width: 100vw !important; 
            margin: 0; 
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${proposta.html_content}
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 w-full h-full bg-white overflow-hidden" 
      style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <iframe
        srcDoc={iframeContent}
        title={proposta.titulo}
        className="w-full h-full border-none"
        style={{ width: '100%', border: 'none', overflowX: 'hidden' }}
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}

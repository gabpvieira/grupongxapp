// src/components/propostas/PropostaModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Link, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PropostaFormPayload } from '@/types/propostas';

interface PropostaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: PropostaFormPayload) => Promise<boolean>;
}

export function PropostaModal({ isOpen, onClose, onSubmit }: PropostaModalProps) {
  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const slugRegex = /^[a-z0-9-]+$/;

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setSlug('');
      setHtmlContent('');
      setFileName('');
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      toast({
        title: "Arquivo inválido",
        description: "Apenas arquivos .html são aceitos.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
    };
    reader.readAsText(file);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setSlug(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !slug || !htmlContent) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e faça o upload do HTML.",
        variant: "destructive",
      });
      return;
    }

    if (!slugRegex.test(slug)) {
      toast({
        title: "Slug inválido",
        description: "O slug deve conter apenas letras minúsculas, números e hífens.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await onSubmit({
      titulo,
      slug,
      html_content: htmlContent,
      ativa: true,
    });
    setLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <FileText className="text-[#a3e635]" size={20} />
            Nova Proposta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo" className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Título da Proposta</Label>
            <Input
              id="titulo"
              placeholder="Ex: Andrade Shop & Detail"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="bg-white/5 border-white/5 focus:border-[#a3e635]/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Slug (URL Personalizada)</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <Input
                id="slug"
                placeholder="andrade"
                value={slug}
                onChange={handleSlugChange}
                className="bg-white/5 border-white/5 focus:border-[#a3e635]/20 pl-10"
              />
            </div>
            {slug && (
              <p className="text-[10px] text-white/20 mt-1">
                Preview: <span className="text-[#a3e635]/50">proposta.ngxgrupo.com/{slug}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Arquivo HTML</Label>
            <div className="relative group">
              <input
                type="file"
                accept=".html"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all
                ${fileName ? 'border-[#a3e635]/30 bg-[#a3e635]/5' : 'border-white/5 hover:border-white/10 bg-white/[0.02]'}
              `}>
                {fileName ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[#a3e635]/20 flex items-center justify-center text-[#a3e635]">
                      <Upload size={18} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{fileName}</p>
                      <p className="text-[10px] text-[#a3e635]/50 font-medium uppercase tracking-widest mt-1">Arquivo selecionado</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/40 transition-colors">
                      <Upload size={18} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">Clique para upload ou arraste</p>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">Apenas .html</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-white/40 hover:text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#a3e635] hover:opacity-90 text-black font-black uppercase tracking-widest text-[10px] px-8 h-10 shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Publicar Proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

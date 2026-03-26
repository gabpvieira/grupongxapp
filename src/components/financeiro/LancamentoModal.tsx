import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LancamentoForm from "./LancamentoForm";
import type { VendaCompleta } from "@/hooks/useFinanceiro";

interface LancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  venda: VendaCompleta | null;
  onSubmit: (values: any) => Promise<void>;
  loading?: boolean;
}

const LancamentoModal = ({ 
  isOpen, 
  onClose, 
  venda, 
  onSubmit, 
  loading 
}: LancamentoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-black border-white/10 text-white p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold tracking-tight font-syne">
            Editar Lançamento
          </DialogTitle>
          <DialogDescription className="text-white/40 uppercase text-[10px] font-black tracking-widest mt-2">
            Altere as informações do registro selecionado
          </DialogDescription>
        </DialogHeader>

        <LancamentoForm 
          initialData={venda} 
          onSubmit={async (values) => {
            await onSubmit(values);
            onClose();
          }} 
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LancamentoModal;

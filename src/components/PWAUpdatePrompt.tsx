import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  // Desabilitar PWA em desenvolvimento para evitar erros
  if (import.meta.env.DEV) {
    return null;
  }

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registrado com sucesso");
    },
    onRegisterError(error) {
      console.error("Erro ao registrar Service Worker:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      console.log("App pronto para funcionar offline");
    }
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [offlineReady, needRefresh]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 bg-[#0e1219] border-2 border-[#acf500] shadow-2xl max-w-sm animate-slide-in-right">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-[#acf500] mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">
              Nova versão disponível
            </h3>
            <p className="text-sm text-gray-300">
              Clique em atualizar para obter a versão mais recente do app.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={close}
            className="text-gray-300 border-gray-600 hover:bg-gray-800"
          >
            Depois
          </Button>
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            className="bg-[#acf500] text-[#0e1219] hover:bg-[#9ce600]"
          >
            Atualizar
          </Button>
        </div>
      </div>
    </Card>
  );
}

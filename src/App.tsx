import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { useReminders } from "@/hooks/useReminders";
import Index from "./pages/Index";
import Lancamento from "./pages/Lancamento";
import Vendas from "./pages/Vendas";
import Configuracoes from "./pages/Configuracoes";
import MetricasSemana from "./pages/MetricasSemana";
import Tarefas from "./pages/Tarefas";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Inicializa o serviço de lembretes
  useReminders();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PWAUpdatePrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex w-full relative">
            <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/lancamento" element={<Lancamento />} />
                <Route path="/vendas" element={<Vendas />} />
                <Route path="/metricas-semana" element={<MetricasSemana />} />
                <Route path="/tarefas" element={<Tarefas />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

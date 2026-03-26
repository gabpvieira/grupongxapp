import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import Index from "./pages/Index";
import Configuracoes from "./pages/Configuracoes";
import Metricas from "./pages/Metricas";
import Tarefas from "./pages/Tarefas";
import Login from "./pages/Login";
import PublicPlaceholder from "./pages/PublicPlaceholder";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Financeiro from "./pages/Financeiro";
import Crm from "./pages/Crm";
import Servicos from "./pages/Servicos";
import Orcamentos from "./pages/Orcamentos";

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <PWAUpdatePrompt />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<PublicPlaceholder />} />
              <Route path="/login" element={<Login />} />

              {/* Rotas protegidas sob prefixo /app */}
              <Route path="/app" element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Index />} />
                  <Route path="financeiro" element={<Financeiro />} />
                  <Route path="crm" element={<Crm />} />
                  <Route path="servicos" element={<Servicos />} />
                  <Route path="orcamentos" element={<Orcamentos />} />
                  <Route path="vendas" element={<Navigate to="/app/financeiro" replace />} />
                  <Route path="lancamento" element={<Navigate to="/app/financeiro" replace />} />
                  <Route path="metricas" element={<Metricas />} />
                  <Route path="tarefas" element={<Tarefas />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>

              {/* Fallback global */}
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

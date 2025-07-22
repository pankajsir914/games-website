
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Games from "./pages/Games";
import ColorPrediction from "./pages/ColorPrediction";
import Ludo from "./pages/Ludo";
import Aviator from "./pages/Aviator";
import Rummy from "./pages/Rummy";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminTransactions from "./pages/AdminTransactions";
import AdminGameSettings from "./pages/AdminGameSettings";
import AdminGameDashboard from "./pages/AdminGameDashboard";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/games" element={<Games />} />
            <Route path="/color-prediction" element={<ColorPrediction />} />
            <Route path="/ludo" element={<Ludo />} />
            <Route path="/aviator" element={<Aviator />} />
            <Route path="/rummy" element={<Rummy />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/games" element={<AdminGameSettings />} />
            <Route path="/admin/game-dashboard/:gameType" element={<AdminGameDashboard />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Games from "./pages/Games";
import Ludo from "./pages/Ludo";
import Aviator from "./pages/Aviator";
import ColorPrediction from "./pages/ColorPrediction";
import AndarBahar from "./pages/AndarBahar";
import Roulette from "./pages/Roulette";
import Rummy from "./pages/Rummy";
import Poker from "./pages/Poker";
import PokerTable from "./pages/PokerTable";
import Jackpot from "./pages/Jackpot";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminTransactions from "./pages/AdminTransactions";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminGameDashboard from "./pages/AdminGameDashboard";
import AdminGameSettings from "./pages/AdminGameSettings";
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
            <Route path="/ludo" element={<Ludo />} />
            <Route path="/aviator" element={<Aviator />} />
            <Route path="/color-prediction" element={<ColorPrediction />} />
            <Route path="/andar-bahar" element={<AndarBahar />} />
            <Route path="/roulette" element={<Roulette />} />
            <Route path="/rummy" element={<Rummy />} />
            <Route path="/poker" element={<Poker />} />
            <Route path="/poker/table/:tableId" element={<PokerTable />} />
            <Route path="/jackpot" element={<Jackpot />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            <Route path="/admin/games" element={<AdminGameDashboard />} />
            <Route path="/admin/game-settings" element={<AdminGameSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

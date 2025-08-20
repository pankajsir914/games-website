
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Ludo from "./pages/Ludo";
import LudoGame from "./pages/LudoGame";
import Aviator from "./pages/Aviator";
import ColorPrediction from "./pages/ColorPrediction";
import AndarBahar from "./pages/AndarBahar";
import Roulette from "./pages/Roulette";
import RouletteAdmin from "./pages/RouletteAdmin";
import Rummy from "./pages/Rummy";
import Poker from "./pages/Poker";
import PokerTable from "./pages/PokerTable";
import Jackpot from "./pages/Jackpot";
import TeenPatti from "./pages/TeenPatti";
import Wallet from "./pages/Wallet";
import Sports from "./pages/Sports";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminUsers from "./pages/AdminUsers";
import AdminTransactions from "./pages/AdminTransactions";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminPayments from "./pages/AdminPayments";
import AdminBets from "./pages/AdminBets";
import AdminGameDashboard from "./pages/AdminGameDashboard";
import AdminMaster from "./pages/AdminMaster";
import MasterAdminLogin from "./pages/MasterAdminLogin";
import { MasterAdminAuthProvider } from "@/hooks/useMasterAdminAuth";
import { MasterAdminProtectedRoute } from "@/components/auth/MasterAdminProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MasterAdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/sports" element={<Sports />} />
              <Route path="/ludo" element={<Ludo />} />
              <Route path="/ludo-game" element={<LudoGame />} />
              <Route path="/aviator" element={<Aviator />} />
              <Route path="/color-prediction" element={<ColorPrediction />} />
              <Route path="/andar-bahar" element={<AndarBahar />} />
              <Route path="/roulette" element={<Roulette />} />
              <Route path="/rummy" element={<Rummy />} />
              <Route path="/poker" element={<Poker />} />
              <Route path="/poker/table/:tableId" element={<PokerTable />} />
              <Route path="/jackpot" element={<Jackpot />} />
              <Route path="/teen-patti" element={<TeenPatti />} />
              <Route path="/wallet" element={<Wallet />} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <AdminProtectedRoute>
                    <AdminUsers />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/payments" 
                element={
                  <AdminProtectedRoute>
                    <AdminPayments />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/withdrawals" 
                element={
                  <AdminProtectedRoute>
                    <AdminWithdrawals />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/transactions" 
                element={
                  <AdminProtectedRoute>
                    <AdminTransactions />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/bets" 
                element={
                  <AdminProtectedRoute>
                    <AdminBets />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/game-dashboard/:gameType" 
                element={
                  <AdminProtectedRoute>
                    <AdminGameDashboard />
                  </AdminProtectedRoute>
                 } 
               />
               <Route 
                 path="/admin/roulette" 
                 element={
                   <AdminProtectedRoute>
                     <RouletteAdmin />
                   </AdminProtectedRoute>
                 } 
               />
               <Route path="/admin/game-settings" element={<Navigate to="/admin" replace />} />
               <Route path="/admin/settings" element={<Navigate to="/admin" replace />} />
               <Route path="/admin/security" element={<Navigate to="/admin" replace />} />
              
              {/* Master Admin Routes */}
              <Route path="/master-admin/login" element={<MasterAdminLogin />} />
              <Route 
                path="/master-admin" 
                element={
                  <MasterAdminProtectedRoute>
                    <AdminMaster />
                  </MasterAdminProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </MasterAdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

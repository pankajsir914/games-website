
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PasswordChangeWrapper } from "@/components/auth/PasswordChangeWrapper";
import { SportsDataProvider } from "@/contexts/SportsDataContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Ludo from "./pages/Ludo";
import LudoGame from "./pages/LudoGame";
import Aviator from "./pages/Aviator";
import ColorPrediction from "./pages/ColorPrediction";
import RouletteAdmin from "./pages/RouletteAdmin";
import PokerTable from "./pages/PokerTable";
import TeenPatti from "./pages/TeenPatti";
import ChickenRun from "./pages/ChickenRun";
import LiveCasino from "./pages/LiveCasino";
import LiveCasinoTable from "./pages/LiveCasinoTable";
import Wallet from "./pages/Wallet";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import BettingHistory from "./pages/BettingHistory";
import Sports from "./pages/Sports";
import SportsMatches from "./pages/SportsMatches";
import SportsBet from "./pages/SportsBet";
import MatchDetails from "./pages/MatchDetails";
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
import { UserOnlyRoute } from "@/components/auth/UserOnlyRoute";
import { AdminRedirect } from "@/components/admin/AdminRedirect";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PasswordChangeWrapper>
        <MasterAdminAuthProvider>
          <SportsDataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
              {/* User-only routes - blocked for admin/master_admin */}
              <Route path="/" element={<UserOnlyRoute><Index /></UserOnlyRoute>} />
              <Route path="/dashboard" element={<UserOnlyRoute><Dashboard /></UserOnlyRoute>} />
              <Route path="/games" element={<UserOnlyRoute><Games /></UserOnlyRoute>} />
              <Route path="/sports" element={<UserOnlyRoute><Sports /></UserOnlyRoute>} />
              <Route path="/sports/:sport/:type" element={<UserOnlyRoute><SportsMatches /></UserOnlyRoute>} />
              <Route path="/sports/bet/:sport/:matchId" element={<UserOnlyRoute><SportsBet /></UserOnlyRoute>} />
              <Route path="/match-details/:sport/:matchId" element={<UserOnlyRoute><MatchDetails /></UserOnlyRoute>} />
              <Route path="/ludo" element={<UserOnlyRoute><Ludo /></UserOnlyRoute>} />
              <Route path="/ludo-game" element={<UserOnlyRoute><LudoGame /></UserOnlyRoute>} />
              <Route path="/aviator" element={<UserOnlyRoute><Aviator /></UserOnlyRoute>} />
              <Route path="/color-prediction" element={<UserOnlyRoute><ColorPrediction /></UserOnlyRoute>} />
              <Route path="/poker/table/:tableId" element={<UserOnlyRoute><PokerTable /></UserOnlyRoute>} />
              <Route path="/teen-patti" element={<UserOnlyRoute><TeenPatti /></UserOnlyRoute>} />
              <Route path="/chicken-run" element={<UserOnlyRoute><ChickenRun /></UserOnlyRoute>} />
              <Route path="/live-casino" element={<UserOnlyRoute><LiveCasino /></UserOnlyRoute>} />
              <Route path="/live-casino/:tableId" element={<UserOnlyRoute><LiveCasinoTable /></UserOnlyRoute>} />
              <Route path="/wallet" element={<UserOnlyRoute><Wallet /></UserOnlyRoute>} />
              <Route path="/profile" element={<UserOnlyRoute><Profile /></UserOnlyRoute>} />
              <Route path="/betting-history" element={<UserOnlyRoute><BettingHistory /></UserOnlyRoute>} />
              <Route path="/support" element={<UserOnlyRoute><Support /></UserOnlyRoute>} />
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <AdminRedirect />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminProtectedRoute allowMasterAdmin={false}>
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
                  <AdminProtectedRoute allowMasterAdmin={false}>
                    <AdminPayments />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/withdrawals" 
                element={
                  <AdminProtectedRoute allowMasterAdmin={false}>
                    <AdminWithdrawals />
                  </AdminProtectedRoute>
                } 
              />
              <Route 
                path="/admin/transactions" 
                element={
                  <AdminProtectedRoute allowMasterAdmin={false}>
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
      </SportsDataProvider>
      </MasterAdminAuthProvider>
    </PasswordChangeWrapper>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import TableCard, { TableSearchBox } from "@/components/live-casino/TableCard";
import TableCardSkeleton from "@/components/live-casino/TableCardSkeleton";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AuthModal } from "@/components/auth/AuthModal";

const SKELETON_COUNT = 50;

const LiveCasino = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [search, setSearch] = useState("");

  const {
    liveTables,
    loading,
    fetchLiveTables,
  } = useDiamondCasino();

  /* =========================
     Fetch tables on mount
     ========================= */
  useEffect(() => {
    fetchLiveTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     Navigate after login
     ========================= */
  useEffect(() => {
    if (user && selectedTable && !showAuthModal) {
      navigate(`/live-casino/${selectedTable.id}`);
      setSelectedTable(null);
      setShowLoginDialog(false);
    }
  }, [user, selectedTable, navigate, showAuthModal]);

  /* =========================
     Handle table click
     ========================= */
  const handleSelectTable = (table: any) => {
    if (!user && !authLoading) {
      setSelectedTable(table);
      setShowLoginDialog(true);
      return;
    }
    navigate(`/live-casino/${table.id}`);
  };

  const handleLoginClick = () => {
    setShowLoginDialog(false);
    setShowAuthModal(true);
  };

  /* =========================
     Filter tables by search
     ========================= */
  const filteredTables = useMemo(() => {
    if (!search.trim()) return liveTables;
    return liveTables.filter((table) =>
      table.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [liveTables, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 overflow-x-hidden">
      <Navigation />

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-2 sm:mt-2">

        {/* ===== SEARCH BOX ===== */}
        <TableSearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search live casino table..."
        />

        {/* ===== TABLE GRID ===== */}
        <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <TableCardSkeleton key={i} />
              ))
            : filteredTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onClick={() => handleSelectTable(table)}
                />
              ))}
        </div>

        {/* ===== EMPTY STATE ===== */}
        {!loading && filteredTables.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No matching tables found.
            </p>
          </div>
        )}
      </div>

      {/* ===== LOGIN REQUIRED DIALOG ===== */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please login to access live casino games. Without login, you cannot
              open or play any game.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoginClick}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== AUTH MODAL ===== */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
      />
    </div>
  );
};

export default LiveCasino;

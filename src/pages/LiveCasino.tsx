import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { TableCard } from "@/components/live-casino/TableCard";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Helper function to get image path from public folder
const getTableImage = (tableId: string): string => {
  const imageMap: Record<string, string> = {
    // Baccarat
    "baccarat-1": "/Malya Diamond Casino_files/baccarat.jpg",
    "baccarat-2": "/Malya Diamond Casino_files/baccarat2.jpg",
    "baccarat-3": "/Malya Diamond Casino_files/baccarat.jpg",
    "baccarat-4": "/Malya Diamond Casino_files/baccarat2.jpg",
    "baccarat-5": "/Malya Diamond Casino_files/baccarat.jpg",
    "baccarat-premium-1": "/Malya Diamond Casino_files/baccarat2.jpg",
    "baccarat-premium-2": "/Malya Diamond Casino_files/baccarat.jpg",
    "baccarat-variants-1": "/Malya Diamond Casino_files/baccarat2.jpg",
    "baccarat-variants-2": "/Malya Diamond Casino_files/baccarat.jpg",
    "baccarat-variants-3": "/Malya Diamond Casino_files/baccarat2.jpg",
    // Roulette
    "roulette-1": "/Malya Diamond Casino_files/roulette11.jpg",
    "roulette-2": "/Malya Diamond Casino_files/roulette12.jpg",
    "roulette-3": "/Malya Diamond Casino_files/roulette13.jpg",
    "roulette-4": "/Malya Diamond Casino_files/ourroullete.jpg",
    "roulette-5": "/Malya Diamond Casino_files/roulette11.jpg",
    "roulette-6": "/Malya Diamond Casino_files/roulette12.jpg",
    "roulette-premium-1": "/Malya Diamond Casino_files/roulette13.jpg",
    "roulette-premium-2": "/Malya Diamond Casino_files/ourroullete.jpg",
    "roulette-premium-3": "/Malya Diamond Casino_files/roulette11.jpg",
    "roulette-variants-1": "/Malya Diamond Casino_files/roulette12.jpg",
    "roulette-variants-2": "/Malya Diamond Casino_files/roulette13.jpg",
    "roulette-variants-3": "/Malya Diamond Casino_files/ourroullete.jpg",
    "roulette-variants-4": "/Malya Diamond Casino_files/roulette11.jpg",
    "roulette-variants-5": "/Malya Diamond Casino_files/roulette12.jpg",
    // Blackjack
    "blackjack-1": "/Malya Diamond Casino_files/btable.jpg",
    "blackjack-2": "/Malya Diamond Casino_files/btable2.jpg",
    "blackjack-3": "/Malya Diamond Casino_files/btable.jpg",
    "blackjack-4": "/Malya Diamond Casino_files/btable2.jpg",
    "blackjack-5": "/Malya Diamond Casino_files/btable.jpg",
    "blackjack-6": "/Malya Diamond Casino_files/btable2.jpg",
    "blackjack-premium-1": "/Malya Diamond Casino_files/btable.jpg",
    "blackjack-premium-2": "/Malya Diamond Casino_files/btable2.jpg",
    "blackjack-variants-1": "/Malya Diamond Casino_files/btable.jpg",
    "blackjack-variants-2": "/Malya Diamond Casino_files/btable2.jpg",
    "blackjack-variants-3": "/Malya Diamond Casino_files/btable.jpg",
    // Poker
    "poker-1": "/Malya Diamond Casino_files/poker.jpg",
    "poker-2": "/Malya Diamond Casino_files/poker20.jpg",
    "poker-3": "/Malya Diamond Casino_files/3cardj.jpg",
    "poker-4": "/Malya Diamond Casino_files/poker6.jpg",
    "poker-5": "/Malya Diamond Casino_files/poker.jpg",
    "poker-variants-1": "/Malya Diamond Casino_files/poker20.jpg",
    "poker-variants-2": "/Malya Diamond Casino_files/poker6.jpg",
    "poker-variants-3": "/Malya Diamond Casino_files/3cardj.jpg",
    // Dragon Tiger
    "dragon-tiger-1": "/Malya Diamond Casino_files/dt20.jpg",
    "dragon-tiger-2": "/Malya Diamond Casino_files/dt202.jpg",
    "dragon-tiger-3": "/Malya Diamond Casino_files/dt6.jpg",
    // Sic Bo
    "sic-bo-1": "/Malya Diamond Casino_files/sicbo.jpg",
    "sic-bo-2": "/Malya Diamond Casino_files/sicbo2.jpg",
    "sic-bo-3": "/Malya Diamond Casino_files/sicbo.jpg",
    // Andar Bahar
    "andarbahar-1": "/Malya Diamond Casino_files/ab20.jpg",
    "andarbahar-2": "/Malya Diamond Casino_files/ab3.jpg",
    "andarbahar-3": "/Malya Diamond Casino_files/ab4.jpg",
    // Teen Patti
    "teenpatti-1": "/Malya Diamond Casino_files/teen.jpg",
    "teenpatti-2": "/Malya Diamond Casino_files/teen1.jpg",
    "teenpatti-3": "/Malya Diamond Casino_files/teen120.jpg",
  };
  
  return imageMap[tableId] || "/Malya Diamond Casino_files/aaa.jpg"; // Default image
};

// Static table data - stored directly in the component
const STATIC_TABLES_DATA = [
  { id: "baccarat-1", name: "Baccarat Classic", status: "active", players: 0 },
  { id: "baccarat-2", name: "Baccarat VIP", status: "active", players: 0 },
  { id: "baccarat-3", name: "Speed Baccarat", status: "active", players: 0 },
  { id: "baccarat-4", name: "Lightning Baccarat", status: "active", players: 0 },
  { id: "baccarat-5", name: "Baccarat Control Squeeze", status: "active", players: 0 },
  { id: "roulette-1", name: "European Roulette", status: "active", players: 0 },
  { id: "roulette-2", name: "American Roulette", status: "active", players: 0 },
  { id: "roulette-3", name: "French Roulette", status: "active", players: 0 },
  { id: "roulette-4", name: "Lightning Roulette", status: "active", players: 0 },
  { id: "roulette-5", name: "Immersive Roulette", status: "active", players: 0 },
  { id: "roulette-6", name: "Speed Roulette", status: "active", players: 0 },
  { id: "blackjack-1", name: "Blackjack VIP", status: "active", players: 0 },
  { id: "blackjack-2", name: "Classic Blackjack", status: "active", players: 0 },
  { id: "blackjack-3", name: "Speed Blackjack", status: "active", players: 0 },
  { id: "blackjack-4", name: "Blackjack Party", status: "active", players: 0 },
  { id: "blackjack-5", name: "Infinite Blackjack", status: "active", players: 0 },
  { id: "blackjack-6", name: "Blackjack Live", status: "active", players: 0 },
  { id: "poker-1", name: "Texas Hold'em", status: "active", players: 0 },
  { id: "poker-2", name: "Caribbean Stud Poker", status: "active", players: 0 },
  { id: "poker-3", name: "Three Card Poker", status: "active", players: 0 },
  { id: "poker-4", name: "Casino Hold'em", status: "active", players: 0 },
  { id: "poker-5", name: "Ultimate Texas Hold'em", status: "active", players: 0 },
  { id: "dragon-tiger-1", name: "Dragon Tiger", status: "active", players: 0 },
  { id: "dragon-tiger-2", name: "Dragon Tiger Speed", status: "active", players: 0 },
  { id: "dragon-tiger-3", name: "Dragon Tiger VIP", status: "active", players: 0 },
  { id: "sic-bo-1", name: "Sic Bo", status: "active", players: 0 },
  { id: "sic-bo-2", name: "Sic Bo Classic", status: "active", players: 0 },
  { id: "sic-bo-3", name: "Sic Bo VIP", status: "active", players: 0 },
  { id: "andarbahar-1", name: "Andar Bahar", status: "active", players: 0 },
  { id: "andarbahar-2", name: "Andar Bahar Live", status: "active", players: 0 },
  { id: "andarbahar-3", name: "Andar Bahar Speed", status: "active", players: 0 },
  { id: "teenpatti-1", name: "Teen Patti", status: "active", players: 0 },
  { id: "teenpatti-2", name: "Teen Patti Live", status: "active", players: 0 },
  { id: "teenpatti-3", name: "Teen Patti VIP", status: "active", players: 0 },
  { id: "roulette-premium-1", name: "Premium Roulette", status: "active", players: 0 },
  { id: "roulette-premium-2", name: "Gold Roulette", status: "active", players: 0 },
  { id: "roulette-premium-3", name: "Diamond Roulette", status: "active", players: 0 },
  { id: "blackjack-premium-1", name: "Gold Blackjack", status: "active", players: 0 },
  { id: "blackjack-premium-2", name: "Platinum Blackjack", status: "active", players: 0 },
  { id: "baccarat-premium-1", name: "Gold Baccarat", status: "active", players: 0 },
  { id: "baccarat-premium-2", name: "Platinum Baccarat", status: "active", players: 0 },
  { id: "game-show-1", name: "Wheel of Fortune", status: "active", players: 0 },
  { id: "game-show-2", name: "Dream Catcher", status: "active", players: 0 },
  { id: "game-show-3", name: "Monopoly Live", status: "active", players: 0 },
  { id: "game-show-4", name: "Cash or Crash", status: "active", players: 0 },
  { id: "game-show-5", name: "Deal or No Deal", status: "active", players: 0 },
  { id: "game-show-6", name: "Crazy Time", status: "active", players: 0 },
  { id: "game-show-7", name: "Gonzo's Treasure Hunt", status: "active", players: 0 },
  { id: "game-show-8", name: "Mega Wheel", status: "active", players: 0 },
  { id: "roulette-variants-1", name: "Double Ball Roulette", status: "active", players: 0 },
  { id: "roulette-variants-2", name: "Triple Bonus Spin", status: "active", players: 0 },
  { id: "roulette-variants-3", name: "Auto Roulette", status: "active", players: 0 },
  { id: "roulette-variants-4", name: "Diamond Roulette Live", status: "active", players: 0 },
  { id: "roulette-variants-5", name: "VIP Roulette", status: "active", players: 0 },
  { id: "blackjack-variants-1", name: "Blackjack Azure", status: "active", players: 0 },
  { id: "blackjack-variants-2", name: "Blackjack Ruby", status: "active", players: 0 },
  { id: "blackjack-variants-3", name: "Blackjack Emerald", status: "active", players: 0 },
  { id: "baccarat-variants-1", name: "Baccarat Squeeze", status: "active", players: 0 },
  { id: "baccarat-variants-2", name: "No Commission Baccarat", status: "active", players: 0 },
  { id: "baccarat-variants-3", name: "Dragon Bonus Baccarat", status: "active", players: 0 },
  { id: "poker-variants-1", name: "Caribbean Stud Live", status: "active", players: 0 },
  { id: "poker-variants-2", name: "Oasis Poker", status: "active", players: 0 },
  { id: "poker-variants-3", name: "Pai Gow Poker", status: "active", players: 0 },
  { id: "asian-games-1", name: "Fan Tan", status: "active", players: 0 },
  { id: "asian-games-2", name: "Pai Gow", status: "active", players: 0 },
  { id: "asian-games-3", name: "Mahjong Live", status: "active", players: 0 },
  { id: "wheel-games-1", name: "Money Wheel", status: "active", players: 0 },
  { id: "wheel-games-2", name: "Big Six Wheel", status: "active", players: 0 },
  { id: "wheel-games-3", name: "Wheel of Wealth", status: "active", players: 0 },
  { id: "special-1", name: "Live Craps", status: "active", players: 0 },
  { id: "special-2", name: "Live Hold'em", status: "active", players: 0 },
  { id: "special-3", name: "Live Side Bet City", status: "active", players: 0 },
  { id: "special-4", name: "Lightning Dice", status: "active", players: 0 },
  { id: "special-5", name: "Crazy Coin Flip", status: "active", players: 0 },
  { id: "special-6", name: "Football Studio", status: "active", players: 0 },
  { id: "special-7", name: "Boom City", status: "active", players: 0 },
  { id: "special-8", name: "Sweet Bonanza Candyland", status: "active", players: 0 },
  { id: "special-9", name: "Bingo Live", status: "active", players: 0 },
  { id: "special-10", name: "Spin a Win", status: "active", players: 0 },
  { id: "exclusive-1", name: "VIP Baccarat", status: "active", players: 0 },
  { id: "exclusive-2", name: "VIP Roulette", status: "active", players: 0 },
  { id: "exclusive-3", name: "VIP Blackjack", status: "active", players: 0 },
  { id: "exclusive-4", name: "Private Table 1", status: "active", players: 0 },
  { id: "exclusive-5", name: "Private Table 2", status: "active", players: 0 },
  { id: "exclusive-6", name: "High Roller Baccarat", status: "active", players: 0 },
  { id: "exclusive-7", name: "High Roller Roulette", status: "active", players: 0 },
  { id: "exclusive-8", name: "Elite Table", status: "active", players: 0 },
];

// Add imageUrl to each table
const STATIC_TABLES = STATIC_TABLES_DATA.map(table => ({
  ...table,
  imageUrl: getTableImage(table.id)
}));

const LiveCasino = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diamond_casino_tables')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Map database records to component format
        const mappedTables = data.map((table: any) => ({
          id: table.table_id,
          name: table.table_name || table.table_id,
          status: table.status || 'active',
          players: table.player_count || 0,
          data: table.table_data,
          // Use image_url from DB, or fallback to getTableImage helper
          imageUrl: table.image_url || getTableImage(table.table_id)
        }));
        setTables(mappedTables);
      } else {
        // Fallback to static tables if DB is empty
        setTables(STATIC_TABLES);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      // Fallback to static tables on error
      setTables(STATIC_TABLES);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table: any) => {
    // Navigate to table detail page with tableId
    navigate(`/live-casino/table/${table.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 overflow-x-hidden">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-2 sm:mt-2">
        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading tables...</span>
            </CardContent>
          </Card>
        )}

        {/* Tables View */}
        {!loading && tables.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleSelectTable(table)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && tables.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No tables available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveCasino;

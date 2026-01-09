import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Teen62Betting } from "./Teen62Betting";

interface Teen62BettingBoardProps {
  bets: any[];
  locked?: boolean;
  min?: number;
  max?: number;
  onPlaceBet: (betData: {
    betType: string;
    amount: number;
    odds: number;
    roundId?: string;
    sid?: string | number;
    side?: "back" | "lay";
  }) => Promise<void>;
  odds?: any;
  resultHistory?: Array<{
    mid: string | number;
    win: "Player A" | "Player B" | "A" | "B";
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
}

const QUICK_CHIPS = [10, 50, 100, 500, 1000];

const formatOdds = (val: any) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

export const Teen62BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Teen62BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);
  const [placing, setPlacing] = useState(false);

  const handleSelect = (bet: any, side: "back" | "lay") => {
    if (!bet || locked) return;
    setSelectedBetData({ ...bet, side });
    setSelectedBet(`${bet.type || bet.nat || ""}-${side}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked || placing) return;
    
    setPlacing(true);
    try {
      const amt = parseFloat(amount);
      const side = selectedBetData?.side || "back";
      
      // Get odds based on side
      const rawOdds = side === "back" 
        ? (selectedBetData?.back ?? selectedBetData?.b ?? selectedBetData?.odds ?? 0)
        : (selectedBetData?.lay ?? selectedBetData?.l ?? 0);
      
      const oddsValue = Number(rawOdds);
      const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
      
      // Extract roundId from bet data or odds
      const roundIdFromBet = selectedBetData?.mid || selectedBetData?.round_id || selectedBetData?.round;
      const raw = odds?.rawData || odds?.raw || odds || {};
      const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                             odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
      const roundIdFromFirstBet = bets.length > 0 && (bets[0]?.mid || bets[0]?.round_id || bets[0]?.round);
      const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;
      
      await onPlaceBet({
        betType: selectedBetData?.type || selectedBetData?.nat || "",
        amount: amt,
        odds: finalOdds,
        roundId: finalRoundId,
        sid: selectedBetData?.sid,
        side: side,
      });
      
      setModalOpen(false);
      setSelectedBet("");
      setSelectedBetData(null);
      setAmount(String(min));
    } catch (error) {
      console.error("Failed to place bet:", error);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <Teen62Betting
        betTypes={bets}
        selectedBet={selectedBet}
        betType={selectedBetData?.side || "back"}
        onSelect={handleSelect}
        formatOdds={formatOdds}
        loading={locked || placing}
      />
      
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                {selectedBetData?.type || selectedBetData?.nat || "Selected Bet"}
              </Label>
              <div className="mt-1 text-sm text-muted-foreground">
                {selectedBetData?.side === "back" ? "Back" : "Lay"} @ {formatOdds(
                  selectedBetData?.side === "back" 
                    ? (selectedBetData?.back ?? selectedBetData?.b ?? selectedBetData?.odds ?? 0)
                    : (selectedBetData?.lay ?? selectedBetData?.l ?? 0)
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Quick Amount</Label>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <Button
                    key={chip}
                    size="sm"
                    variant={amount === String(chip) ? "default" : "outline"}
                    onClick={() => setAmount(String(chip))}
                    disabled={locked || placing}
                  >
                    ₹{chip}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={min}
                max={max}
                disabled={locked || placing}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handlePlace}
                disabled={!amount || parseFloat(amount) < min || parseFloat(amount) > max || locked || placing}
                className="flex-1"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  `Place Bet ₹${amount || 0}`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedBet("");
                  setSelectedBetData(null);
                }}
                disabled={placing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

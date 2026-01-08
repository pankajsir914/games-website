import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Lock, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Patti2BettingBoardProps {
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

const isSuspended = (bet: any) =>
  !bet || bet?.gstatus === "SUSPENDED" || bet?.status === "suspended";

const findBet = (bets: any[], searchTerm: string) => {
  if (!bets || bets.length === 0) return null;

  const normalized = searchTerm.toLowerCase().trim();
  return bets.find((b: any) => {
    const betName = (b.nat || b.type || "").toLowerCase().trim();
    return (
      betName === normalized ||
      betName.includes(normalized) ||
      betName.includes(`player ${normalized}`) ||
      betName.includes(`${normalized} player`)
    );
  });
};

const findMiniBaccaratBet = (bets: any[], suffix: "a" | "b") =>
  findBet(bets, `mini baccarat ${suffix}`) ||
  findBet(bets, `mini bacc ${suffix}`) ||
  findBet(bets, `mini baccarate ${suffix}`);

const getBackOdds = (bet: any) => bet?.back ?? bet?.b ?? bet?.odds ?? 0;
const getLayOdds = (bet: any) => bet?.lay ?? bet?.l ?? bet?.l1 ?? 0;

export const Patti2BettingBoard = ({
  bets = [],
  locked = false,
  min = 10,
  max = 100000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
}: Patti2BettingBoardProps) => {
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [amount, setAmount] = useState<string>(String(min));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBetData, setSelectedBetData] = useState<any>(null);

  // Player main bets
  const playerA = findBet(bets, "player a") || findBet(bets, "a");
  const playerB = findBet(bets, "player b") || findBet(bets, "b");

  // Mini Baccarat bets
  const miniBaccaratA = findMiniBaccaratBet(bets, "a");
  const miniBaccaratB = findMiniBaccaratBet(bets, "b");

  // Total bets
  const totalA = findBet(bets, "total a");
  const totalB = findBet(bets, "total b");

  // Color Plus
  const colorPlus =
    findBet(bets, "color plus") ||
    findBet(bets, "colour plus") ||
    findBet(bets, "colorplus");

  const handleBetClick = (
    bet: any,
    betName: string,
    side: "back" | "lay" = "back"
  ) => {
    if (!bet || isSuspended(bet)) return;
    setSelectedBetData({ ...bet, side });
    setSelectedBet(`${betName}-${side}`);
    setModalOpen(true);
  };

  const handlePlace = async () => {
    if (!selectedBetData || !amount || parseFloat(amount) <= 0 || locked) return;

    const amt = parseFloat(amount);
    const side = selectedBetData?.side || "back";
    const oddsValue =
      side === "back"
        ? Number(getBackOdds(selectedBetData))
        : Number(getLayOdds(selectedBetData));
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;

    const roundIdFromBet =
      selectedBetData?.mid ||
      selectedBetData?.round_id ||
      selectedBetData?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds =
      raw?.mid ||
      raw?.round_id ||
      raw?.round ||
      raw?.gmid ||
      raw?.game_id ||
      odds?.mid ||
      odds?.round_id ||
      odds?.round ||
      odds?.gmid ||
      odds?.game_id;
    const roundIdFromFirstBet =
      bets.length > 0 &&
      (bets[0]?.mid || bets[0]?.round_id || bets[0]?.round);
    const finalRoundId =
      roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType:
        selectedBetData?.nat ||
        selectedBetData?.type ||
        selectedBet.split("-")[0],
      amount: Math.min(Math.max(amt, min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBetData?.sid,
      side,
    });

    setModalOpen(false);
    setSelectedBet("");
    setAmount(String(min));
    setSelectedBetData(null);
  };

  const last10 = resultHistory.slice(0, 10);

  const renderRow = (
    label: string,
    bet: any,
    options: { allowLay?: boolean } = {}
  ) => {
    const disabled = locked || isSuspended(bet);
    const backOdds = formatOdds(getBackOdds(bet));
    const layOdds = formatOdds(getLayOdds(bet));
    const backDisabled = disabled || backOdds === "0.00";
    const layDisabled =
      disabled || !options.allowLay || layOdds === "0.00";

    return (
      <>
        <div className="px-1 sm:px-2 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold">
          {label}
        </div>

        {/* Back cell */}
        <div className="px-1 sm:px-2 py-1.5 sm:py-2 bg-blue-400/20">
          {backDisabled ? (
            <div className="flex items-center justify-center h-[36px] sm:h-[44px] bg-gray-700 text-gray-400 rounded">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          ) : (
            <button
              onClick={() => handleBetClick(bet, label, "back")}
              className="w-full h-[36px] sm:h-[44px] rounded bg-blue-400 hover:bg-blue-500 text-white font-bold text-[10px] sm:text-xs shadow-md hover:shadow-lg"
            >
              {backOdds === "0.00" ? "0" : backOdds}
            </button>
          )}
        </div>

        {/* Lay cell */}
        <div className="px-1 sm:px-2 py-1.5 sm:py-2 bg-pink-400/20">
          {layDisabled ? (
            <div className="flex items-center justify-center h-[36px] sm:h-[44px] bg-gray-700 text-gray-400 rounded">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          ) : (
            <button
              onClick={() => handleBetClick(bet, label, "lay")}
              className="w-full h-[36px] sm:h-[44px] rounded bg-pink-400 hover:bg-pink-500 text-white font-bold text-[10px] sm:text-xs shadow-md hover:shadow-lg"
            >
              {layOdds === "0.00" ? "0" : layOdds}
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <Card className="border border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Patti2 Bets
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {QUICK_CHIPS.map((chip) => (
                <Button
                  key={chip}
                  size="sm"
                  variant="outline"
                  disabled={locked}
                  onClick={() =>
                    setAmount((prev) => {
                      const current = Number(prev) || 0;
                      const next = current + chip;
                      return String(next);
                    })
                  }
                  className="text-[10px] sm:text-xs px-2 sm:px-3"
                >
                  ₹{chip}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Player A / Player B section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              {
                label: "Player A",
                mainBet: playerA,
                miniBaccarat: miniBaccaratA,
                total: totalA,
                suffix: "A",
              },
              {
                label: "Player B",
                mainBet: playerB,
                miniBaccarat: miniBaccaratB,
                total: totalB,
                suffix: "B",
              },
            ].map(({ label, mainBet, miniBaccarat, total, suffix }) => (
              <div
                key={label}
                className="border rounded-lg overflow-hidden bg-muted/20"
              >
                {/* Header */}
                <div className="bg-gray-200/60 text-gray-900 font-bold text-center py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm">
                  {label}
                </div>

                {/* Inner grid: label + Back/Lay */}
                <div className="p-1 sm:p-2">
                  <div className="grid grid-cols-[minmax(80px,1.2fr)_1fr_1fr] gap-y-1.5 sm:gap-y-2 text-[10px] sm:text-xs">
                    {/* Back/Lay header row */}
                    <div />
                    <div className="text-center bg-blue-400 text-white font-semibold py-1 rounded">
                      Back
                    </div>
                    <div className="text-center bg-pink-400 text-white font-semibold py-1 rounded">
                      Lay
                    </div>

                    {/* Main row */}
                    {renderRow("Main", mainBet, { allowLay: true })}

                    {/* Mini Baccarat row (only Back effectively, Lay locked) */}
                    {renderRow(`Mini Baccarat ${suffix}`, miniBaccarat, {
                      allowLay: false,
                    })}

                    {/* Total row */}
                    {renderRow(`Total ${suffix}`, total, { allowLay: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Color Plus row */}
          <div className="pt-2 border-t border-border/50">
            <div className="bg-slate-800 text-white rounded flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
              <div className="font-bold text-sm sm:text-base">
                Color Plus
              </div>
              {locked || isSuspended(colorPlus) || formatOdds(getBackOdds(colorPlus)) === "0.00" ? (
                <div className="flex-1 flex items-center justify-center">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleBetClick(
                      colorPlus,
                      colorPlus?.nat || colorPlus?.type || "Color Plus",
                      "back"
                    )
                  }
                  className="ml-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg"
                >
                  {formatOdds(getBackOdds(colorPlus))}
                </button>
              )}
            </div>
          </div>

          {/* Amount Input and Place Bet */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="flex-1 sm:max-w-[160px]"
                placeholder="Enter amount"
              />
              <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                Min ₹{min} · Max ₹{max}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-center sm:text-left">
              Total: <span className="font-semibold">₹{parseFloat(amount) || 0}</span>
            </div>
          </div>

          {/* Last 10 Results */}
          {last10.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs mb-2 text-muted-foreground">Last 10 Results</p>
              <div className="flex gap-1 flex-wrap">
                {last10.map((r, i) => {
                  const winner =
                    r.win === "Player A" || r.win === "A" ? "A" : "B";
                  const isPlayerA = winner === "A";
                  return (
                    <Button
                      key={i}
                      size="sm"
                      variant="outline"
                      className={`w-9 h-9 p-0 font-bold ${
                        isPlayerA
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-red-500 text-white border-red-600"
                      }`}
                      onClick={() => onResultClick?.(r)}
                    >
                      {winner}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bet Confirmation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Bet Type</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {selectedBetData?.nat ||
                  selectedBetData?.type ||
                  selectedBet.split("-")[0]}
              </div>
            </div>

            <div>
              <Label>Side</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold uppercase">
                {selectedBetData?.side || "back"}
              </div>
            </div>

            <div>
              <Label>Odds</Label>
              <div className="mt-1 p-2 bg-muted rounded-md font-semibold">
                {selectedBetData?.side === "lay"
                  ? formatOdds(getLayOdds(selectedBetData))
                  : formatOdds(getBackOdds(selectedBetData))}
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Potential Win</div>
              <div className="text-lg font-bold">
                ₹
                {(
                  (parseFloat(amount) || 0) *
                  (() => {
                    const side = selectedBetData?.side || "back";
                    const oddsValue =
                      side === "back"
                        ? Number(getBackOdds(selectedBetData))
                        : Number(getLayOdds(selectedBetData));
                    return oddsValue > 1000
                      ? oddsValue / 100000
                      : oddsValue;
                  })()
                ).toFixed(2)}
              </div>
            </div>

            <Button
              className="w-full"
              disabled={locked || !selectedBetData || parseFloat(amount) <= 0}
              onClick={handlePlace}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Place Bet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};



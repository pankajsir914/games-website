// src/pages/tables/MogamboBetting.tsx

import { useState, useEffect, useMemo } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */

interface MogamboBettingProps {
  betTypes: any[];
  onPlaceBet: (payload: any) => Promise<void>;
  loading?: boolean;
  table?: any; // Table information for bet placement
  formatOdds?: (val: any) => string; // Optional odds formatter
  odds?: any; // Full odds object in case bets are nested
}

/* ================= HELPERS ================= */

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? bet.l ?? 0;
};

// Format odds value
const formatOddsValue = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};
 
// Check if bet is suspended or locked
const isSuspended = (b: any) => {
  if (!b) return true;
  if (b?.gstatus === "SUSPENDED" || b?.status === "suspended") return true;
  const odds = getOdds(b);
  const oddsValue = formatOddsValue(odds);
  // If odds are 0 or "0.00", consider it suspended
  if (oddsValue === "0.00" || Number(odds) === 0) return true;
  return false;
};

const byNat = (bets: any[], nat: string) => {
  if (!bets || !Array.isArray(bets)) {
    console.warn("⚠️ [byNat] bets is not an array:", bets);
    return undefined;
  }
  
  // Try to find by nat field (exact match, case-insensitive)
  let found = bets.find(
    (b) => (b.nat || "").toLowerCase().trim() === nat.toLowerCase().trim()
  );
  
  // If not found, try by type field
  if (!found) {
    found = bets.find(
      (b) => (b.type || "").toLowerCase().trim() === nat.toLowerCase().trim()
    );
  }
  
  // If still not found, try partial match
  if (!found) {
    const searchLower = nat.toLowerCase().trim();
    found = bets.find((b) => {
      const betNat = (b.nat || "").toLowerCase().trim();
      const betType = (b.type || "").toLowerCase().trim();
      return betNat.includes(searchLower) || searchLower.includes(betNat) ||
             betType.includes(searchLower) || searchLower.includes(betType);
    });
  }
  
  if (!found) {
    console.warn(`⚠️ [byNat] Bet not found for "${nat}". Available bets:`, 
      bets.map(b => ({ nat: b.nat, type: b.type, sid: b.sid }))
    );
  }
  
  return found;
};

/* ================= COMPONENT ================= */

export const MogamboBetting = ({
  betTypes = [],
  onPlaceBet,
  loading = false,
  table,
  formatOdds = formatOddsValue,
  odds,
}: MogamboBettingProps) => {
  /* ---------- EXTRACT BETS FROM MULTIPLE SOURCES ---------- */
  // Try to get bets from multiple possible locations
  const actualBetTypes = useMemo(() => {
    // First try: betTypes prop (already an array)
    if (Array.isArray(betTypes) && betTypes.length > 0) {
      return betTypes;
    }
    
    // Second try: odds?.bets
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      console.log("✅ [Mogambo] Found bets in odds.bets");
      return odds.bets;
    }
    
    // Third try: odds?.data?.sub (API structure)
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      console.log("✅ [Mogambo] Found bets in odds.data.sub");
      return odds.data.sub;
    }
    
    // Fourth try: odds?.sub
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      console.log("✅ [Mogambo] Found bets in odds.sub");
      return odds.sub;
    }
    
    console.warn("⚠️ [Mogambo] No bets found in any location", { betTypes, odds });
    return betTypes || [];
  }, [betTypes, odds]);
  
  /* ---------- BETS ---------- */
  
  // First, log the raw betTypes to see what we're getting
  useEffect(() => {
    console.log("📊 [Mogambo] Bet extraction:", {
      betTypesLength: betTypes?.length || 0,
      actualBetTypesLength: actualBetTypes?.length || 0,
      oddsStructure: odds ? Object.keys(odds) : null,
      oddsDataSub: odds?.data?.sub?.length || 0,
      oddsBets: odds?.bets?.length || 0,
      oddsSub: odds?.sub?.length || 0,
      firstFewBets: actualBetTypes?.slice(0, 3) || [],
    });
  }, [betTypes, actualBetTypes, odds]);

  const mogambo = byNat(actualBetTypes, "Mogambo");
  const dagaTeja = byNat(actualBetTypes, "Daga / Teja");
  const cardTotal = byNat(actualBetTypes, "3 Card Total");

  /* ---------- CONSOLE LOG ODDS ---------- */
  // Log odds whenever betTypes change
  useEffect(() => {
    console.log("🎰 [Mogambo Betting] Full Data:", {
      betTypesLength: betTypes?.length || 0,
      betTypesStructure: betTypes,
      betTypesSample: betTypes?.slice(0, 3)?.map((b: any) => ({
        nat: b?.nat,
        type: b?.type,
        sid: b?.sid,
        b: b?.b,
        back: b?.back,
        odds: b?.odds,
        gstatus: b?.gstatus,
        allKeys: Object.keys(b || {})
      })),
      mogambo: {
        bet: mogambo,
        odds: getOdds(mogambo),
        formatted: formatOdds(getOdds(mogambo)),
        suspended: isSuspended(mogambo),
      },
      dagaTeja: {
        bet: dagaTeja,
        odds: getOdds(dagaTeja),
        formatted: formatOdds(getOdds(dagaTeja)),
        suspended: isSuspended(dagaTeja),
      },
      cardTotal: {
        bet: cardTotal,
        odds: getOdds(cardTotal),
        formatted: formatOdds(getOdds(cardTotal)),
        suspended: isSuspended(cardTotal),
      },
    });
  }, [actualBetTypes, mogambo, dagaTeja, cardTotal, formatOdds]);

  /* ---------- MODAL STATE ---------- */

  const [open, setOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [stake, setStake] = useState("");
  const [selectedTotal, setSelectedTotal] = useState<number | null>(null);

  /* ---------- OPEN MODAL ---------- */

  const openModal = (bet: any) => {
    if (isSuspended(bet)) return;
    setSelectedBet(bet);
    setStake("");
    setSelectedTotal(null);
    setOpen(true);
  };

  /* ---------- SUBMIT ---------- */

  const submitBet = async () => {
    if (!selectedBet || !stake) return;

    // For 3 Card Total, we need a selected total value
    const isThreeCardTotal = selectedBet?.nat?.toLowerCase().includes("3 card total");
    if (isThreeCardTotal && selectedTotal === null) return;

    // Prepare bet payload matching the expected structure
    const betType = isThreeCardTotal ? String(selectedTotal) : selectedBet.nat;
    
    await onPlaceBet({
      tableId: table?.id || table?.gmid || table?.data?.gmid || "",
      tableName: table?.name || table?.gname || "",
      amount: Number(stake),
      betType: betType,
      odds: getOdds(selectedBet) || 1,
      sid: selectedBet.sid,
      roundId: selectedBet.mid,
      side: "back", // Mogambo bets are always "back"
    });

    setOpen(false);
  };

  /* ---------- QUICK STAKES ---------- */

  const quickStakes = [25, 50, 100, 200, 500, 1000];

  /* ================= UI ================= */

  return (
    <>
      {/* ================= MAIN BETS ================= */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* DAGA / TEJA */}
        <button
          onClick={() => openModal(dagaTeja)}
          className={`p-2 text-sm rounded border flex justify-between items-center
            ${
              isSuspended(dagaTeja)
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-100 hover:bg-blue-200"
            }`}
        >
          <span>Daga / Teja</span>
          <span className="font-bold">
            {(() => {
              const odds = getOdds(dagaTeja);
              const formatted = formatOdds(odds);
              const suspended = isSuspended(dagaTeja);
              console.log("🎯 [Daga/Teja] Display:", { odds, formatted, suspended, bet: dagaTeja });
              return suspended ? <Lock size={14} /> : formatted;
            })()}
          </span>
        </button>

        {/* MOGAMBO */}
        <button
          onClick={() => openModal(mogambo)}
          className={`p-2 text-sm rounded border flex justify-between items-center
            ${
              isSuspended(mogambo)
                ? "bg-gray-200 text-gray-500"
                : "bg-blue-100 hover:bg-blue-200"
            }`}
        >
          <span>Mogambo</span>
          <span className="font-bold">
            {(() => {
              const odds = getOdds(mogambo);
              const formatted = formatOdds(odds);
              const suspended = isSuspended(mogambo);
              console.log("🎯 [Mogambo] Display:", { odds, formatted, suspended, bet: mogambo });
              return suspended ? <Lock size={14} /> : formatted;
            })()}
          </span>
        </button>
      </div>

      {/* ================= 3 CARD TOTAL ================= */}
      <button
        onClick={() => openModal(cardTotal)}
        className={`w-full p-2 mb-3 text-sm rounded border flex justify-between items-center
          ${
            isSuspended(cardTotal)
              ? "bg-gray-200 text-gray-500"
              : "bg-pink-100 hover:bg-pink-200"
          }`}
      >
        <span>3 Card Total</span>
        <span className="font-bold">
          {(() => {
            const odds = getOdds(cardTotal);
            const formatted = formatOdds(odds);
            const suspended = isSuspended(cardTotal);
            console.log("🎯 [3 Card Total] Display:", { odds, formatted, suspended, bet: cardTotal });
            return suspended ? <Lock size={14} /> : formatted;
          })()}
        </span>
      </button>

      {/* ================= BET MODAL ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="bg-slate-800 text-white px-4 py-2 flex flex-row justify-between items-center">
            <DialogTitle className="text-sm">
              Place Bet
            </DialogTitle>
            <button onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </DialogHeader>

          <div className="bg-pink-200 p-3 text-sm">
            <div className="flex justify-between mb-2">
              <span>{selectedBet?.nat}</span>
              <span>Range: {selectedBet?.min} to {selectedBet?.max}</span>
            </div>

            {/* 3 CARD TOTAL SELECTION */}
            {selectedBet?.nat?.toLowerCase().includes("3 card total") && (
              <div className="mb-3">
                <label className="block text-xs font-semibold mb-2">
                  Select Total Value:
                </label>
                <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                  {Array.from(
                    { length: (selectedBet?.max || 39) - (selectedBet?.min || 3) + 1 },
                    (_, i) => {
                      const value = (selectedBet?.min || 3) + i;
                      return (
                        <button
                          key={value}
                          onClick={() => setSelectedTotal(value)}
                          className={`py-2 px-1 rounded text-xs font-bold ${
                            selectedTotal === value
                              ? "bg-blue-600 text-white"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    }
                  )}
                </div>
                {selectedTotal !== null && (
                  <div className="mt-2 text-xs text-gray-700">
                    Selected: <strong>{selectedTotal}</strong>
                  </div>
                )}
              </div>
            )}

            {/* INPUTS */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Input
                disabled
                value={formatOdds(getOdds(selectedBet))}
                placeholder="Odds"
              />
              <Input
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Stake"
              />
              <Input
                disabled
                value={
                  stake && selectedBet
                    ? (Number(stake) * (Number(getOdds(selectedBet)) || 0)).toFixed(2)
                    : ""
                }
                placeholder="Profit"
              />
            </div>

            {/* QUICK STAKES */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {quickStakes.map((v) => (
                <button
                  key={v}
                  onClick={() => setStake(String(v))}
                  className="bg-gray-300 py-1 rounded text-xs hover:bg-gray-400"
                >
                  +{v}
                </button>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStake("")}
              >
                Reset
              </Button>

              <Button
                size="sm"
                disabled={
                  loading ||
                  (selectedBet?.nat?.toLowerCase().includes("3 card total") &&
                    selectedTotal === null)
                }
                onClick={submitBet}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

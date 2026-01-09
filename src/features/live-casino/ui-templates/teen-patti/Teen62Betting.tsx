import { useMemo } from "react";
import { Lock } from "lucide-react";

/* =====================================================
   TYPES
===================================================== */

interface Teen62BettingProps {
  betTypes?: any[];
  selectedBet?: string;
  betType?: "back" | "lay";
  onSelect?: (bet: any, side: "back" | "lay") => void;
  formatOdds?: (val: any) => string;
  table?: any;
  onPlaceBet?: (payload: any) => Promise<void>;
  loading?: boolean;
}

const formatDefaultOdds = (val: any): string => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "0.00";
  if (num > 1000) return (num / 100000).toFixed(2);
  return num.toFixed(2);
};

/* =====================================================
   COMPONENT
===================================================== */

export const Teen62Betting = ({
  betTypes = [],
  selectedBet = "",
  betType = "back",
  onSelect,
  formatOdds = formatDefaultOdds,
}: Teen62BettingProps) => {

  /* ================= FIND BETS ================= */
  // Find Main bet (Player A or Player B) - subtype: "teen"
  const byNat = (nat: string) => {
    if (!betTypes || betTypes.length === 0) return null;
    
    const searchTerm = nat.toLowerCase().trim();
    
    // API structure: nat: "Player A" or "Player B", subtype: "teen"
    // Try exact match first
    let bet = betTypes.find((b: any) => {
      const betNat = String(b.nat || "").toLowerCase().trim();
      const hasSubtype = b.subtype === "teen";
      return hasSubtype && betNat === searchTerm;
    });
    
    // If not found, try without subtype check (fallback)
    if (!bet) {
      bet = betTypes.find((b: any) => {
        const betNat = String(b.nat || "").toLowerCase().trim();
        return betNat === searchTerm;
      });
    }
    
    return bet || null;
  };

  // Find Card bet - nat: "Card 1", "Card 2", etc., subtype: "oddeven"
  const cardBet = (n: number) => {
    if (!betTypes || betTypes.length === 0) return null;
    
    // API structure: nat: "Card 1", subtype: "oddeven"
    const bet = betTypes.find((b: any) => {
      const betNat = String(b.nat || "").toLowerCase().trim();
      const hasSubtype = b.subtype === "oddeven";
      // Match "Card 1", "Card1", "card 1", etc.
      const matchesCard = betNat === `card ${n}` || betNat === `card${n}`;
      return hasSubtype && matchesCard;
    });
    
    return bet || null;
  };

  // Find Odd/Even bet for a specific card
  // API structure: Card bet has odds array with { nat: "Odd" or "Even", b: odds, l: odds }
  const cardOddEvenBet = (cardNo: number, oddEvenType: "Odd" | "Even") => {
    if (!betTypes || betTypes.length === 0) return null;
    
    // First, find the card bet (e.g., "Card 1" with subtype "oddeven")
    const cardBetObj = cardBet(cardNo);
    
    // If card bet has odds array, look for Odd/Even in it
    if (cardBetObj && cardBetObj.oddsArray && Array.isArray(cardBetObj.oddsArray)) {
      const oddEvenObj = cardBetObj.oddsArray.find((o: any) => {
        // API structure: odds array items have nat: "Odd" or "Even"
        const nat = String(o.nat || "").toLowerCase().trim();
        return nat === oddEvenType.toLowerCase();
      });
      
      if (oddEvenObj) {
        // Return a bet-like object with the Odd/Even odds
        // API uses 'b' for back odds and 'l' for lay odds
        return {
          ...cardBetObj,
          back: oddEvenObj.b ?? 0,
          b: oddEvenObj.b ?? 0,
          lay: oddEvenObj.l ?? 0,
          l: oddEvenObj.l ?? 0,
          nat: `Card ${cardNo} ${oddEvenType}`,
          type: `Card ${cardNo} ${oddEvenType}`,
        };
      }
    }
    
    return null;
  };

  // Find Consecutive bet for Player A - subtype: "con", nat: "Player A"
  const conA = betTypes.find(
    (b: any) => {
      const hasSubtype = b.subtype === "con";
      const betNat = String(b.nat || "").toLowerCase().trim();
      return hasSubtype && betNat === "player a";
    }
  ) || betTypes.find(
    (b: any) => {
      // Fallback: try to find any bet with "Player A" and subtype containing "con"
      const betNat = String(b.nat || "").toLowerCase().trim();
      const subtype = String(b.subtype || "").toLowerCase();
      return betNat === "player a" && (subtype.includes("con") || subtype.includes("consecutive"));
    }
  );

  // Find Consecutive bet for Player B - subtype: "con", nat: "Player B"
  const conB = betTypes.find(
    (b: any) => {
      const hasSubtype = b.subtype === "con";
      const betNat = String(b.nat || "").toLowerCase().trim();
      return hasSubtype && betNat === "player b";
    }
  ) || betTypes.find(
    (b: any) => {
      // Fallback: try to find any bet with "Player B" and subtype containing "con"
      const betNat = String(b.nat || "").toLowerCase().trim();
      const subtype = String(b.subtype || "").toLowerCase();
      return betNat === "player b" && (subtype.includes("con") || subtype.includes("consecutive"));
    }
  );

  /* ================= HELPERS ================= */
  // API structure: bets have 'b' for back odds and 'l' for lay odds
  const getOdds = (bet: any, side: "back" | "lay") => {
    if (!bet) return 0;
    
    if (side === "back") {
      // API uses 'b' field for back odds
      const backOdds = bet.b ?? bet.back ?? 0;
      return Number(backOdds);
    } else {
      // API uses 'l' field for lay odds
      const layOdds = bet.l ?? bet.lay ?? 0;
      return Number(layOdds);
    }
  };

  const isSuspendedBet = (bet: any) => {
    if (!bet) return false; // Don't lock if bet doesn't exist - show as available
    // API structure: gstatus can be "OPEN" or "SUSPENDED"
    return bet.gstatus === "SUSPENDED" || bet.gstatus === "0" || bet.status === "suspended";
  };

  const isLocked = (bet: any, side: "back" | "lay") => {
    if (!bet) return false;
    const suspended = isSuspendedBet(bet);
    const odds = getOdds(bet, side);
    const oddsValue = formatOdds(odds);
    const hasZeroOdds = oddsValue === "0.00" || Number(odds) === 0;
    return suspended || hasZeroOdds;
  };

  const handleBetClick = (bet: any, side: "back" | "lay", label: string) => {
    if (!bet || !onSelect) return;
    if (isLocked(bet, side)) return;
    onSelect({ ...bet, type: label }, side);
  };

  /* ================= CELL ================= */
  const Cell = ({
    bet,
    side,
    odds,
    label,
    color,
  }: any) => {
    const locked = bet ? isLocked(bet, side) : false;
    const selected = selectedBet === label && betType === side;
    const hasBet = !!bet;
    const oddsValue = hasBet ? formatOdds(odds) : "--";
    const hasValidOdds = hasBet && odds > 0;

    return (
      <div
        onClick={() => hasBet && !locked && handleBetClick(bet, side, label)}
        className={`
          relative flex items-center justify-center
          h-8 sm:h-9
          text-[10px] sm:text-xs font-semibold
          rounded
          ${hasBet ? color : "bg-gray-300"}
          ${locked ? "opacity-40 cursor-not-allowed" : hasBet && hasValidOdds ? "cursor-pointer hover:opacity-90" : "opacity-60 cursor-not-allowed"}
          ${selected ? "ring-2 ring-yellow-400" : ""}
        `}
        title={hasBet ? `Bet found: ${label}, Odds: ${oddsValue}` : `Bet not found: ${label}`}
      >
        {oddsValue}
        {locked && (
          <Lock className="absolute w-3 h-3 text-red-500 top-0.5 right-0.5 bg-white rounded-full p-0.5" />
        )}
      </div>
    );
  };

  const playerA = byNat("Player A");
  const playerB = byNat("Player B");
  
  return (
    <div className="border rounded bg-white text-xs overflow-x-auto">
      <div className="min-w-[640px]">

        {/* HEADER */}
        <div className="grid grid-cols-[1fr_60px_60px_1fr_60px_60px] sm:grid-cols-[1fr_80px_80px_1fr_80px_80px] bg-gray-100 font-bold text-center">
          <div className="p-2 text-left">Player A</div>
          <div className="bg-sky-300 p-2">Back</div>
          <div className="bg-pink-300 p-2">Lay</div>
          <div className="p-2 text-left">Player B</div>
          <div className="bg-sky-300 p-2">Back</div>
          <div className="bg-pink-300 p-2">Lay</div>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-[1fr_60px_60px_1fr_60px_60px] sm:grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
          <div className="p-2 bg-gray-500 text-white">Main</div>
          <Cell bet={playerA} side="back" odds={getOdds(playerA, "back")} label="Player A" color="bg-sky-400" />
          <Cell bet={playerA} side="lay" odds={getOdds(playerA, "lay")} label="Player A" color="bg-pink-300" />

          <div className="p-2 bg-gray-500 text-white">Main</div>
          <Cell bet={playerB} side="back" odds={getOdds(playerB, "back")} label="Player B" color="bg-sky-400" />
          <Cell bet={playerB} side="lay" odds={getOdds(playerB, "lay")} label="Player B" color="bg-pink-300" />
        </div>

        {/* CONSECUTIVE - Always show */}
        <div className="grid grid-cols-[1fr_60px_60px_1fr_60px_60px] sm:grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
          <div className="p-2 bg-gray-500 text-white">Consecutive</div>
          <Cell bet={conA} side="back" odds={getOdds(conA, "back")} label="Consecutive A" color="bg-sky-400" />
          <Cell bet={conA} side="lay" odds={getOdds(conA, "lay")} label="Consecutive A" color="bg-pink-300" />

          <div className="p-2 bg-gray-500 text-white">Consecutive</div>
          <Cell bet={conB} side="back" odds={getOdds(conB, "back")} label="Consecutive B" color="bg-sky-400" />
          <Cell bet={conB} side="lay" odds={getOdds(conB, "lay")} label="Consecutive B" color="bg-pink-300" />
        </div>

        {/* CARD HEADER */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)] sm:grid-cols-[80px_repeat(6,1fr)] bg-gray-100 font-bold border-t">
          <div />
          {[1,2,3,4,5,6].map(c => (
            <div key={c} className="p-2 text-center bg-gray-500 text-white">
              {c}
            </div>
          ))}
        </div>

        {/* ODD / EVEN */}
        {(["Odd", "Even"] as const).map(type => (
          <div
            key={type}
            className="grid grid-cols-[60px_repeat(6,1fr)] sm:grid-cols-[80px_repeat(6,1fr)] border-t text-center"
          >
            <div className="p-2 font-bold bg-gray-500 text-white">{type}</div>
            {[1,2,3,4,5,6].map(cardNo => {
              const bet = cardOddEvenBet(cardNo, type);
              const odds = getOdds(bet, "back");
              const label = `Card ${cardNo} ${type}`;
              const locked = bet ? isLocked(bet, "back") : false;
              const selected = selectedBet === label;
              const hasBet = !!bet;
              const oddsValue = hasBet ? formatOdds(odds) : "--";
              const hasValidOdds = hasBet && odds > 0;

              return (
                <div
                  key={cardNo}
                  onClick={() => hasBet && !locked && handleBetClick(bet, "back", label)}
                  className={`
                    relative h-8 sm:h-9 flex items-center justify-center
                    font-semibold rounded
                    ${hasBet ? "bg-sky-400" : "bg-gray-300"}
                    ${locked ? "opacity-40 cursor-not-allowed" : hasBet && hasValidOdds ? "cursor-pointer hover:opacity-90" : "opacity-60 cursor-not-allowed"}
                    ${selected ? "ring-2 ring-yellow-400" : ""}
                  `}
                  title={hasBet ? `Bet found: ${label}, Odds: ${oddsValue}` : `Bet not found: ${label}`}
                >
                  {oddsValue}
                  {locked && <Lock className="absolute w-3 h-3 text-red-500 top-0.5 right-0.5 bg-white rounded-full p-0.5" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

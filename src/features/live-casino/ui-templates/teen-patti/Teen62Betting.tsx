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
  const byNat = (nat: string) =>
    betTypes.find((b: any) => (b.nat || b.type || "").toLowerCase() === nat.toLowerCase());

  const cardBet = (n: number) => {
    // Try multiple formats: "Card 1", "Card1", "card 1", etc.
    const found = betTypes.find((b: any) => {
      const nat = (b.nat || b.type || "").trim();
      const natLower = nat.toLowerCase();
      return nat === `Card ${n}` || nat === `Card${n}` || natLower === `card ${n}` || natLower === `card${n}`;
    });
    return found;
  };

  const conA = betTypes.find(
    (b: any) => b.subtype === "con" && ((b.nat || b.type || "").toLowerCase() === "player a")
  );

  const conB = betTypes.find(
    (b: any) => b.subtype === "con" && ((b.nat || b.type || "").toLowerCase() === "player b")
  );

  /* ================= GET ODDS ================= */
  const getOdds = (bet: any, side: "back" | "lay") => {
    if (!bet) return 0;
    if (side === "back") {
      return Number(bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? 0);
    } else {
      return Number(bet.lay ?? bet.l ?? bet.l1 ?? 0);
    }
  };

  /* ================= CHECK SUSPENDED ================= */
  const isSuspendedBet = (bet: any) => {
    if (!bet) return true;
    // Check status field (can be "suspended" or "open")
    if (bet.status === "suspended") return true;
    // Check gstatus field (can be "SUSPENDED", "OPEN", or "0")
    if (bet.gstatus === "SUSPENDED" || bet.gstatus === "0") return true;
    // If status is "open" or gstatus is "OPEN", it's NOT suspended - allow betting
    if (bet.status === "open" || bet.gstatus === "OPEN") return false;
    // Default: if no explicit status but bet exists, assume not suspended (allow betting)
    return false;
  };

  /* ================= HANDLERS ================= */
  const handleBetClick = (bet: any, side: "back" | "lay", label: string) => {
    if (!bet || !onSelect) return;
    
    // Check suspended status
    if (isSuspendedBet(bet)) return;

    // Pass bet with type label for BettingPanel
    onSelect({ ...bet, type: label }, side);
  };

  /* ================= CELL COMPONENT ================= */
  const Cell = ({
    bet,
    side,
    odds,
    label,
    color,
  }: {
    bet?: any;
    side: "back" | "lay";
    odds?: number;
    label: string;
    color: string;
  }) => {
    const isSuspended = isSuspendedBet(bet);
    const isSelected = selectedBet === label && betType === side;
    const displayOdds = odds && odds > 0 ? formatOdds(odds) : "--";

    return (
      <div
        onClick={() => !isSuspended && handleBetClick(bet, side, label)}
        className={`
          relative h-9 flex items-center justify-center
          text-xs font-semibold rounded
          ${color}
          ${isSuspended
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer hover:brightness-110 active:scale-95"}
          ${isSelected ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
        `}
      >
        {displayOdds}
        {isSuspended && <Lock className="absolute w-3 h-3 text-black" />}
      </div>
    );
  };

  const playerA = byNat("Player A");
  const playerB = byNat("Player B");

  return (
    <div className="border rounded-md overflow-hidden text-xs bg-white">
      {/* HEADER */}
      <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] bg-gray-100 font-bold text-center text-gray-900">
        <div className="p-2 text-left">Player A</div>
        <div className="bg-sky-300 p-2 text-gray-900">Back</div>
        <div className="bg-pink-300 p-2 text-gray-900">Lay</div>
        <div className="p-2 text-left">Player B</div>
        <div className="bg-sky-300 p-2 text-gray-900">Back</div>
        <div className="bg-pink-300 p-2 text-gray-900">Lay</div>
      </div>

      {/* MAIN */}
      <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
        <div className="p-2 bg-gray-500">Main</div>
        <Cell
          bet={playerA}
          side="back"
          odds={getOdds(playerA, "back")}
          label="Player A"
          color="bg-sky-400"
        />
        <Cell
          bet={playerA}
          side="lay"
          odds={getOdds(playerA, "lay")}
          label="Player A"
          color="bg-pink-300"
        />

        <div className="p-2 bg-gray-500">Main</div>
        <Cell
          bet={playerB}
          side="back"
          odds={getOdds(playerB, "back")}
          label="Player B"
          color="bg-sky-400"
        />
        <Cell
          bet={playerB}
          side="lay"
          odds={getOdds(playerB, "lay")}
          label="Player B"
          color="bg-pink-300"
        />
      </div>

      {/* CONSECUTIVE */}
      {(conA || conB) && (
        <div className="grid grid-cols-[1fr_80px_80px_1fr_80px_80px] border-t">
          <div className="p-2">Consecutive</div>
          <Cell
            bet={conA}
            side="back"
            odds={getOdds(conA, "back")}
            label="Consecutive A"
            color="bg-sky-400"
          />
          <Cell
            bet={conA}
            side="lay"
            odds={getOdds(conA, "lay")}
            label="Consecutive A"
            color="bg-pink-300"
          />

          <div className="p-2">Consecutive</div>
          <Cell
            bet={conB}
            side="back"
            odds={getOdds(conB, "back")}
            label="Consecutive B"
            color="bg-sky-400"
          />
          <Cell
            bet={conB}
            side="lay"
            odds={getOdds(conB, "lay")}
            label="Consecutive B"
            color="bg-pink-300"
          />
        </div>
      )}

      {/* CARD HEADER */}
      <div className="grid grid-cols-[80px_repeat(6,1fr)] bg-gray-100 font-bold text-center border-t">
        <div className="bg-gray-500" />
        {[1, 2, 3, 4, 5, 6].map((c) => (
          <div key={c} className="p-2 bg-gray-500">
            Card {c}
          </div>
        ))}
      </div>

      {/* ODD / EVEN */}
      {["Odd", "Even"].map((type) => (
        <div
          key={type}
          className="grid grid-cols-[80px_repeat(6,1fr)] border-t text-center"
        >
          <div className="p-2 font-bold bg-gray-500">{type}</div>
          {[1, 2, 3, 4, 5, 6].map((cardNo) => {
            const bet = cardBet(cardNo);
            const label = `Card ${cardNo} ${type}`;
            
            // Check if bet has nested odds array
            const oddsArray = bet?.odds;
            let oddsValue = 0;
            let oddsItem = null;

            if (Array.isArray(oddsArray) && oddsArray.length > 0) {
              // Find the Odd/Even odds from nested array - try multiple matching strategies
              oddsItem = oddsArray.find((o: any) => {
                const oNat = (o.nat || o.type || o.name || "").toLowerCase().trim();
                const typeLower = type.toLowerCase().trim();
                // Try exact match
                if (oNat === typeLower) return true;
                // Try partial match (e.g., "odd" in "card 1 odd")
                if (oNat.includes(typeLower) || typeLower.includes(oNat)) return true;
                // Try with space variations
                if (oNat === `${typeLower} card` || oNat === `card ${typeLower}`) return true;
                return false;
              });
              
              if (oddsItem) {
                // Try multiple fields for odds value
                oddsValue = Number(
                  oddsItem.b ?? 
                  oddsItem.back ?? 
                  oddsItem.odds ?? 
                  oddsItem.b1 ?? 
                  oddsItem.bs ?? 
                  0
                );
              } else {
                // If no match found, try to get first item if array has only one item
                if (oddsArray.length === 1) {
                  const firstItem = oddsArray[0];
                  oddsValue = Number(
                    firstItem.b ?? 
                    firstItem.back ?? 
                    firstItem.odds ?? 
                    firstItem.b1 ?? 
                    firstItem.bs ?? 
                    0
                  );
                }
              }
            }
            
            // If no odds from nested array, try direct odds on the bet object
            if (!oddsValue || oddsValue === 0) {
              oddsValue = getOdds(bet, "back");
            }

            // Check suspended status - if status is "open", allow betting even if odds are 0
            const isSuspended = isSuspendedBet(bet);
            const isSelected = selectedBet === label && betType === "back";
            const displayOdds = oddsValue && oddsValue > 0 ? formatOdds(oddsValue) : "--";

            // Create bet object for selection - pass the parent Card bet with type label
            const cardBetObj = bet ? {
              ...bet,
              type: label, // Set type to full label "Card X Odd/Even"
              nat: bet.nat || bet.type, // Keep original nat for reference
            } : null;

            return (
              <div
                key={cardNo}
                onClick={() => !isSuspended && cardBetObj && handleBetClick(cardBetObj, "back", label)}
                className={`
                  relative h-9 flex items-center justify-center
                  font-semibold rounded
                  ${!isSuspended
                    ? "bg-sky-400 cursor-pointer hover:brightness-110 active:scale-95"
                    : "bg-slate-500 opacity-40 cursor-not-allowed"}
                  ${isSelected ? "ring-2 ring-yellow-400 ring-offset-1" : ""}
                `}
              >
                {displayOdds}
                {isSuspended && <Lock className="absolute w-3 h-3 text-white" />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
  

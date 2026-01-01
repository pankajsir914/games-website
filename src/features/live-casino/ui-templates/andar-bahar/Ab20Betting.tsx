import { Lock } from "lucide-react";
import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ===============================
   CONSTANTS
================================ */

const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const MOBILE_FIRST_ROW = CARD_ORDER.slice(0, 6);
const MOBILE_SECOND_ROW = CARD_ORDER.slice(6);

const SUITS = ["♠", "♥", "♦", "♣"];

const suitColor = (s: string) =>
  s === "♥" || s === "♦" ? "text-red-600" : "text-black";

/* ===============================
   TYPES
================================ */

type Bet = {
  sid?: number | string;
  nat?: string;
  type?: string;
  back?: number;
  l?: number;
  odds?: number;
  gstatus?: string;
  status?: string;
  [key: string]: any;
};

/* ===============================
   COMPONENT
================================ */

const Ab20BettingComponent = ({
  betTypes = [],
  tableData,
  onSelect,
  onPlaceBet,
  formatOdds = (v: number) => v.toFixed(2),
  loading = false,
}: any) => {

  /* =========================
     STATE
  ========================= */

  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [selectedBet, setSelectedBet] = useState<any>(null);

  const [highlight, setHighlight] = useState<{
    andar: Set<string>;
    bahar: Set<string>;
  }>({
    andar: new Set(),
    bahar: new Set(),
  });

  /* =========================
     RESULT → UI MAPPING
  ========================= */

  useEffect(() => {
    if (!tableData?.card) return;

    const cards = tableData.card.split(",");
    const ares = tableData.ares?.split(",").map(Number) || [];
    const bres = tableData.bres?.split(",").map(Number) || [];

    const andarSet = new Set<string>();
    const baharSet = new Set<string>();

    cards.forEach((c: string, i: number) => {
      const rank = c.slice(0, c.length - 2);
      if (ares[i] > 0) andarSet.add(rank);
      if (bres[i] > 0) baharSet.add(rank);
    });

    setHighlight({ andar: andarSet, bahar: baharSet });
  }, [tableData]);

  /* =========================
     BET FINDER
  ========================= */

  const getBet = (side: "andar" | "bahar", card: string): Bet | null =>
    betTypes.find((b: any) => {
      const nat = (b?.nat || b?.type || "").toLowerCase();
      return nat === `${side} ${card.toLowerCase()}`;
    }) || null;

  /* =========================
     CARD CELL
  ========================= */

  const CardCell = ({ side, card }: { side: "andar" | "bahar"; card: string }) => {
    const bet = getBet(side, card);
    const suspended = bet?.gstatus === "SUSPENDED";
    const opened = highlight[side].has(card);
    const odds = bet?.back ?? bet?.l ?? bet?.odds ?? 0;

    const handleClick = () => {
      if (suspended) return;

      const payload = {
        ...bet,
        type: `${side} ${card}`,
        nat: `${side} ${card}`,
        cardSide: side,
        cardValue: card,
        odds,
      };

      setSelectedBet(payload);
      setModalOpen(true);
      onSelect?.(payload, "back");
    };

    return (
      <div
        onClick={handleClick}
        className={`
          relative w-[56px] h-[82px]
          rounded-lg flex flex-col items-center justify-between
          font-bold text-sm
          transition-colors duration-150
          ${side === "andar"
            ? "bg-[#2e1f1f] text-white hover:bg-[#3a2626]"
            : "bg-[#ffe08a] text-black hover:bg-[#ffeaad]"}
          ${opened ? "ring-2 ring-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : ""}
          ${suspended
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer"}
        `}
      >
        <div className="pt-1">{card}</div>

        <div className="grid grid-cols-2 text-[13px]">
          {SUITS.map((s) => (
            <span key={s} className={suitColor(s)}>{s}</span>
          ))}
        </div>

        <div className="pb-1 text-xs">
          {odds ? formatOdds(odds) : "--"}
        </div>

        {suspended && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
            <Lock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  /* =========================
     DESKTOP ROW
  ========================= */

  const renderDesktopRow = (side: "andar" | "bahar") => (
    <div className="space-y-2 hidden sm:block">
      <div
        className={`text-center py-2 font-bold rounded
        ${side === "andar"
          ? "bg-[#3b1f1f] text-white"
          : "bg-yellow-400 text-black"}`}
      >
        {side.toUpperCase()}
        {side === "bahar" && (
          <span className="ml-2 text-xs">(1st Card → 25%)</span>
        )}
      </div>

      <div className="flex justify-between gap-2 px-2">
        {CARD_ORDER.map((c) => (
          <CardCell key={`${side}-${c}`} side={side} card={c} />
        ))}
      </div>
    </div>
  );

  /* =========================
     MOBILE ROW (6 + 7)
  ========================= */

  const renderMobileRow = (side: "andar" | "bahar") => (
    <div className="space-y-2 sm:hidden">
      <div
        className={`text-center py-2 font-bold rounded text-sm
        ${side === "andar"
          ? "bg-[#3b1f1f] text-white"
          : "bg-yellow-400 text-black"}`}
      >
        {side.toUpperCase()}
        {side === "bahar" && (
          <span className="ml-1 text-[10px]">(1st 25%)</span>
        )}
      </div>

      <div className="flex justify-center gap-1">
        {MOBILE_FIRST_ROW.map((c) => (
          <CardCell key={`m1-${side}-${c}`} side={side} card={c} />
        ))}
      </div>

      <div className="flex justify-center gap-1">
        {MOBILE_SECOND_ROW.map((c) => (
          <CardCell key={`m2-${side}-${c}`} side={side} card={c} />
        ))}
      </div>
    </div>
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="space-y-6">

      {renderMobileRow("andar")}
      {renderDesktopRow("andar")}

      {renderMobileRow("bahar")}
      {renderDesktopRow("bahar")}

      {/* BET MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent aria-describedby="ab20-desc">
          <DialogHeader>
            <DialogTitle>
              Place Bet – {selectedBet?.cardSide?.toUpperCase()}{" "}
              {selectedBet?.cardValue}
            </DialogTitle>
            <p id="ab20-desc" className="text-xs text-muted-foreground">
              Enter amount and confirm bet
            </p>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Button
              disabled={loading}
              onClick={() => {
                onPlaceBet?.({
                  amount: Number(amount),
                  betType: selectedBet?.type,
                  odds: selectedBet?.odds,
                  sid: selectedBet?.sid,
                });
                setModalOpen(false);
              }}
              className="w-full"
            >
              Place Bet ₹{amount}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const Ab20Betting = memo(Ab20BettingComponent);

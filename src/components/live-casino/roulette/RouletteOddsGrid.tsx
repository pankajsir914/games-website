import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BetType = "number" | "column" | "dozen" | "outside";

interface BetCell {
  label: string;
  key: string;
  type: BetType;
  color?: "red" | "black" | "green" | "neutral";
  odds?: number;
  status?: string;
}

interface RouletteOddsGridProps {
  bets: any[];
  selectedBet: string;
  betType: "back" | "lay";
  onSelect: (bet: any, side: "back" | "lay") => void;
  formatOdds: (val: any) => string;
}

// Numbers with standard roulette colors (single-zero wheel)
// 0 is rendered separately as the left green cell; numbers below are 1-36
const numberCells: BetCell[] = [
  { label: "3", key: "3", type: "number", color: "red" },
  { label: "6", key: "6", type: "number", color: "black" },
  { label: "9", key: "9", type: "number", color: "red" },
  { label: "12", key: "12", type: "number", color: "red" },
  { label: "15", key: "15", type: "number", color: "black" },
  { label: "18", key: "18", type: "number", color: "red" },
  { label: "21", key: "21", type: "number", color: "red" },
  { label: "24", key: "24", type: "number", color: "black" },
  { label: "27", key: "27", type: "number", color: "red" },
  { label: "30", key: "30", type: "number", color: "red" },
  { label: "33", key: "33", type: "number", color: "black" },
  { label: "36", key: "36", type: "number", color: "red" },

  { label: "2", key: "2", type: "number", color: "black" },
  { label: "5", key: "5", type: "number", color: "red" },
  { label: "8", key: "8", type: "number", color: "black" },
  { label: "11", key: "11", type: "number", color: "black" },
  { label: "14", key: "14", type: "number", color: "red" },
  { label: "17", key: "17", type: "number", color: "black" },
  { label: "20", key: "20", type: "number", color: "black" },
  { label: "23", key: "23", type: "number", color: "red" },
  { label: "26", key: "26", type: "number", color: "black" },
  { label: "29", key: "29", type: "number", color: "black" },
  { label: "32", key: "32", type: "number", color: "red" },
  { label: "35", key: "35", type: "number", color: "black" },

  { label: "1", key: "1", type: "number", color: "red" },
  { label: "4", key: "4", type: "number", color: "black" },
  { label: "7", key: "7", type: "number", color: "red" },
  { label: "10", key: "10", type: "number", color: "black" },
  { label: "13", key: "13", type: "number", color: "black" },
  { label: "16", key: "16", type: "number", color: "red" },
  { label: "19", key: "19", type: "number", color: "red" },
  { label: "22", key: "22", type: "number", color: "black" },
  { label: "25", key: "25", type: "number", color: "red" },
  { label: "28", key: "28", type: "number", color: "black" },
  { label: "31", key: "31", type: "number", color: "black" },
  { label: "34", key: "34", type: "number", color: "red" },
];

const columnCells: BetCell[] = [
  { label: "2to1", key: "col3", type: "column", color: "neutral" },
  { label: "2to1", key: "col2", type: "column", color: "neutral" },
  { label: "2to1", key: "col1", type: "column", color: "neutral" },
];

const dozenCells: BetCell[] = [
  { label: "1st12", key: "1st12", type: "dozen", color: "neutral" },
  { label: "2nd12", key: "2nd12", type: "dozen", color: "neutral" },
  { label: "3rd12", key: "3rd12", type: "dozen", color: "neutral" },
];

const outsideCells: BetCell[] = [
  { label: "1 - 18", key: "low", type: "outside", color: "neutral" },
  { label: "Even", key: "even", type: "outside", color: "neutral" },
  { label: "Red", key: "red", type: "outside", color: "neutral" },
  { label: "Black", key: "black", type: "outside", color: "neutral" },
  { label: "Odd", key: "odd", type: "outside", color: "neutral" },
  { label: "19 - 36", key: "high", type: "outside", color: "neutral" },
];

const mapBet = (bets: any[]) => {
  const byType: Record<string, any> = {};
  bets.forEach((b: any) => {
    const key = (b.type || b.nat || b.nation || b.name || b.label || "").toString().toLowerCase();
    if (!key) return;
    byType[key] = b;
  });
  return byType;
};

const colorClasses = {
  red: "bg-red-700 text-white",
  black: "bg-black text-white",
  green: "bg-green-700 text-white",
  neutral: "bg-yellow-100 text-red-700",
};

const getKeyVariants = (key: string) => {
  const lower = key.toLowerCase();
  return [lower, lower.replace(/\s+/g, ""), lower.replace(/-/g, ""), lower.replace(/\s*-\s*/g, ""), lower.replace(/\s+/g, "-")];
};

const findBetByKey = (map: Record<string, any>, key: string) => {
  const variants = getKeyVariants(key);
  for (const v of variants) {
    if (map[v]) return map[v];
  }
  // special cases
  if (key.startsWith("col")) {
    const n = key.replace("col", "");
    if (map[`2to1col${n}`]) return map[`2to1col${n}`];
    if (map[`column${n}`]) return map[`column${n}`];
  }
  if (key === "low" && map["1to18"]) return map["1to18"];
  if (key === "high" && map["19to36"]) return map["19to36"];
  return null;
};

export const RouletteOddsGrid = ({
  bets,
  selectedBet,
  betType,
  onSelect,
  formatOdds,
}: RouletteOddsGridProps) => {
  const betMap = useMemo(() => mapBet(bets || []), [bets]);

  const renderCell = (cell: BetCell) => {
    const bet = findBetByKey(betMap, cell.key);
    const suspended = bet?.status === "suspended";
    const isSelected = selectedBet === bet?.type;
    // Show provider odds exactly as provided (prefer back, then lay, then odds)
    const rawOdds = bet?.back ?? bet?.lay ?? bet?.odds;
    const displayOdds = bet ? formatOdds(rawOdds) : "0.00";

    return (
      <Button
        key={cell.label + cell.key}
        variant="ghost"
        className={cn(
          "h-full w-full rounded-none border",
          colorClasses[cell.color || "neutral"],
          isSelected ? "ring-2 ring-primary scale-[1.01]" : "",
          suspended ? "opacity-60 cursor-not-allowed" : ""
        )}
        onClick={() => bet && !suspended && onSelect(bet, betType)}
        disabled={!bet || suspended}
      >
        <div className="flex flex-col items-center leading-tight">
          <span className="text-base font-bold">{cell.label}</span>
          <span className="text-[11px] opacity-80">{displayOdds}</span>
        </div>
      </Button>
    );
  };

  return (
    <div className="space-y-1 overflow-x-auto -mx-2 pb-2">
      <div className="min-w-[960px] md:min-w-[1100px] px-2">
        {/* Number grid 0 + 1-36 */}
        <div className="grid grid-cols-[64px_repeat(12,1fr)] sm:grid-cols-[70px_repeat(12,1fr)] md:grid-cols-[80px_repeat(12,1fr)] auto-rows-[52px] sm:auto-rows-[60px] md:auto-rows-[70px]">
          {/* Zero column */}
          <div className="row-span-3">{renderCell({ label: "0", key: "0", type: "number", color: "green" })}</div>
          {/* Row 1: 3-36 group */}
          {numberCells.slice(0, 13).map(renderCell)}
          {/* Row 2 */}
          {numberCells.slice(13, 25).map(renderCell)}
          {/* Row 3 */}
          {numberCells.slice(25).map(renderCell)}
          {/* Columns (right side) */}
          {columnCells.map(renderCell)}
        </div>

        {/* Dozens */}
        <div className="grid grid-cols-3 auto-rows-[52px] sm:auto-rows-[60px] md:auto-rows-[60px]">
          {dozenCells.map(renderCell)}
        </div>

        {/* Outside */}
        <div className="grid grid-cols-6 auto-rows-[52px] sm:auto-rows-[60px] md:auto-rows-[60px]">
          {outsideCells.map(renderCell)}
        </div>
      </div>
    </div>
  );
};


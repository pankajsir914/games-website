import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lock,
} from "lucide-react";

import { DolidanaBetting } from "@/pages/tables/DolidanaBetting";
import { Ab3Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab3Betting";
import { AbjBetting } from "@/features/live-casino/ui-templates/andar-bahar/AbjBetting";
import { Ab4Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab4Betting";
import { Ab20Betting } from "@/features/live-casino/ui-templates/andar-bahar/Ab20Betting";
import { Teen3BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen3BettingBoard";
import { Teen6BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen6BettingBoard";
import { Teen20BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen20BettingBoard";
import { Teen20BBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen20BBettingBoard";
import { Teen20CBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen20CBettingBoard";
import { Teen42BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen42BettingBoard";
import { Teen8BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen8BettingBoard";
import { TeenUniqueBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/TeenUniqueBettingBoard";
import { Teen9BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen9BettingBoard";
import { TeenBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/TeenBettingBoard";
import { Teen62BettingBoard } from "@/features/live-casino/ui-templates/teen-patti/Teen62BettingBoard";
import { TeenmufBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/TeenmufBettingBoard";
import { TeenSinBettingBoard } from "@/features/live-casino/ui-templates/teen-patti/TeenSinBettingBoard";
import { MogamboBetting } from "@/features/live-casino/ui-templates/teen-patti/MogamboBetting";
import { Joker1BettingBoard } from "@/features/live-casino/ui-templates/joker/Joker1BettingBoard";
import { Joker20BettingBoard } from "@/features/live-casino/ui-templates/joker/Joker20BettingBoard";
import { Dt6Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dt6Betting";
import { Dtl20Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dtl20Betting";
import { Dt202Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dt202Betting";
import { Dt20Betting } from "@/features/live-casino/ui-templates/dragon-tiger/Dt20Betting";
import { AaaBetting } from "@/features/live-casino/ui-templates/amar-akbar-anthony/AaaBetting";
import { Aaa2Betting } from "@/features/live-casino/ui-templates/amar-akbar-anthony/Aaa2Betting";
import { KbcBetting } from "@/features/live-casino/ui-templates/kbc/KbcBetting";
import { PokerBettingBoard } from "@/features/live-casino/ui-templates/poker/PokerBetting";
import { Poker6BettingBoard } from "@/features/live-casino/ui-templates/poker/Poker6Betting";
import { Poker20BettingBoard } from "@/features/live-casino/ui-templates/poker/Poker20Betting";
import { OurroulleteBetting } from "@/features/live-casino/ui-templates/roulette/OurroulleteBetting";
import { Roulette12Betting } from "@/features/live-casino/ui-templates/roulette/Roulette12Betting";
import { Roulette13Betting } from "@/features/live-casino/ui-templates/roulette/Roulette13Betting";
import { Roulette11Betting } from "@/features/live-casino/ui-templates/roulette/Roulette11Betting";
import { Dum10Betting } from "@/features/live-casino/ui-templates/others/Dum10Betting";
import { Cmeter1Betting } from "@/features/live-casino/ui-templates/others/Cmeter1Betting";
import { Race2Betting } from "@/features/live-casino/ui-templates/others/Race2Betting";
import { Teen120Betting } from "@/features/live-casino/ui-templates/others/Teen120Betting";
import { NotenumBetting } from "@/features/live-casino/ui-templates/others/NotenumBetting";
import { TrioBetting } from "@/features/live-casino/ui-templates/others/TrioBetting";
import { Race17Betting } from "@/features/live-casino/ui-templates/others/Race17Betting";
import { Patti2Betting } from "@/features/live-casino/ui-templates/others/Patti2Betting";
import { TrapBetting } from "@/features/live-casino/ui-templates/others/TrapBetting";
import { SuperoverBetting } from "@/features/live-casino/ui-templates/others/SuperoverBetting";
import { Lucky7eu2Betting } from "@/features/live-casino/ui-templates/others/Lucky7eu2Betting";
import { Race20Betting } from "@/features/live-casino/ui-templates/others/Race20Betting";
import { QueenBetting } from "@/features/live-casino/ui-templates/others/QueenBetting";
import { CmeterBetting } from "@/features/live-casino/ui-templates/others/CmeterBetting";
import { Cmatch20Betting } from "@/features/live-casino/ui-templates/others/Cmatch20Betting";
import { Cricketv3Betting } from "@/features/live-casino/ui-templates/others/Cricketv3Betting";
import { LottcardBetting } from "@/features/live-casino/ui-templates/others/LottcardBetting";
import { BtableBetting } from "@/features/live-casino/ui-templates/others/BtableBetting";
import { Worli2Betting } from "@/features/live-casino/ui-templates/others/Worli2Betting";
import { WorliBetting } from "@/features/live-casino/ui-templates/others/WorliBetting";
import { WarBetting } from "@/features/live-casino/ui-templates/others/WarBetting";


/* =====================================================
   GAME IDS 
===================================================== */

const DOLIDANA_TABLE_IDS = ["dolidana"];
const TEEN62_TABLE_IDS = ["teen62", "teen 62", "teen-62"];
const AB3_TABLE_IDS = ["ab3"];
const ABJ_TABLE_IDS = ["abj"];
const AB4_TABLE_IDS = ["ab4"];
const AB20_TABLE_IDS = ["ab20"];

const TEEN1_TABLE_IDS = ["teen1", "teen 1", "teen-1"];
const TEEN3_TABLE_IDS = ["teen3", "teen 3", "teen-3", "instant teen", "teen32", "teen 32", "teen-32", "teen33", "teen 33", "teen-33"];
const TEEN6_TABLE_IDS = ["teen6", "teen 6", "teen-6"];
const TEEN20_TABLE_IDS = ["teen20", "teen 20", "teen-20"];
const TEEN20B_TABLE_IDS = ["teen20b", "teen 20b", "teen-20b"];
const TEEN20C_TABLE_IDS = ["teen20c", "teen 20c", "teen-20c"];
const TEEN42_TABLE_IDS = ["teen42", "teen 42", "teen-42", "teen41", "teen 41", "teen-41"];
const TEEN8_TABLE_IDS = ["teen8", "teen 8", "teen-8"];
const TEEN_TABLE_IDS = ["teen"];
const TEEN9_TABLE_IDS = ["teen9", "teen 9", "teen-9"];
const TEENUNIQUE_TABLE_IDS = ["teenunique", "teen unique", "teen-unique"];
const TEENMUF_TABLE_IDS = ["teenmuf", "teen muf", "teen-muf"];
const TEENSIN_TABLE_IDS = ["teensin", "teen sin", "teen-sin"];
const JOKER1_TABLE_IDS = ["joker1", "joker 1", "joker-1"];
const JOKER20_TABLE_IDS = ["joker20", "joker 20", "joker-20"];
const MOGAMBO_TABLE_IDS = ["mogambo"];
const DT6_TABLE_IDS = ["dt6"];
const DTL20_TABLE_IDS = ["dtl20"];
const DT202_TABLE_IDS = ["dt202"];
const DT20_TABLE_IDS = ["dt20"];
const AAA_TABLE_IDS = ["aaa"];
const AAA2_TABLE_IDS = ["aaa2"];
const POKER6_TABLE_IDS = ["poker6", "poker-6", "poker_6"];
const POKER20_TABLE_IDS = ["poker20", "poker-20", "poker_20"];
const OURROULLETE_TABLE_IDS = ["ourroullete", "our-roullete", "our_roullete"];
const ROULETTE12_TABLE_IDS = ["roulette12", "roulette-12", "roulette_12"];
const ROULETTE13_TABLE_IDS = ["roulette13", "roulette-13", "roulette_13"];
const ROULETTE11_TABLE_IDS = ["roulette11", "roulette-11", "roulette_11"];
const KBC_TABLE_IDS = ["kbc", "k.b.c", "kaun banega crorepati"];
const DUM10_TABLE_IDS = ["dum10", "dus ka dum", "dus-ka-dum"];
const CMETER1_TABLE_IDS = ["cmeter1", "1 card meter", "1-card-meter"];
const CMETER_TABLE_IDS = ["cmeter", "casino meter"];
const RACE2_TABLE_IDS = ["race2", "race to 2nd", "race-to-2nd"];
const TEEN120_TABLE_IDS = ["teen120", "1 card 20-20", "1-card-20-20"];
const NOTENUM_TABLE_IDS = ["notenum", "note number", "note-number"];
const TRIO_TABLE_IDS = ["trio"];
const RACE17_TABLE_IDS = ["race17", "race to 17", "race-to-17"];
const PATTI2_TABLE_IDS = ["patti2", "2 cards teenpatti", "2-cards-teenpatti"];
const TRAP_TABLE_IDS = ["trap", "the trap"];
const SUPEROVER_TABLE_IDS = ["superover", "super over"];
const LUCKY7EU2_TABLE_IDS = ["lucky7eu2", "lucky 7", "lucky-7"];
const RACE20_TABLE_IDS = ["race20", "race 20", "race-20"];
const QUEEN_TABLE_IDS = ["queen"];
const CMATCH20_TABLE_IDS = ["cmatch20", "cricket match 20-20", "cricket-match-20-20"];
const CRICKETV3_TABLE_IDS = ["cricketv3", "five five cricket", "5five cricket"];
const LOTTCARD_TABLE_IDS = ["lottcard", "lottery card", "lottery"];
const BTABLE_TABLE_IDS = ["btable", "bollywood table", "bollywood-table"];
const WORLI_TABLE_IDS = ["worli"];
const WORLI2_TABLE_IDS = ["worli2", "worli 2", "instant worli"];
const WAR_TABLE_IDS = ["war", "casino war"];



const getTableId = (table: any, odds: any) =>
  odds?.tableId ||
  table?.id ||
  table?.gmid ||
  table?.data?.gmid ||
  "";

/* =====================================================
   TYPES
===================================================== */

interface BettingPanelProps {
  table: any;
  odds: any;
  onPlaceBet: (betData: any) => Promise<void>;
  loading: boolean;
  resultHistory?: any[]; // Last 10 results for display
  currentResult?: any; // Current result object (may contain results array)
}

/* =====================================================
   COMPONENT
===================================================== */

export const BettingPanel = ({
  table,
  odds,
  onPlaceBet,
  loading,
  resultHistory = [],
  currentResult,
}: BettingPanelProps) => {
  /* ---------------- STATE ---------------- */
  const [amount, setAmount] = useState<string>("100");
  const [selectedBet, setSelectedBet] = useState<string>("");
  const [betType, setBetType] = useState<"back" | "lay">("back");

  const quickAmounts = [100, 500, 1000, 5000];

  /* ---------------- RESULT HISTORY EXTRACTION ---------------- */
  // Extract resultHistory from currentResult.results if resultHistory is empty
  const finalResultHistory = useMemo(() => {
    console.log("🟡 BettingPanel - Extracting resultHistory:", {
      resultHistoryLength: resultHistory?.length,
      hasCurrentResult: !!currentResult,
      currentResultResults: currentResult?.results?.length,
    });
    
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      console.log("🟡 BettingPanel - Using resultHistory array, length:", resultHistory.length);
      return resultHistory;
    }
    if (currentResult?.results && Array.isArray(currentResult.results) && currentResult.results.length > 0) {
      console.log("🟡 BettingPanel - Using currentResult.results, length:", currentResult.results.length);
      return currentResult.results;
    }
    console.log("🟡 BettingPanel - No results found, returning empty array");
    return [];
  }, [resultHistory, currentResult]);

  /* ---------------- TABLE IDENTIFICATION ---------------- */
  const tableId = String(getTableId(table, odds)).toLowerCase();
  const tableName = String(table?.name || "").toLowerCase();
  const searchText = `${tableId} ${tableName}`.toLowerCase();
  
  const isKbc = KBC_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isDum10 = DUM10_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isCmeter1 = CMETER1_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isCmeter = CMETER_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isCmatch20 = CMATCH20_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isCricketv3 = CRICKETV3_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isRace2 = RACE2_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isTeen120 = TEEN120_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isNotenum = NOTENUM_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isTrio = TRIO_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isRace17 = RACE17_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isPatti2 = PATTI2_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isTrap = TRAP_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isSuperover = SUPEROVER_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isLucky7eu2 = LUCKY7EU2_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isRace20 = RACE20_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isQueen = QUEEN_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isLottcard = LOTTCARD_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isBtable = BTABLE_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isWorli = WORLI_TABLE_IDS.some(id => (tableId === id || tableId.includes(id)) && !tableId.includes("worli2") && !tableId.includes("worli 2") && !searchText.includes("instant worli"));
  const isWorli2 = WORLI2_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  const isWar = WAR_TABLE_IDS.some(id => tableId.includes(id) || searchText.includes(id));
  
  // For KBC, Dum10, Cmeter1, Cmeter, Cmatch20, Cricketv3, Lottcard, Btable, Worli, Worli2, War, Race2, Teen120, Notenum, Trio, Race17, Patti2, Trap, Superover, Lucky7eu2, Race20, and Queen, the data structure is different - it's in odds.data.sub or odds.data.t2
  const betTypes = (isKbc || isDum10 || isCmeter1 || isCmeter || isCmatch20 || isCricketv3 || isLottcard || isBtable || isWorli || isWorli2 || isWar || isRace2 || isTeen120 || isNotenum || isTrio || isRace17 || isPatti2 || isTrap || isSuperover || isLucky7eu2 || isRace20 || isQueen)
    ? (odds?.data || odds || {})
    : (odds?.bets || []);
  const hasLayOdds = !isKbc && Array.isArray(betTypes) && betTypes.some(
    (b: any) => b?.lay || b?.l1 || b?.l || b?.side === "lay"
  );
  const isDolidana = DOLIDANA_TABLE_IDS.includes(tableId);
  const isAb3 = AB3_TABLE_IDS.includes(tableId);
  const isAbj = ABJ_TABLE_IDS.includes(tableId);
  const isAb4 = AB4_TABLE_IDS.includes(tableId);
  const isAb20 = AB20_TABLE_IDS.includes(tableId);
  const isTeen1 = TEEN1_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen3 = TEEN3_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen6 = TEEN6_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen20 = TEEN20_TABLE_IDS.some(id => tableId.includes(id) && !tableId.includes("teen20c") && !tableId.includes("teen20v1") && !tableId.includes("teen20b"));
  const isTeen20B = TEEN20B_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen20C = TEEN20C_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen42 = TEEN42_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen8 = TEEN8_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen9 = TEEN9_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen62 = TEEN62_TABLE_IDS.some(id => tableId.includes(id));
  const isJoker1 = JOKER1_TABLE_IDS.some(id => tableId.includes(id));
  const isJoker20 = JOKER20_TABLE_IDS.some(id => tableId.includes(id));
    const isTeenmuf = TEENMUF_TABLE_IDS.some(id => tableId.includes(id));
  const isTeensin = TEENSIN_TABLE_IDS.some(id => tableId.includes(id));
  const isTeen = TEEN_TABLE_IDS.some(id => tableId === id || tableId.includes(id)) && 
    !tableId.includes("teen1") && !tableId.includes("teen3") && !tableId.includes("teen6") && !tableId.includes("teen8") && 
    !tableId.includes("teen9") && !tableId.includes("teen20") && !tableId.includes("teen42") &&
    !tableId.includes("teen62") && !tableId.includes("teen120") && !tableId.includes("teenunique") && !tableId.includes("teenmuf") && !tableId.includes("teensin");
  const isTeenUnique = TEENUNIQUE_TABLE_IDS.some(id => tableId.includes(id));
  
  const isMogambo = MOGAMBO_TABLE_IDS.includes(tableId);
  const isDt6 = DT6_TABLE_IDS.includes(tableId);
  const isDt202 = DT202_TABLE_IDS.includes(tableId);
  const isDt20 = DT20_TABLE_IDS.includes(tableId);
  const isAaa = AAA_TABLE_IDS.includes(tableId);
  const isAaa2 = AAA2_TABLE_IDS.includes(tableId);
  const isOurroullete = OURROULLETE_TABLE_IDS.includes(tableId) || 
                        searchText.includes("ourroullete") ||
                        searchText.includes("our-roullete") ||
                        searchText.includes("our_roullete");
  const isRoulette12 = ROULETTE12_TABLE_IDS.includes(tableId) || 
                       searchText.includes("roulette12") ||
                       searchText.includes("roulette-12") ||
                       searchText.includes("roulette_12");
  const isRoulette13 = ROULETTE13_TABLE_IDS.includes(tableId) || 
                       searchText.includes("roulette13") ||
                       searchText.includes("roulette-13") ||
                       searchText.includes("roulette_13");
  const isRoulette11 = ROULETTE11_TABLE_IDS.includes(tableId) || 
                       searchText.includes("roulette11") ||
                       searchText.includes("roulette-11") ||
                       searchText.includes("roulette_11");
  // DTL20 matching - flexible to catch variations
  const isDtl20 = DTL20_TABLE_IDS.includes(tableId) || 
                  tableId.includes("dtl20") || 
                  tableId === "dtl20";
  // Poker detection - check tableId and tableName
  const isPoker6 = POKER6_TABLE_IDS.includes(tableId) || 
                   POKER6_TABLE_IDS.some(id => searchText.includes(id)) ||
                   searchText.includes("poker6") || 
                   searchText.includes("poker-6") || 
                   searchText.includes("poker_6");
  const isPoker20 = POKER20_TABLE_IDS.includes(tableId) || 
                    POKER20_TABLE_IDS.some(id => searchText.includes(id)) ||
                    searchText.includes("poker20") || 
                    searchText.includes("poker-20") || 
                    searchText.includes("poker_20");
  const isPoker = searchText.includes("poker") && !isPoker6 && !isPoker20;

  /* ---------------- AB4 BET NORMALIZER (TEMPORARY FIX) ---------------- */
  // If AB4 API returns only 1 generic bet, normalize it to 26 card-wise bets
  let normalizedBetTypes = betTypes;
  if (isAb4 && betTypes.length === 1 && betTypes[0]?.nat?.includes("Card")) {
    const baseBet = betTypes[0];
    const baseOdds = baseBet.back || baseBet.b || baseBet.b1 || baseBet.odds || baseBet.l || 0;
    const baseSid = baseBet.sid || 1; 
    
    const CARD_ORDER = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    normalizedBetTypes = [];
    
    // Generate Andar bets (sid 1-13)
    CARD_ORDER.forEach((card, idx) => {
      normalizedBetTypes.push({
        ...baseBet,
        sid: baseSid + idx,
        nat: `Andar ${card}`,
        type: `Andar ${card}`,
        back: baseOdds,
        b: baseOdds,
        b1: baseOdds,
        odds: baseOdds,
        l: baseOdds,
      });
    });
    
    // Generate Bahar bets (sid 14-26)
    CARD_ORDER.forEach((card, idx) => {
      normalizedBetTypes.push({
        ...baseBet,
        sid: baseSid + 13 + idx,
        nat: `Bahar ${card}`,
        type: `Bahar ${card}`,
        back: baseOdds,
        b: baseOdds,
        b1: baseOdds,
        odds: baseOdds,
        l: baseOdds,
      });
    });
    
    console.log("🔄 [AB4 Normalizer] Generated 26 bets from 1 bet:", {
      original: baseBet.nat,
      generated: normalizedBetTypes.length,
      sample: normalizedBetTypes.slice(0, 3).map((b: any) => b.nat),
    });
  }

  /* ---------------- FLAGS ---------------- */
  const isRestricted = table?.status === "restricted";

  const hasRealOdds = (isKbc || isDum10 || isCmeter1 || isCmeter || isCmatch20 || isCricketv3 || isLottcard || isBtable || isWorli || isWorli2 || isWar || isRace2 || isTeen120 || isNotenum || isTrio || isRace17 || isPatti2 || isTrap || isSuperover || isLucky7eu2 || isRace20 || isQueen)
    ? (betTypes?.sub && Array.isArray(betTypes.sub) && betTypes.sub.length > 0) || (betTypes?.t2 && Array.isArray(betTypes.t2) && betTypes.t2.length > 0)
    : (Array.isArray(betTypes) && betTypes.length > 0 &&
        betTypes.some((b: any) => {
          const back = b?.back ?? b?.odds ?? 0;
          const lay = b?.lay ?? 0;
          return back > 0 || lay > 0 || (b?.type && b.type.trim() !== "");
        }));

  /* =====================================================
     HELPERS
  ===================================================== */

  const formatOdds = (val: any) => {
    if (val === null || val === undefined || val === "") return "0.00";
    const num = Number(val);
    if (isNaN(num) || num === 0) return "0.00";
    if (num > 1000) return (num / 100000).toFixed(2);
    return num.toFixed(2);
  };

  const getSelectedBetOdds = () => {
    // Try to find bet by type first
    let bet = betTypes.find((b: any) => b.type === selectedBet);
    
    // If not found, try to find by nat (for Teen62Betting)
    if (!bet && selectedBet) {
      if (selectedBet === "Player A" || selectedBet === "Player B") {
        bet = betTypes.find((b: any) => 
          (b.nat || "").toLowerCase() === selectedBet.toLowerCase()
        );
      } else if (selectedBet.startsWith("Consecutive")) {
        const player = selectedBet.includes("A") ? "Player A" : "Player B";
        bet = betTypes.find((b: any) => 
          b.subtype === "con" && (b.nat || "").toLowerCase() === player.toLowerCase()
        );
      } else if (selectedBet.startsWith("Card")) {
        // Extract card number from "Card X Odd" or "Card X Even"
        const match = selectedBet.match(/Card (\d+)/);
        if (match) {
          const cardNo = parseInt(match[1]);
          bet = betTypes.find((b: any) => b.nat === `Card ${cardNo}`);
          if (bet && bet.oddsArray) {
            const type = selectedBet.includes("Odd") ? "Odd" : "Even";
            const oddsObj = bet.oddsArray.find((x: any) => x.nat === type);
            if (oddsObj) {
              const raw = oddsObj.b;
              const num = Number(raw);
              if (!num || isNaN(num)) return 1;
              return num > 1000 ? num / 100000 : num;
            }
          }
        }
      }
    }

    if (!bet) return 1;

    const raw =
      betType === "back"
        ? bet?.back ?? bet?.b ?? bet?.odds
        : bet?.lay ?? bet?.l ?? bet?.back ?? bet?.b ?? bet?.odds;

    const num = Number(raw);
    if (!num || isNaN(num)) return 1;
    return num > 1000 ? num / 100000 : num;
  };

  const handleSelectBet = (bet: any, side: "back" | "lay") => {
    if (!bet || bet.status === "suspended" || bet.gstatus === "SUSPENDED") return;
    
    // Use bet.type if available, otherwise construct from bet data
    const betTypeLabel = bet.type || bet.nat || "";
    if (!betTypeLabel) return;
    
    setSelectedBet(betTypeLabel);
    setBetType(side);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0) return;

    // Find bet - handle Card bets specially
    let bet = betTypes.find((b: any) => b.type === selectedBet);
    
    // If not found, try to find by nat (for Teen62Betting)
    if (!bet && selectedBet) {
      if (selectedBet === "Player A" || selectedBet === "Player B") {
        bet = betTypes.find((b: any) => 
          (b.nat || "").toLowerCase() === selectedBet.toLowerCase()
        );
      } else if (selectedBet.startsWith("Consecutive")) {
        const player = selectedBet.includes("A") ? "Player A" : "Player B";
        bet = betTypes.find((b: any) => 
          b.subtype === "con" && (b.nat || "").toLowerCase() === player.toLowerCase()
        );
      } else if (selectedBet.startsWith("Card")) {
        // Extract card number from "Card X Odd" or "Card X Even"
        const match = selectedBet.match(/Card (\d+)/);
        if (match) {
          const cardNo = parseInt(match[1]);
          bet = betTypes.find((b: any) => (b.nat || b.type) === `Card ${cardNo}`);
        }
      }
    }

    await onPlaceBet({
      tableId: table.id,
      tableName: table.name,
      amount: parseFloat(amount),
      betType: selectedBet,
      odds: getSelectedBetOdds(),
      roundId: bet?.mid,
      sid: bet?.sid,
      side: betType,
    });

    setAmount("100");
    setSelectedBet("");
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Place Your Bet
          {hasRealOdds && (
            <Badge
              variant="outline"
              className="text-green-500 border-green-500"
            >
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* RESTRICTED */}
        {isRestricted && (
          <div className="flex gap-2 p-2 bg-red-500/10 rounded text-xs text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Betting disabled
          </div>
        )}

        {/* ================= BETTING UI ================= */}
        {!isRestricted && (hasRealOdds || isDtl20 || isOurroullete || isRoulette12 || isRoulette13 || isRoulette11 || isKbc || isDum10 || isCmeter1 || isCmeter || isCmatch20 || isCricketv3 || isLottcard || isBtable || isWorli || isWorli2 || isWar || isRace2 || isTeen120 || isNotenum || isTrio || isRace17 || isPatti2 || isTrap || isSuperover || isLucky7eu2 || isRace20 || isQueen) && (
          <>
            {isKbc ? (
              <KbcBetting
                betTypes={betTypes}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // KbcBetting sends {sid, ssid, odds, nat, amount, subtype}, convert to expected format
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || "",
                    odds: payload.odds || 1,
                    roundId: odds?.data?.mid || odds?.mid,
                    sid: payload.sid,
                    ssid: payload.ssid,
                    side: "back",
                  });
                }}
                loading={loading}
                resultHistory={resultHistory}
                tableId={tableId}
              />
            ) : isDum10 ? (
              <Dum10Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Dum10Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isCmeter1 ? (
              <Cmeter1Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Cmeter1Betting sends {sid, odds, nat, amount}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isCmeter ? (
              <CmeterBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // CmeterBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isCmatch20 ? (
              <Cmatch20Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Cmatch20Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isRace2 ? (
              <Race2Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Race2Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isTeen120 ? (
              <Teen120Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                resultHistory={finalResultHistory}
                onResultClick={(r) => console.log("Teen120 result", r)}
                tableId={tableId}
                onPlaceBet={async (payload) => {
                  // Teen120Betting sends {sid, odds, nat, amount}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isNotenum ? (
              <NotenumBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // NotenumBetting sends {sid, ssid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    ssid: payload.ssid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isTrio ? (
              <TrioBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // TrioBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isRace17 ? (
              <Race17Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Race17Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isPatti2 ? (
              <Patti2Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Patti2Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isCricketv3 ? (
              <Cricketv3Betting
                betTypes={[]}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Cricketv3Betting sends {sid, psid, mid, odds, nat, amount, side}, convert to expected format
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || "",
                    odds: payload.odds || 1,
                    roundId: payload.mid || odds?.data?.t1?.gmid || odds?.gmid,
                    sid: payload.sid,
                    psid: payload.psid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isTrap ? (
              <TrapBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // TrapBetting sends {sid, ssid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    ssid: payload.ssid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isSuperover ? (
              <SuperoverBetting
                betTypes={[]}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // SuperoverBetting sends {sid, psid, mid, odds, nat, amount, side}, convert to expected format
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || "",
                    odds: payload.odds || 1,
                    roundId: payload.mid || odds?.data?.t1?.gmid || odds?.gmid,
                    sid: payload.sid,
                    psid: payload.psid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isLucky7eu2 ? (
              <Lucky7eu2Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Lucky7eu2Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isRace20 ? (
              <Race20Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Race20Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isQueen ? (
              <QueenBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // QueenBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isLottcard ? (
              <LottcardBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // LottcardBetting sends {sid, odds, nat, amount, side, number, betType}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid || b.nat === payload.betType);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || `${payload.betType} ${payload.number}` || "",
                    odds: payload.odds || bet?.b || bet?.back || 1,
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid || bet?.sid,
                    side: payload.side || "back",
                    number: payload.number,
                    lottcardBetType: payload.betType,
                  });
                }}
                loading={loading}
              />
            ) : isBtable ? (
              <BtableBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // BtableBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid || bet?.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isWorli ? (
              <WorliBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // WorliBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid) || allBets[0]; // Fallback to first bet if specific sid not found
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid || bet?.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isWorli2 ? (
              <Worli2Betting
                betTypes={betTypes?.sub || []}
                odds={odds}
                onPlaceBet={async (payload) => {
                  // Worli2Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid) || allBets[0];
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid || bet?.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isWar ? (
              <WarBetting
                betTypes={betTypes?.sub || []}
                odds={odds}
                resultHistory={resultHistory}
                onPlaceBet={async (payload) => {
                  // WarBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const allBets = betTypes?.sub || [];
                  const bet = allBets.find((b: any) => b.sid === payload.sid) || allBets[0]; // Fallback to first bet if specific sid not found
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: odds?.data?.mid || odds?.mid || bet?.mid,
                    sid: payload.sid || bet?.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isTeen ? (
              <TeenBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen result", r)}
              />
            ) : isTeen9 ? (
              <Teen9BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen9 result", r)}
              />
            ) : isTeenUnique ? (
              <TeenUniqueBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
              />
            ) : isTeen8 ? (
              <Teen8BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen8 result", r)}
              />
            ) : isTeen42 ? (
              <Teen42BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen42 result", r)}
              />
            ) : isTeen20 ? (
              <Teen20BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen20 result", r)}
              />
            ) : isTeen20B ? (
              <Teen20BBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen20B result", r)}
                tableId={tableId}
              />
            ) : isTeen20C ? (
              <Teen20CBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen20C result", r)}
              />
            ) : isTeen6 ? (
              <Teen6BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen6 result", r)}
              />
            ) : isTeen1 ? (
              <TeenBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen1 result", r)}
                tableId={tableId}
              />
            ) : isTeen3 ? (
              <Teen3BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen3 result", r)}
                tableId={tableId}
              />
             ) : isTeenmuf ? (
              <TeenmufBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={finalResultHistory}
                onResultClick={(r) => console.log("Teenmuf result", r)}
              />
            ) : isTeensin ? (
              <TeenSinBettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={finalResultHistory}
                onResultClick={(r) => console.log("TeenSin result", r)}
              />
            ) : isJoker1 ? (
              <Joker1BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Joker1 result", r)}
              />
            ) : isJoker20 ? (
              <Joker20BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Joker20 result", r)}
              />
            ) : isTeen62 ? (
              <Teen62BettingBoard
                bets={betTypes}
                locked={loading}
                min={table?.min || 10}
                max={table?.max || 100000}
                onPlaceBet={onPlaceBet}
                odds={odds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("Teen62 result", r)}
              />
            ) : isDolidana ? (
              <DolidanaBetting
                betTypes={betTypes}
                selectedBet={selectedBet}
                betType={betType}
                onSelect={handleSelectBet}
                formatOdds={formatOdds}
              />
            ) : isAb3 ? (
              <Ab3Betting
                betTypes={betTypes}
                selectedBet={selectedBet}
                betType={betType}
                onSelect={handleSelectBet}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                amount={amount}
                onAmountChange={setAmount}
                onPlaceBet={handlePlaceBet}
                loading={loading}
              />
            ) : isAbj ? (
              <AbjBetting
                betTypes={betTypes}
                selectedBet={selectedBet}
                onSelect={(b) => setSelectedBet(b.type)}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                onResultClick={(r) => console.log("ABJ result", r)}
                amount={amount}
                onAmountChange={setAmount}
                onPlaceBet={onPlaceBet}
                loading={loading}
                odds={odds}
              />
            ) : isAb4 ? (   
              <Ab4Betting
                betTypes={normalizedBetTypes}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                onPlaceBet={onPlaceBet}
                loading={loading}
              />
            ) : isAb20 ? (
              <Ab20Betting
                betTypes={betTypes}
                selectedBet={selectedBet}
                formatOdds={formatOdds}
                resultHistory={resultHistory}
                onPlaceBet={onPlaceBet}
                loading={loading}
              />
            ) : isMogambo ? (
              <MogamboBetting
                betTypes={betTypes}
                onPlaceBet={onPlaceBet}
                loading={loading}
                table={table}
                formatOdds={formatOdds}
                odds={odds}
              />
            ) : isDt6 ? (
              <Dt6Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dt6Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
                resultHistory={finalResultHistory}
                currentResult={currentResult}
                tableId={table.id}
              />
            ) : isDtl20 ? (
              <Dtl20Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dtl20Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
                formatOdds={formatOdds}
              />
            ) : isDt202 ? (
              <Dt202Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dt202Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isDt20 ? (
              <Dt20Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Dt20Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isAaa ? (
              <AaaBetting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // AaaBetting sends {sid, odds, nat, amount, side}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isAaa2 ? (
              <Aaa2Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Aaa2Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const bet = betTypes.find((b: any) => b.sid === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.type || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isPoker6 ? (
              <Poker6BettingBoard
                bets={betTypes}
                locked={loading}
                min={table.min || 100}
                max={table.max || 100000}
                onPlaceBet={async (betData) => {
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: betData.amount,
                    betType: betData.betType,
                    odds: betData.odds,
                    roundId: betData.roundId,
                    sid: betData.sid,
                    side: betData.side || "back",
                  });
                }}
              />
            ) : isPoker20 ? (
              <Poker20BettingBoard
                bets={betTypes}
                locked={loading}
                min={table.min || 100}
                max={table.max || 100000}
                onPlaceBet={async (betData) => {
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: betData.amount,
                    betType: betData.betType,
                    odds: betData.odds,
                    roundId: betData.roundId,
                    sid: betData.sid,
                    side: betData.side || "back",
                  });
                }}
              />
            ) : isPoker ? (
              <PokerBettingBoard
                bets={betTypes}
                locked={loading}
                min={table.min || 100}
                max={table.max || 100000}
                onPlaceBet={async (betData) => {
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: betData.amount,
                    betType: betData.betType,
                    odds: betData.odds,
                    roundId: betData.roundId,
                    sid: betData.sid,
                    side: betData.side || "back",
                  });
                }}
              />
            ) : isOurroullete ? (
              <OurroulleteBetting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // OurroulleteBetting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => (b.i || b.sid) === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.n || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid || bet?.i || bet?.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isRoulette12 ? (
              <Roulette12Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Roulette12Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const bet = betTypes.find((b: any) => (b.i || b.sid) === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.n || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: bet?.mid,
                    sid: payload.sid || bet?.i || bet?.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ) : isRoulette13 ? (
              <Roulette13Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Roulette13Betting sends {sid, odds, nat, amount}, convert to expected format
                  const bet = betTypes.find((b: any) => (b.i || b.sid) === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.n || bet?.nat || "",
                    odds: payload.odds || bet?.b || bet?.back || bet?.odds || 1,
                    roundId: bet?.mid,
                    sid: payload.sid || bet?.i || bet?.sid,
                    side: "back",
                  });
                }}
                loading={loading}
              />
            ) : isRoulette11 ? (
              <Roulette11Betting
                betTypes={betTypes}
                onPlaceBet={async (payload) => {
                  // Roulette11Betting sends {sid, odds, nat, amount, side}, convert to expected format
                  const bet = betTypes.find((b: any) => (b.i || b.sid) === payload.sid);
                  await onPlaceBet({
                    tableId: table.id,
                    tableName: table.name,
                    amount: payload.amount || parseFloat(amount),
                    betType: payload.nat || bet?.n || bet?.nat || "",
                    odds: payload.odds || (payload.side === "back" ? (bet?.b || bet?.back || 1) : (bet?.l || bet?.lay || 1)),
                    roundId: bet?.mid,
                    sid: payload.sid || bet?.i || bet?.sid,
                    side: payload.side || "back",
                  });
                }}
                loading={loading}
              />
            ): (
            
              /* ===== DEFAULT BET UI (IMPROVED SELECTION) ===== */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {betTypes.map((bet: any, idx: number) => {
                  const back = formatOdds(
                    bet?.back ?? bet?.b1 ?? bet?.b ?? bet?.odds
                  );
                  const lay = hasLayOdds
                    ? formatOdds(bet?.lay ?? bet?.l1 ?? bet?.l)
                    : "0.00";

                  const isSelected = bet.type === selectedBet;

                  return (
                    <div
                      key={`${bet?.type}-${idx}`}
                      className={`
                        border rounded-md p-1.5 space-y-1 transition-all
                        ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "hover:border-primary/40"
                        }
                        ${bet.status === "suspended" ? "opacity-50" : ""}
                      `}
                    >
                      <div className="text-[11px] font-medium truncate text-center">
                        {bet.type}
                      </div>

                      <div
                        className={`grid ${
                          hasLayOdds ? "grid-cols-2" : "grid-cols-1"
                        } gap-1`}
                      >
                        <Button
                          size="sm" 
                          className={`
                            h-7 text-[11px] px-1 text-white font-medium
                            ${
                              isSelected && betType === "back"
                                ? "ring-2 ring-green-500 scale-[1.02] bg-green-600 hover:bg-green-700"
                                : "bg-green-600 hover:bg-green-700"
                            }
                          `}
                          onClick={() => handleSelectBet(bet, "back")}
                          disabled={
                            bet.status === "suspended" || back === "0.00"
                          }
                        >
                          {bet.status === "suspended" || back === "0.00" ? (
                            <Lock className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          )}
                          Back {back}
                        </Button>

                        {hasLayOdds && (
                          <Button
                            size="sm"
                            className={`
                              h-7 text-[11px] px-1 text-white font-medium
                              ${
                                isSelected && betType === "lay"
                                  ? "ring-2 ring-red-500 scale-[1.02] bg-red-600 hover:bg-red-700"
                                  : "bg-red-600 hover:bg-red-700"
                              }
                            `}
                            onClick={() => handleSelectBet(bet, "lay")}
                            disabled={
                              bet.status === "suspended" || lay === "0.00"
                            }
                          >
                            {bet.status === "suspended" || lay === "0.00" ? (
                              <Lock className="w-3 h-3 mr-0.5" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-0.5" />
                            )}
                            Lay {lay}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= AMOUNT ================= */}
        {/* Only show amount/place bet controls for games that don't have their own betting UI */}
        {!isTeen && !isTeen1 && !isTeen3 && !isTeen6 && !isTeen20 && !isTeen20C && !isTeen42 && !isTeen8 && !isTeen9 && !isTeenUnique && !isTeenmuf && !isTeen62 && !isJoker1 && !isJoker20 && !isKbc && !isDum10 && !isCmeter1 && !isCmeter && !isCmatch20 && !isCricketv3 && !isLottcard && !isBtable && !isWorli && !isWorli2 && !isWar && !isRace2 && !isTeen120 && !isNotenum && !isTrio && !isRace17 && !isPatti2 && !isTrap && !isSuperover && !isLucky7eu2 && !isRace20 && !isQueen && !isDt6 && !isDtl20 && !isDt202 && !isDt20 && !isTeenmuf && !isTeensin && (
          <>
            <div className="space-y-2">
              <Input
                type="number"
                value={amount}
                className="h-9"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* ================= PLACE BET ================= */}
            <Button
              className="w-full h-9"
              disabled={!selectedBet || loading || isRestricted}
              onClick={handlePlaceBet}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing...
                </>
              ) : (
                `${betType.toUpperCase()} ₹${amount}`
              )}
            </Button>

            {/* ================= CALC ================= */}
            {selectedBet && (
              <div className="text-xs text-center text-muted-foreground">
                {betType === "back" ? "Potential win" : "Liability"}: ₹
                {(parseFloat(amount) * (getSelectedBetOdds() - 1)).toFixed(2)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

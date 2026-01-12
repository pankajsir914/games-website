// src/features/live-casino/ui-templates/teen-patti/Teen20BBettingBoard.tsx

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, X, Loader2, Trophy, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface Teen20BBettingBoardProps {
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
    win: "Player A" | "Player B" | "A" | "B" | "1" | "2" | 1 | 2;
    winnerId?: string;
  }>;
  onResultClick?: (result: any) => void;
  loading?: boolean;
  tableId?: string;
}

const QUICK_CHIPS = [100, 500, 1000, 5000];

// Format odds value
const formatOdds = (val: any): string => {
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
      betName.includes(`${normalized} player`) ||
      betName.includes(`3 baccarat ${normalized}`) ||
      betName.includes(`total ${normalized}`) ||
      betName.includes(`pair plus ${normalized}`) ||
      betName.includes(`black ${normalized}`) ||
      betName.includes(`red ${normalized}`)
    );
  });
};

// Get odds from multiple possible fields
const getOdds = (bet: any) => {
  if (!bet) return 0;
  return bet.back ?? bet.b ?? bet.b1 ?? bet.odds ?? 0;
};

// Sanitize HTML for rules
const sanitizeHTML = (html: string): string => {
  if (!html) return "";
  let sanitized = html;
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, "");
  return sanitized;
};

// Hardcoded rules for Teen20B
const TEEN20B_RULES = [
  {
    ctype: "teen20b",
    stype: "Main",
    rules: `<style type="text/css">
        .rules-section .row.row5 {
            margin-left: -5px;
            margin-right: -5px;
        }
        .rules-section .pl-2 {
            padding-left: .5rem !important;
        }
        .rules-section .pr-2 {
            padding-right: .5rem !important;
        }
        .rules-section .row.row5 > [class*="col-"], .rules-section .row.row5 > [class*="col"] {
            padding-left: 5px;
            padding-right: 5px;
        }
        .rules-section
        {
            text-align: left;
            margin-bottom: 10px;
        }
        .rules-section .table
        {
            color: #fff;
            border:1px solid #444;
            background-color: #222;
            font-size: 12px;
        }
        .rules-section .table td, .rules-section .table th
        {
            border-bottom: 1px solid #444;
        }
        .rules-section ul li, .rules-section p
        {
            margin-bottom: 5px;
        }
        .rules-section::-webkit-scrollbar {
            width: 8px;
        }
        .rules-section::-webkit-scrollbar-track {
            background: #666666;
        }

        .rules-section::-webkit-scrollbar-thumb {
            background-color: #333333;
        }
        .rules-section .rules-highlight
        {
            color: #FDCF13;
            font-size: 16px;
        }
        .rules-section .rules-sub-highlight {
            color: #FDCF13;
            font-size: 14px;
        }
        .rules-section .list-style, .rules-section .list-style li
        {
            list-style: disc;
        }
        .rules-section .rule-card
        {
            height: 20px;
            margin-left: 5px;
        }
        .rules-section .card-character
        {
            font-family: Card Characters;
        }
        .rules-section .red-card
        {
            color: red;
        }
        .rules-section .black-card
        {
            color: black;
        }
        .rules-section .cards-box
        {
            background: #fff;
            padding: 6px;
            display: inline-block;
            color: #000;
            min-width: 150px;
        }
.rules-section img {
  max-width: 100%;
}
    </style>

<div class="rules-section">
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>The game is played with a regular 52 cards single deck, between 2 players A and B.</li>
                                                <li>Each player will receive 3 cards.</li>
                                                <li><b>Rules of regular teenpatti winner</b></li>
                                            </ul>
                                            <div>
                                                <img src="https://sitethemedata.com/casino-new-rules-images/teen20b.jpg">
                                            </div>
                                        </div>`,
    sno: 1
  },
  {
    ctype: "teen20b",
    stype: "3 baccarat",
    rules: `<div class="rules-section">
                                            <h6 class="rules-highlight">Rules of 3 baccarat</h6>
                                            <p>There are 3 criteria for winning the 3 Baccarat .</p>
                                            <h7 class="rules-sub-highlight">First criteria:</h7>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>Game having trio will win,</li>
                                                <li>If both game has trio then higher trio will win.</li>
                                                <li>Ranking of trio from high to low.
                                                    <div class="pl-2 pr-2">1,1,1</div>
                                                    <div class="pl-2 pr-2">K,K,K</div>
                                                    <div class="pl-2 pr-2">Q,Q,Q</div>
                                                    <div class="pl-2 pr-2">J,J,J</div>
                                                    <div class="pl-2 pr-2">10,10,10</div>
                                                    <div class="pl-2 pr-2">9,9,9</div>
                                                    <div class="pl-2 pr-2">8,8,8</div>
                                                    <div class="pl-2 pr-2">7,7,7</div>
                                                    <div class="pl-2 pr-2">6,6,6</div>
                                                    <div class="pl-2 pr-2">5,5,5</div>
                                                    <div class="pl-2 pr-2">4,4,4</div>
                                                    <div class="pl-2 pr-2">3,3,3</div>
                                                    <div class="pl-2 pr-2">2,2,2</div>
                                                </li>
                                                <li>If none of the game have got trio then second criteria will apply.</li>
                                            </ul>
                                            <h7 class="rules-sub-highlight">Second criteria:</h7>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>Game having all the three face card will win.</li>
                                                <li>Here JACK, QUEEN AND KING are named face card.</li>
                                                <li>if both the game have all three face cards then game having highest face card will win.</li>
                                                <li>Ranking of face card from High to low :
                                                    <div class="pl-2 pr-2">Spade King</div>
                                                    <div class="pl-2 pr-2">Heart King</div>
                                                    <div class="pl-2 pr-2">Club King</div>
                                                    <div class="pl-2 pr-2">Diamond King</div>
                                                </li>
                                                <li>Same order will apply for Queen (Q) and Jack (J) also .</li>
                                                <li>If second criteria is also not applicable, then 3rd criteria will apply .</li>
                                            </ul>
                                            <h7 class="rules-sub-highlight">3rd criteria:</h7>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>Game having higher baccarat value will win .</li>
                                                <li>For deciding baccarat value we will add point value of all the three cards</li>
                                                <li>Point value of all the cards :
                                                    <div class="pl-2 pr-2">1 = 1</div>
                                                    <div class="pl-2 pr-2">2 = 2</div>
                                                    <div class="pl-2 pr-2">To</div>
                                                    <div class="pl-2 pr-2">9 = 9</div>
                                                    <div class="pl-2 pr-2">10, J ,Q, K has zero (0) point value .</div>
                                                </li>
                                            </ul>
                                            <p><b>Example 1st:</b></p>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>Last digit of total will be considered as baccarat value
                                                    <div class="pl-2 pr-2">2,5,8 =</div>
                                                    <div class="pl-2 pr-2">2+5+8 =15 here last digit of total is 5 , So baccarat value is 5.</div>
                                                </li>
                                            </ul>
                                            <p><b>Example 2nd :</b></p>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>1,3,K</li>
                                                <li>1+3+0 = 4 here total is in single digit so we will take this single digit 4 as baccarat value</li>
                                            </ul>
                                            <p><b>If baccarat value of both the game is equal then Following condition will apply :</b></p>
                                            <p><b>Condition 1 :</b></p>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>Game having more face card will win.</li>
                                                <li>Example : Game A has 3,4,k and B has 7,J,Q then game B will win as it has more face card then game A .</li>
                                            </ul>
                                            <p><b>Condition 2 :</b></p>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>If Number of face card of both the game are equal then higher value face card game will win.</li>
                                                <li>Example : Game A has 4,5,K (K Spade ) and Game B has 9,10,K ( K Heart ) here baccarat value of both the game is equal (9 ) and both the game have same number of face card so game A will win because It has got higher value face card then Game B .</li>
                                            </ul>
                                            <p><b>Condition 3 :</b></p>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>If baccarat value of both the game is equal and none of game has got face card then in this case Game having highest value point card will win .</li>
                                                <li>Value of Point Cards :
                                                    <div class="pl-2 pr-2">Ace = 1</div>
                                                    <div class="pl-2 pr-2">2 = 2</div>
                                                    <div class="pl-2 pr-2">3 = 3</div>
                                                    <div class="pl-2 pr-2">4 = 4</div>
                                                    <div class="pl-2 pr-2">5 = 5</div>
                                                    <div class="pl-2 pr-2">6 = 6</div>
                                                    <div class="pl-2 pr-2">7 = 7</div>
                                                    <div class="pl-2 pr-2">8 = 8</div>
                                                    <div class="pl-2 pr-2">9 = 9</div>
                                                    <div class="pl-2 pr-2">10 = 0 (Zero )</div>
                                                </li>
                                                <li>Example : GameA: 1,6,10 And GameB: 7,10,10</li>
                                                <li>here both the game have same baccarat value . But game B will win as it has higher value point card i.e. 7 .</li>
                                            </ul>
                                            <p><b>Condition 4 :</b></p>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>If baccarat value of both game is equal and none of game has got face card and high point card of both the game is of equal point value , then suits of both high card will be compared</li>
                                                <li>Example :
                                                    <div class="pl-2 pr-2">
                                                        Game A : 1(Heart) ,2(Heart) ,5(Heart)
                                                    </div>
                                                    <div class="pl-2 pr-2">
                                                        Game B : 10 (Heart) , 3 (Diamond ) , 5 (Spade )
                                                    </div>
                                                </li>
                                                <li>Here Baccarat value of both the game (8) is equal . and none of game has got face card and point value of both game's high card is equal so by comparing suits of both the high card ( A 5 of Heart , B 5 of spade ) game B is declared 3 Baccarat winner .</li>
                                                <li>Ranking of suits from High to low :
                                                    <div class="pl-2 pr-2">Spade</div>
                                                    <div class="pl-2 pr-2">Heart</div>
                                                    <div class="pl-2 pr-2">Club</div>
                                                    <div class="pl-2 pr-2">Diamond</div>
                                                </li>
                                            </ul>
                                        </div>`,
    sno: 2
  },
  {
    ctype: "teen20b",
    stype: "total",
    rules: `<div class="rules-section">
                                            <h6 class="rules-highlight">Rules of Total :</h6>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>It is a comparison of total of all three cards of both the games.</li>
                                                <li>Point value of all the cards for the bet of total
                                                    <div class="pl-2 pr-2">Ace = 1</div>
                                                    <div class="pl-2 pr-2">2 = 2</div>
                                                    <div class="pl-2 pr-2">3 = 3</div>
                                                    <div class="pl-2 pr-2">4 = 4</div>
                                                    <div class="pl-2 pr-2">5 = 5</div>
                                                    <div class="pl-2 pr-2">6 = 6</div>
                                                    <div class="pl-2 pr-2">7 = 7</div>
                                                    <div class="pl-2 pr-2">8 = 8</div>
                                                    <div class="pl-2 pr-2">9 = 9</div>
                                                    <div class="pl-2 pr-2">10 = 10</div>
                                                    <div class="pl-2 pr-2">Jack = 11</div>
                                                    <div class="pl-2 pr-2">Queen = 12</div>
                                                    <div class="pl-2 pr-2">King = 13</div>
                                                </li>
                                                <li>suits doesn't matter</li>
                                                <li>If total of both the game is equal , it is a Tie .</li>
                                                <li>If total of both the game is equal then half of your bet amount will returned.</li>
                                            </ul>
                                        </div>`,
    sno: 3
  },
  {
    ctype: "teen20b",
    stype: "pair plus",
    rules: `<div class="rules-section">
                                            <h6 class="rules-highlight">Rules of Pair Plus :</h6>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>This bet provides multiple option to win a price .</li>
                                                <li>Option 1 : Pair</li>
                                                <li>If you got pair you will get equal value return of your betting amount .</li>
                                                <li>Option 2 : Flush</li>
                                                <li>If you have all three cards of same suits you will get 4 times return of your betting amount .</li>
                                                <li>Option 3 : Straight</li>
                                                <li>If you have straight ( three cards in sequence eg : 4,5,6 eg: J,Q,K ) (but king ,Ace ,2 is not a straight ) you will get six times return of your betting amount .</li>
                                                <li>Option 4 : Trio</li>
                                                <li>If you have got all the cards of same rank ( eg: 4,4,4 J,J,J ) you will get 30 times return of your betting amount .</li>
                                                <li>Option 5 : Straight Flush</li>
                                                <li>If you have straight of all three cards of same suits ( Three cards in sequence eg: 4,5,6 ) ( but King ,Ace ,2 is not straight ) you will get 40 times return of your betting amount .</li>
                                                <li>Note : If you have trio then you will receive price of trio only , In this case you will not receive price of pair .</li>
                                                <li>If you have straight flush you will receive price of straight flush only , In this case you will not receive price of straigh and flush .</li>
                                                <li>It means you will receive only one price whichever is higher .</li>
                                            </ul>
                                        </div>`,
    sno: 4
  },
  {
    ctype: "teen20b",
    stype: "color",
    rules: `<div class="rules-section">
                                            <h6 class="rules-highlight">Rules of Color :</h6>
                                            <ul class="pl-2 pr-2 list-style">
                                                <li>This is a bet for having more cards of red or Black (Heart and Diamond are named RED , Spade and Club are named BLACK ).</li>
                                            </ul>
                                        </div>`,
    sno: 5
  }
];

export const Teen20BBettingBoard = ({
  bets = [],
  locked = false,
  min = 100,
  max = 200000,
  onPlaceBet,
  odds,
  resultHistory = [],
  onResultClick,
  loading = false,
  tableId,
}: Teen20BBettingBoardProps) => {
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [amount, setAmount] = useState("100");
  
  // Detail result modal state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  
  // Rules modal state
  const [rulesOpen, setRulesOpen] = useState(false);
  // Use hardcoded rules instead of fetching from API
  const rules = TEEN20B_RULES;

  // Extract bets from multiple sources
  const actualBets = useMemo(() => {
    if (Array.isArray(bets) && bets.length > 0) {
      return bets;
    }
    if (odds?.bets && Array.isArray(odds.bets) && odds.bets.length > 0) {
      return odds.bets;
    }
    if (odds?.data?.sub && Array.isArray(odds.data.sub) && odds.data.sub.length > 0) {
      return odds.data.sub;
    }
    if (odds?.sub && Array.isArray(odds.sub) && odds.sub.length > 0) {
      return odds.sub;
    }
    return bets || [];
  }, [bets, odds]);

  // Find Player A bets
  const playerA = findBet(actualBets, "player a") || findBet(actualBets, "a");
  const baccaratA = findBet(actualBets, "3 baccarat a") || findBet(actualBets, "baccarat a");
  const totalA = findBet(actualBets, "total a");
  const pairPlusA = findBet(actualBets, "pair plus a");
  const blackA = findBet(actualBets, "black a");
  const redA = findBet(actualBets, "red a");

  // Find Player B bets
  const playerB = findBet(actualBets, "player b") || findBet(actualBets, "b");
  const baccaratB = findBet(actualBets, "3 baccarat b") || findBet(actualBets, "baccarat b");
  const totalB = findBet(actualBets, "total b");
  const pairPlusB = findBet(actualBets, "pair plus b");
  const blackB = findBet(actualBets, "black b");
  const redB = findBet(actualBets, "red b");

  // Get last 10 results
  const last10Results = useMemo(() => {
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      return resultHistory.slice(0, 10);
    }
    return [];
  }, [resultHistory]);

  const openBetModal = (bet: any) => {
    if (!bet || isSuspended(bet)) return;
    const oddsValue = getOdds(bet);
    if (formatOdds(oddsValue) === "0.00") return;
    
    setSelectedBet(bet);
    setAmount("100");
    setBetModalOpen(true);
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !amount || parseFloat(amount) <= 0 || loading) return;

    const oddsValue = getOdds(selectedBet);
    const finalOdds = oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
    
    // Extract roundId
    const roundIdFromBet = selectedBet?.mid || selectedBet?.round_id || selectedBet?.round;
    const raw = odds?.rawData || odds?.raw || odds || {};
    const roundIdFromOdds = raw?.mid || raw?.round_id || raw?.round || raw?.gmid || raw?.game_id ||
                           odds?.mid || odds?.round_id || odds?.round || odds?.gmid || odds?.game_id;
    const roundIdFromFirstBet = actualBets.length > 0 && (actualBets[0]?.mid || actualBets[0]?.round_id || actualBets[0]?.round);
    const finalRoundId = roundIdFromBet || roundIdFromOdds || roundIdFromFirstBet || null;

    await onPlaceBet({
      betType: selectedBet?.nat || selectedBet?.type || "Unknown",
      amount: Math.min(Math.max(parseFloat(amount), min), max),
      odds: finalOdds,
      roundId: finalRoundId,
      sid: selectedBet?.sid,
      side: "back",
    });

    setBetModalOpen(false);
    setSelectedBet(null);
    setAmount("100");
  };

  // Fetch detail result
  const fetchDetailResult = async (mid: string | number) => {
    const finalTableId = tableId || odds?.tableId || odds?.rawData?.gtype || "teen20b";
    
    if (!mid) {
      console.error("Missing mid:", { mid });
      return;
    }
    
    setDetailLoading(true);
    setDetailData(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { 
          action: "get-detail-result", 
          tableId: finalTableId,
          mid: String(mid)
        }
      });

      if (error) {
        console.error("❌ Error fetching detail result:", error);
        setDetailData({ error: error.message || "Failed to fetch detail result" });
      } else if (data) {
        if (data.success === false) {
          console.error("❌ API returned error:", data.error);
          setDetailData({ error: data.error || "No data available" });
        } else {
          const resultData = data?.data || data;
          setDetailData(resultData);
        }
      } else {
        setDetailData({ error: "No data received from API" });
      }
    } catch (error) {
      console.error("❌ Exception fetching detail result:", error);
      setDetailData({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: any) => {
    const mid = result.mid || result.round || result.round_id;
    if (mid) {
      setSelectedResult(result);
      setDetailDialogOpen(true);
      setDetailData(null);
      fetchDetailResult(mid);
    } else {
      setSelectedResult(result);
      setDetailDialogOpen(true);
      setDetailData(null);
    }
  };

  // Rules are now hardcoded, no need to fetch from API

  // Parse rdesc to extract all result information
  const parseRdesc = (rdesc: string) => {
    if (!rdesc) return null;
    
    const parts = rdesc.split('#');
    if (parts.length < 5) return null;
    
    // Format: "Player B#Player B(High Baccarat)~(A : 0 | B : 8)#Player B (A : 20 | B : 30)#B : Pair#A : Red | B : Black"
    const winner = parts[0] || '';
    
    // Parse 3 Baccarat: "Player B(High Baccarat)~(A : 0 | B : 8)"
    const baccaratPart = parts[1] || '';
    const baccaratMatch = baccaratPart.match(/^(.+?)~\((.+?)\)$/);
    const baccaratWinner = baccaratMatch ? baccaratMatch[1] : '';
    const baccaratValues = baccaratMatch ? baccaratMatch[2] : '';
    const baccaratAValue = baccaratValues.match(/A\s*:\s*(\d+)/)?.[1] || '';
    const baccaratBValue = baccaratValues.match(/B\s*:\s*(\d+)/)?.[1] || '';
    
    // Parse Total: "Player B (A : 20 | B : 30)"
    const totalPart = parts[2] || '';
    const totalMatch = totalPart.match(/^(.+?)\s*\((.+?)\)$/);
    const totalWinner = totalMatch ? totalMatch[1] : '';
    const totalValues = totalMatch ? totalMatch[2] : '';
    const totalAValue = totalValues.match(/A\s*:\s*(\d+)/)?.[1] || '';
    const totalBValue = totalValues.match(/B\s*:\s*(\d+)/)?.[1] || '';
    
    // Parse Pair Plus: "B : Pair"
    const pairPlusPart = parts[3] || '';
    const pairPlusMatch = pairPlusPart.match(/^([AB])\s*:\s*(.+)$/);
    const pairPlusWinner = pairPlusMatch ? pairPlusMatch[1] : '';
    const pairPlusType = pairPlusMatch ? pairPlusMatch[2] : '';
    
    // Parse Red Black: "A : Red | B : Black"
    const redBlackPart = parts[4] || '';
    const redBlackA = redBlackPart.match(/A\s*:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim() || '';
    const redBlackB = redBlackPart.match(/B\s*:\s*(.+?)(?:\s*\||$)/)?.[1]?.trim() || '';
    
    return {
      winner,
      baccarat: {
        winner: baccaratWinner,
        aValue: baccaratAValue,
        bValue: baccaratBValue,
      },
      total: {
        winner: totalWinner,
        aValue: totalAValue,
        bValue: totalBValue,
      },
      pairPlus: {
        winner: pairPlusWinner,
        type: pairPlusType,
      },
      redBlack: {
        a: redBlackA,
        b: redBlackB,
      },
    };
  };

  // Parse Teen20B card format (similar to Teen3)
  const parseTeen20BCards = (cardString: string) => {
    if (!cardString) return [];
    
    const cards = cardString.split(',').map(card => card.trim()).filter(Boolean);
    
    return cards.map(card => {
      let rank = '';
      let suit = '';
      
      if (card.length >= 3) {
        if (card.length >= 4 && card.startsWith('10')) {
          rank = '10';
          suit = card.charAt(card.length - 1);
        } else {
          rank = card.substring(0, card.length - 2);
          suit = card.charAt(card.length - 1);
        }
      }
      
      const suitMap: { [key: string]: string } = {
        'S': '♠',
        'H': '♥',
        'C': '♣',
        'D': '♦',
      };
      
      const rankMap: { [key: string]: string } = {
        '1': 'A',
        'A': 'A',
        'K': 'K',
        'Q': 'Q',
        'J': 'J',
      };
      
      const displayRank = rankMap[rank] || rank;
      const displaySuit = suitMap[suit] || suit;
      
      return {
        raw: card,
        rank: displayRank,
        suit: displaySuit,
        display: `${displayRank}${displaySuit}`,
        isRed: suit === 'H' || suit === 'D',
      };
    });
  };

  const Cell = ({ bet }: { bet: any }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading || locked}
        onClick={() => openBetModal(bet)}
        className={`
          h-10 w-full flex items-center justify-center
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-sky-300 text-gray-900 hover:bg-sky-400 cursor-pointer"
          }
        `}
      >
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  const SuitCell = ({ bet, suits }: { bet: any; suits: string[] }) => {
    const odds = getOdds(bet);
    const formattedOdds = formatOdds(odds);
    const suspended = isSuspended(bet) || formattedOdds === "0.00";

    return (
      <button
        disabled={suspended || loading || locked}
        onClick={() => openBetModal(bet)}
        className={`
          h-10 w-full flex items-center justify-center gap-1
          text-sm font-semibold
          ${
            suspended
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-sky-300 text-gray-900 hover:bg-sky-400 cursor-pointer"
          }
        `}
      >
        <div className="flex gap-1">
          {suits.map((suit, idx) => (
            <span
              key={idx}
              className={`text-base ${suit === "♠" || suit === "♣" ? "text-black" : "text-red-600"}`}
            >
              {suit}
            </span>
          ))}
        </div>
        {suspended ? <Lock size={14} /> : formattedOdds}
      </button>
    );
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">20-20 Teenpatti B</h3>
        <Button size="icon" variant="ghost" onClick={() => setRulesOpen(true)}>
          <Info size={16} />
        </Button>
      </div>

      {/* ================= PLAYER A / PLAYER B ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        {/* Player A */}
        <div className="border">
          <div className="grid grid-cols-4 text-sm font-semibold">
            <div className="h-10 flex items-center px-2 font-bold text-white-900">Player A</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">3 Baccarat A</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">Total A</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">Pair Plus A</div>
          </div>
          <div className="grid grid-cols-4 border-t">
            <Cell bet={playerA} />
            <Cell bet={baccaratA} />
            <Cell bet={totalA} />
            <div className="h-10 flex items-center justify-center bg-sky-300 text-gray-900 font-bold">A</div>
          </div>
          <div className="grid grid-cols-2 border-t">
            <SuitCell bet={blackA} suits={["♠", "♣"]} />
            <SuitCell bet={redA} suits={["♥", "♦"]} />
          </div>
        </div>

        {/* Player B */}
        <div className="border">
          <div className="grid grid-cols-4 text-sm font-semibold">
            <div className="h-10 flex items-center px-2 font-bold text-white-900">Player B</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">3 Baccarat B</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">Total B</div>
            <div className="text-center bg-sky-300 text-gray-900 h-10 flex items-center justify-center">Pair Plus B</div>
          </div>
          <div className="grid grid-cols-4 border-t">
            <Cell bet={playerB} />
            <Cell bet={baccaratB} />
            <Cell bet={totalB} />
            <div className="h-10 flex items-center justify-center bg-sky-300 text-gray-900 font-bold">B</div>
          </div>
          <div className="grid grid-cols-2 border-t">
            <SuitCell bet={blackB} suits={["♠", "♣"]} />
            <SuitCell bet={redB} suits={["♥", "♦"]} />
          </div>
        </div>
      </div>

      {/* ================= LAST 10 RESULTS ================= */}
      <div className="border pt-2 pb-2 mb-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Last 10 Results</p>
        {last10Results.length > 0 ? (
          <div className="flex gap-1 sm:gap-1.5 px-1 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-w-0">
            {last10Results.map((result: any, index: number) => {
              const winner = result.win || result.winner || result.result || "";
              const winnerStr = String(winner).toLowerCase().trim();
              
              let letter = "A";
              let bgColor = "bg-blue-600";
              let textColor = "text-white";
              
              if (winner === 1 || winner === "1" || winnerStr === "1" || winnerStr.includes("player a") || winnerStr === "a") {
                letter = "A";
                bgColor = "bg-blue-600";
                textColor = "text-white";
              } else if (winner === 2 || winner === "2" || winnerStr === "2" || winnerStr.includes("player b") || winnerStr === "b") {
                letter = "B";
                bgColor = "bg-red-600";
                textColor = "text-white";
              } else {
                const resultStr = JSON.stringify(result).toLowerCase();
                if (resultStr.includes("player b") || resultStr.includes("b")) {
                  letter = "B";
                  bgColor = "bg-red-600";
                } else {
                  letter = "A";
                  bgColor = "bg-blue-600";
                }
              }

              return (
                <button
                  key={result.mid || result.round_id || result.round || index}
                  onClick={() => {
                    handleResultClick(result);
                    onResultClick?.(result);
                  }}
                  className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${bgColor} ${textColor} font-bold text-xs sm:text-sm flex items-center justify-center active:opacity-80 cursor-pointer touch-none`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-2 text-xs text-muted-foreground text-center py-2">
            No results yet
          </div>
        )}
      </div>

      {/* ================= BET MODAL ================= */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="max-w-md p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center">
            <h2 className="text-lg font-semibold text-white m-0">Place Bet</h2>
            <button 
              onClick={() => setBetModalOpen(false)} 
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>

          {selectedBet && (
            <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
              {/* Bet Type and Odds */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Bet Type</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedBet.nat || selectedBet.type || "Unknown"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Odds:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatOdds(getOdds(selectedBet))}
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Amount</div>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_CHIPS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(String(amt))}
                      className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                        amount === String(amt)
                          ? "bg-blue-600 text-white shadow-md scale-105"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Enter Amount</div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${min} - Max ₹${max}`}
                  min={min}
                  max={max}
                  className="w-full h-12 text-lg font-semibold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: ₹{min} · Max: ₹{max}
                </div>
              </div>

              {/* Profit Calculation */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Potential Win</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(
                      parseFloat(amount) *
                      (() => {
                        const oddsValue = Number(getOdds(selectedBet));
                        return oddsValue > 1000 ? oddsValue / 100000 : oddsValue;
                      })()
                    ).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) < min || parseFloat(amount) > max}
                onClick={handlePlaceBet}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place Bet ₹${parseFloat(amount) || 0}`
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= DETAIL RESULT MODAL ================= */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-blue-600 text-white px-6 py-4 flex flex-row justify-between items-center sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-white m-0">20-20 Teenpatti B Result</h2>
            <button 
              onClick={() => setDetailDialogOpen(false)} 
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-700 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-6 bg-white dark:bg-gray-900">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading details...</span>
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                {detailData.error ? (
                  <div className="text-center py-8">
                    <p className="text-destructive font-medium mb-2">Error</p>
                    <p className="text-sm text-muted-foreground">{detailData.error}</p>
                  </div>
                ) : (() => {
                  const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                  
                  if (!t1Data) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No detailed result data available
                      </div>
                    );
                  }

                  // Parse cards - format: "KSS,8SS,QHH,9CC,10DD,KDD" (6 cards: 3 for Player A, 3 for Player B)
                  const cardString = t1Data.card || '';
                  const allCards = parseTeen20BCards(cardString);
                  const playerACards = allCards.slice(0, 3);
                  const playerBCards = allCards.slice(3, 6);
                  
                  // Parse rdesc to get all result information
                  const rdesc = t1Data.rdesc || '';
                  const parsedRdesc = parseRdesc(rdesc);
                  
                  // Determine winner
                  const winner = parsedRdesc?.winner || t1Data.winnat || t1Data.win || '';
                  const winnerStr = String(winner).toLowerCase().trim();
                  const isPlayerAWinner = winnerStr.includes("player a") || winnerStr === "a" || winnerStr === "1";
                  const isPlayerBWinner = winnerStr.includes("player b") || winnerStr === "b" || winnerStr === "2";

                  return (
                    <div className="space-y-5">
                      {/* Round Information */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm border-b pb-3">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Round Id: </span>
                          <span className="text-gray-900 dark:text-gray-100 font-mono">{t1Data.rid || selectedResult?.mid || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Match Time: </span>
                          <span className="text-gray-900 dark:text-gray-100">{t1Data.mtime || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Player A vs Player B Cards - Horizontal Layout */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* Player A Cards */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player A</h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerAWinner && (
                              <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            <div className="flex gap-1.5 justify-center">
                              {playerACards.length > 0 ? playerACards.map((card, index) => (
                                <div
                                  key={index}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.rank}
                                  </span>
                                  <span className={`text-lg ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.suit}
                                  </span>
                                </div>
                              )) : (
                                <div className="text-gray-500 text-xs">No cards</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Player B Cards */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Player B</h3>
                          </div>
                          <div className="flex justify-center items-center gap-2">
                            {isPlayerBWinner && (
                              <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                            )}
                            <div className="flex gap-1.5 justify-center">
                              {playerBCards.length > 0 ? playerBCards.map((card, index) => (
                                <div
                                  key={index}
                                  className="w-10 h-14 border-2 border-yellow-400 rounded bg-white dark:bg-gray-800 flex flex-col items-center justify-center shadow-md"
                                >
                                  <span className={`text-sm font-bold ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.rank}
                                  </span>
                                  <span className={`text-lg ${card.isRed ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {card.suit}
                                  </span>
                                </div>
                              )) : (
                                <div className="text-gray-500 text-xs">No cards</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Result Details */}
                      <div className="space-y-3 border-t pt-4">
                        {/* Winner */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Winner:</div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {parsedRdesc?.winner || winner || "N/A"}
                          </div>
                        </div>

                        {/* 3 Baccarat */}
                        {parsedRdesc?.baccarat && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">3 Baccarat:</div>
                            <div className="text-base font-bold text-blue-600 dark:text-blue-400 mb-1">
                              {parsedRdesc.baccarat.winner}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              (A : {parsedRdesc.baccarat.aValue || '0'} | B : {parsedRdesc.baccarat.bValue || '0'})
                            </div>
                          </div>
                        )}

                        {/* Total */}
                        {parsedRdesc?.total && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Total:</div>
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400 mb-1">
                              {parsedRdesc.total.winner}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              (A : {parsedRdesc.total.aValue || '0'} | B : {parsedRdesc.total.bValue || '0'})
                            </div>
                          </div>
                        )}

                        {/* Pair Plus */}
                        {parsedRdesc?.pairPlus && parsedRdesc.pairPlus.winner && (
                          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pair Plus:</div>
                            <div className="text-base font-bold text-orange-600 dark:text-orange-400">
                              {parsedRdesc.pairPlus.winner} : {parsedRdesc.pairPlus.type}
                            </div>
                          </div>
                        )}

                        {/* Red Black */}
                        {parsedRdesc?.redBlack && (parsedRdesc.redBlack.a || parsedRdesc.redBlack.b) && (
                          <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Red Black:</div>
                            <div className="text-base font-bold text-pink-600 dark:text-pink-400">
                              A : {parsedRdesc.redBlack.a || 'N/A'} | B : {parsedRdesc.redBlack.b || 'N/A'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No detailed data available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= RULES MODAL ================= */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden flex flex-col bg-gray-900 dark:bg-gray-900 [&>button[class*='right-4']]:hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex flex-row justify-between items-center flex-shrink-0">
            <h2 className="text-lg font-semibold text-white m-0">20-20 Teenpatti B Rules</h2>
            <button 
              onClick={() => setRulesOpen(false)} 
              className="text-white hover:text-gray-200 transition-colors p-1 rounded hover:bg-blue-800 flex items-center justify-center"
              aria-label="Close"
            >
              <X size={20} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500 dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
            {rules.length > 0 ? (
              <div className="space-y-4">
                {rules.map((rule, index) => {
                  const ruleHTML = sanitizeHTML(rule.rules || "");
                  return (
                    <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: ruleHTML,
                        }}
                        className="rules-section text-sm leading-relaxed"
                        style={{
                          color: 'inherit',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No rules available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

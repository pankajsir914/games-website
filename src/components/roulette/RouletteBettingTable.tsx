import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BetType, PlacedBet } from '@/types/roulette';

interface RouletteBettingTableProps {
  onPlaceBet: (betType: BetType, value?: string, amount?: number) => void;
  placedBets: PlacedBet[];
  selectedChip: number;
  disabled?: boolean;
}

const RouletteBettingTable: React.FC<RouletteBettingTableProps> = ({
  onPlaceBet,
  placedBets,
  selectedChip,
  disabled = false
}) => {
  const [hoveredBet, setHoveredBet] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const numbers = Array.from({ length: 36 }, (_, i) => i + 1);
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  const getNumberColor = (num: number) => {
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const handleBetClick = (betType: BetType, value?: string) => {
    if (disabled) return;
    onPlaceBet(betType, value, selectedChip);
  };

  const getBetsOnSpot = (betType: BetType, value?: string) => {
    return placedBets.filter(bet => 
      bet.type === betType && bet.value === value
    );
  };

  const renderChipStack = (betType: BetType, value?: string) => {
    const bets = getBetsOnSpot(betType, value);
    if (bets.length === 0) return null;
    
    const total = bets.reduce((sum, bet) => sum + bet.amount, 0);
    
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative">
          {bets.map((bet, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                transform: `translateY(-${index * 2}px)`,
                zIndex: index
              }}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg",
                bet.amount >= 1000 ? "bg-purple-600 text-white" :
                bet.amount >= 500 ? "bg-orange-600 text-white" :
                bet.amount >= 100 ? "bg-blue-600 text-white" :
                bet.amount >= 25 ? "bg-green-600 text-white" :
                bet.amount >= 10 ? "bg-yellow-600 text-white" :
                bet.amount >= 5 ? "bg-red-600 text-white" :
                "bg-gray-600 text-white"
              )}>
                ₹{bet.amount}
              </div>
            </div>
          ))}
          {bets.length > 1 && (
            <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0 bg-primary">
              ₹{total}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-green-900/90 via-green-800/90 to-green-900/90 border-amber-600/50 shadow-2xl">
      <div className="relative" ref={tableRef}>
        {/* Table Layout */}
        <div className="grid grid-cols-[auto_1fr] gap-2">
          {/* Zero Section */}
          <div 
            className={cn(
              "row-span-3 w-16 h-full bg-green-600 border-2 border-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xl cursor-pointer transition-all relative",
              hoveredBet === 'zero' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('straight', '0')}
            onMouseEnter={() => setHoveredBet('zero')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            0
            {renderChipStack('straight', '0')}
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-12 gap-1">
            {/* First row - 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
            {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(num => (
              <div
                key={num}
                className={cn(
                  "h-14 flex items-center justify-center text-white font-bold cursor-pointer transition-all rounded relative",
                  getNumberColor(num) === 'red' ? "bg-red-600 hover:bg-red-500" : "bg-gray-900 hover:bg-gray-800",
                  hoveredBet === `num-${num}` && "ring-2 ring-white shadow-lg scale-105",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => handleBetClick('straight', num.toString())}
                onMouseEnter={() => setHoveredBet(`num-${num}`)}
                onMouseLeave={() => setHoveredBet(null)}
              >
                {num}
                {renderChipStack('straight', num.toString())}
              </div>
            ))}

            {/* Second row - 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
            {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(num => (
              <div
                key={num}
                className={cn(
                  "h-14 flex items-center justify-center text-white font-bold cursor-pointer transition-all rounded relative",
                  getNumberColor(num) === 'red' ? "bg-red-600 hover:bg-red-500" : "bg-gray-900 hover:bg-gray-800",
                  hoveredBet === `num-${num}` && "ring-2 ring-white shadow-lg scale-105",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => handleBetClick('straight', num.toString())}
                onMouseEnter={() => setHoveredBet(`num-${num}`)}
                onMouseLeave={() => setHoveredBet(null)}
              >
                {num}
                {renderChipStack('straight', num.toString())}
              </div>
            ))}

            {/* Third row - 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
            {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(num => (
              <div
                key={num}
                className={cn(
                  "h-14 flex items-center justify-center text-white font-bold cursor-pointer transition-all rounded relative",
                  getNumberColor(num) === 'red' ? "bg-red-600 hover:bg-red-500" : "bg-gray-900 hover:bg-gray-800",
                  hoveredBet === `num-${num}` && "ring-2 ring-white shadow-lg scale-105",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => handleBetClick('straight', num.toString())}
                onMouseEnter={() => setHoveredBet(`num-${num}`)}
                onMouseLeave={() => setHoveredBet(null)}
              >
                {num}
                {renderChipStack('straight', num.toString())}
              </div>
            ))}
          </div>

          {/* Column Bets */}
          <div></div>
          <div className="grid grid-cols-12 gap-1">
            {[1, 2, 3].map(col => (
              <div
                key={`col-${col}`}
                className={cn(
                  "col-span-4 h-10 bg-green-700 border-2 border-amber-500 rounded flex items-center justify-center text-white font-bold cursor-pointer transition-all relative",
                  hoveredBet === `column-${col}` && "ring-2 ring-white shadow-lg scale-105",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => handleBetClick(`column_${col}` as BetType)}
                onMouseEnter={() => setHoveredBet(`column-${col}`)}
                onMouseLeave={() => setHoveredBet(null)}
              >
                <span className="text-sm">2:1</span>
                {renderChipStack(`column_${col}` as BetType)}
              </div>
            ))}
          </div>
        </div>

        {/* Outside Bets */}
        <div className="mt-4 grid grid-cols-6 gap-2">
          {/* Dozens */}
          <div
            className={cn(
              "col-span-2 h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'dozen-1' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('dozen_1')}
            onMouseEnter={() => setHoveredBet('dozen-1')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">1st 12</span>
            <span className="text-xs opacity-90">2:1</span>
            {renderChipStack('dozen_1')}
          </div>
          <div
            className={cn(
              "col-span-2 h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'dozen-2' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('dozen_2')}
            onMouseEnter={() => setHoveredBet('dozen-2')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">2nd 12</span>
            <span className="text-xs opacity-90">2:1</span>
            {renderChipStack('dozen_2')}
          </div>
          <div
            className={cn(
              "col-span-2 h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'dozen-3' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('dozen_3')}
            onMouseEnter={() => setHoveredBet('dozen-3')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">3rd 12</span>
            <span className="text-xs opacity-90">2:1</span>
            {renderChipStack('dozen_3')}
          </div>

          {/* Even Money Bets */}
          <div
            className={cn(
              "h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'low' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('low')}
            onMouseEnter={() => setHoveredBet('low')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">1-18</span>
            <span className="text-xs opacity-90">1:1</span>
            {renderChipStack('low')}
          </div>
          <div
            className={cn(
              "h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'even' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('even')}
            onMouseEnter={() => setHoveredBet('even')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">EVEN</span>
            <span className="text-xs opacity-90">1:1</span>
            {renderChipStack('even')}
          </div>
          <div
            className={cn(
              "h-12 bg-red-600 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'red' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('red')}
            onMouseEnter={() => setHoveredBet('red')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">RED</span>
            <span className="text-xs opacity-90">1:1</span>
            {renderChipStack('red')}
          </div>
          <div
            className={cn(
              "h-12 bg-gray-900 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'black' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('black')}
            onMouseEnter={() => setHoveredBet('black')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">BLACK</span>
            <span className="text-xs opacity-90">1:1</span>
            {renderChipStack('black')}
          </div>
          <div
            className={cn(
              "h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'odd' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('odd')}
            onMouseEnter={() => setHoveredBet('odd')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">ODD</span>
            <span className="text-xs opacity-90">1:1</span>
            {renderChipStack('odd')}
          </div>
          <div
            className={cn(
              "h-12 bg-green-700 border-2 border-amber-500 rounded flex flex-col items-center justify-center text-white font-bold cursor-pointer transition-all relative",
              hoveredBet === 'high' && "ring-2 ring-white shadow-lg scale-105",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onClick={() => handleBetClick('high')}
            onMouseEnter={() => setHoveredBet('high')}
            onMouseLeave={() => setHoveredBet(null)}
          >
            <span className="text-sm">19-36</span>
            <span className="text-xs opacity-90">1:1</span>
            {renderChipStack('high')}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RouletteBettingTable;

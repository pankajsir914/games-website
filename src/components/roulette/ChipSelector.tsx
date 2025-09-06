import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChipSelectorProps {
  selectedChip: number;
  onSelectChip: (value: number) => void;
  totalBet: number;
  onClearBets: () => void;
  onUndoLast: () => void;
  onRepeatBet: () => void;
  onDoubleBet: () => void;
  canUndo: boolean;
  canRepeat: boolean;
  disabled?: boolean;
}

const ChipSelector: React.FC<ChipSelectorProps> = ({
  selectedChip,
  onSelectChip,
  totalBet,
  onClearBets,
  onUndoLast,
  onRepeatBet,
  onDoubleBet,
  canUndo,
  canRepeat,
  disabled = false
}) => {
  const chips = [
    { value: 1, color: 'from-gray-400 to-gray-600', shadow: 'shadow-gray-500/50' },
    { value: 5, color: 'from-red-500 to-red-700', shadow: 'shadow-red-500/50' },
    { value: 10, color: 'from-yellow-500 to-yellow-700', shadow: 'shadow-yellow-500/50' },
    { value: 25, color: 'from-green-500 to-green-700', shadow: 'shadow-green-500/50' },
    { value: 100, color: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/50' },
    { value: 500, color: 'from-orange-500 to-orange-700', shadow: 'shadow-orange-500/50' },
    { value: 1000, color: 'from-purple-500 to-purple-700', shadow: 'shadow-purple-500/50' }
  ];

  return (
    <Card className="p-4 bg-slate-900/95 border-slate-700/50">
      <div className="space-y-4">
        {/* Chip Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          {chips.map(chip => (
            <button
              key={chip.value}
              onClick={() => onSelectChip(chip.value)}
              disabled={disabled}
              className={cn(
                "relative w-14 h-14 rounded-full transition-all transform",
                "hover:scale-110 active:scale-95",
                chip.shadow,
                selectedChip === chip.value && "ring-4 ring-white scale-110",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: `linear-gradient(135deg, ${chip.color.split(' ')[0].replace('from-', '#')} 0%, ${chip.color.split(' ')[2].replace('to-', '#')} 100%)`,
                boxShadow: selectedChip === chip.value ? `0 0 20px ${chip.color.split('-')[1]}` : '0 4px 15px rgba(0,0,0,0.5)'
              }}
            >
              <div className={cn(
                "absolute inset-0 rounded-full bg-gradient-to-br",
                chip.color,
                "flex items-center justify-center"
              )}>
                <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    ₹{chip.value >= 1000 ? `${chip.value/1000}K` : chip.value}
                  </span>
                </div>
              </div>
              {/* Inner ring design */}
              <div className="absolute inset-2 rounded-full border-2 border-white/30"></div>
              <div className="absolute inset-3 rounded-full border border-white/20"></div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndoLast}
            disabled={!canUndo || disabled}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRepeatBet}
            disabled={!canRepeat || disabled}
            className="flex-1"
          >
            Repeat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDoubleBet}
            disabled={totalBet === 0 || disabled}
            className="flex-1"
          >
            2x
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearBets}
            disabled={totalBet === 0 || disabled}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Total Bet Display */}
        {totalBet > 0 && (
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Bet</span>
              <Badge variant="secondary" className="text-lg font-bold">
                ₹{totalBet.toLocaleString()}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ChipSelector;
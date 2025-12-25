# Bet Settlement Logic - Simple Flow

## Core Concept
1. **Bet lagayi backend me** → `diamond_casino_bets` table me save hoti hai
2. **Result aata hai** → `rdesc` string me result milta hai
3. **Match karna hai** → Bet type ko rdesc se match karna hai
4. **Settle karna hai** → Win/Lose decide karke payout karna hai

## Simple Flow

```
New Result → Extract rdesc → Parse rdesc → Match Bet → Settle Bet
```

## Table-Specific Logic

### 1. Lucky5
- **rdesc format**: `"High Card#Odd#Red#9"` ya `"9#Odd#Red"`
- **Parse**: Card number extract karo (9)
- **Match**: Bet type ko card number/attributes se match karo
  - Bet: "9" → Match ✅
  - Bet: "High Card" → Match ✅
  - Bet: "Odd" → Match ✅

### 2. DT6 (Dragon Tiger 6)
- **rdesc format**: `"Dragon#Ace#King"` ya `"Tiger#Queen#Jack"`
- **Parse**: Winner extract karo (Dragon/Tiger/Tie)
- **Match**: Bet type ko winner se match karo
  - Bet: "Dragon" → Match ✅
  - Bet: "Tiger" → Match ✅

### 3. Roulette
- **rdesc format**: `"32"` (number)
- **Parse**: Number extract karo (32)
- **Match**: Bet type ko number/color/parity se match karo
  - Bet: "32" → Match ✅
  - Bet: "Red" → Match ✅
  - Bet: "Odd" → Match ✅

## Files

1. **`lucky5Settlement.ts`** - Lucky5 parsing & matching
2. **`dt6Sattlement.ts`** - DT6 parsing & matching
3. **`rouletteSettlement.ts`** - Roulette parsing & matching
4. **`index.ts`** - Main flow: rdesc extract → table detect → parse → match → settle

## Current Status

✅ **Working**: Settlement trigger ho raha hai
✅ **Working**: Backend reach ho raha hai
✅ **Working**: Bets process ho rahi hain (processed: 1)

## Next Steps

1. Supabase logs check karo - Lucky5 parsing & matching verify karo
2. Agar rdesc nahi mil raha, to winningValue se construct karo (already implemented)
3. Excessive logs remove karo (119 console.log statements)


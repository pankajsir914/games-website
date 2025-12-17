import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Round, GameHistory, sequelize } from '../models';
import { WalletTransaction } from '../models/WalletTransaction';
import { Hand } from 'pokersolver';
import dayjs from 'dayjs';
import { config } from '../config/config';

let io: SocketIOServer | null = null;
let currentRound: Round | null = null;

const payoutMap: Record<string, number> = {
  'High Card': 0,
  'Pair': 1.5,
  'Two Pair': 2,
  'Three of a Kind': 3,
  'Straight': 4,
  'Flush': 6,
  'Full House': 9,
  'Four of a Kind': 25,
  'Straight Flush': 50,
  'Royal Flush': 100,
};

function randomHand(): string[] {
  const suits = ['s', 'h', 'd', 'c'];
  const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
  const deck: string[] = [];
  for (const r of ranks) for (const s of suits) deck.push(r + s);
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, 5);
}

export function getCurrentRound() {
  return currentRound ? { id: currentRound.id, sequence: currentRound.sequence } : null;
}

async function settleRound(round: Round, multiplier: number) {
  const pending = await GameHistory.findAll({ where: { roundId: round.id, result: 'PENDING' } });
  if (pending.length === 0) return;

  await sequelize.transaction(async (t) => {
    for (const gh of pending) {
      const payout = Math.floor(gh.bet * multiplier);
      const won = payout > 0;
      gh.payout = payout;
      gh.result = won ? 'WON' : 'LOST';
      gh.pointsAfter = gh.pointsAfter + payout; // pointsAfter currently equals pointsBefore - bet
      await gh.save({ transaction: t });
      if (payout > 0) {
        await sequelize.query('UPDATE wallets SET balance = balance + :payout WHERE "userId" = :userId', { transaction: t, replacements: { payout, userId: gh.userId } });
        await WalletTransaction.create({
          userId: gh.userId,
          actorId: null,
          amount: payout,
          type: 'credit',
          reason: `Poker payout - Round ${round.sequence} (${round.handName}) x${round.payoutMultiplier}`,
          metadata: { roundId: round.id },
        }, { transaction: t });
      }
    }
  });
}

export function initPokerEngine(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, { cors: { origin: config.corsOrigin } });

  io.on('connection', (socket) => {
    if (currentRound) {
      socket.emit('round_status', { roundId: currentRound.id, sequence: currentRound.sequence, status: currentRound.status });
    }
  });

  const tick = async () => {
    // Start new round
    currentRound = await Round.create({ status: 'PENDING', startedAt: new Date(), cards: '' });
    io?.emit('round_start', { roundId: currentRound.id, sequence: currentRound.sequence, startedAt: dayjs(currentRound.startedAt).toISOString() });

    // Simulate some delay (dealing)
    setTimeout(async () => {
      if (!currentRound) return;
      const cards = randomHand();
      const hand = Hand.solve(cards);
      const name = hand.name; // e.g., "Pair"
      const multiplier = payoutMap[name] ?? 0;

      currentRound.cards = cards.join(',');
      currentRound.handName = name;
      currentRound.payoutMultiplier = multiplier;
      currentRound.status = 'SETTLED';
      currentRound.endedAt = new Date();
      await currentRound.save();

      await settleRound(currentRound, multiplier);

      io?.emit('round_result', {
        roundId: currentRound.id,
        sequence: currentRound.sequence,
        cards,
        hand: name,
        payoutMultiplier: multiplier,
        endedAt: dayjs(currentRound.endedAt).toISOString(),
      });
    }, Math.min(3000, Math.floor(config.roundIntervalMs / 2)));
  };

  // Start interval
  tick();
  setInterval(tick, config.roundIntervalMs);

  return io;
}

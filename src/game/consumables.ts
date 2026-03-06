import { nextInt } from './rng';

export const ConsumableType = {
  SCRATCH_TICKET:  'SCRATCH_TICKET',
  HIGH_CARD_DRAW:  'HIGH_CARD_DRAW',
  ROULETTE:        'ROULETTE',
  BURNED_HAND:     'BURNED_HAND',
} as const;

export type ConsumableTypeValue = typeof ConsumableType[keyof typeof ConsumableType];

export interface Consumable {
  type: ConsumableTypeValue;
  name: string;
  description: string;
  icon: string;
}

export const CONSUMABLES: Record<ConsumableTypeValue, Consumable> = {
  SCRATCH_TICKET: {
    type: ConsumableType.SCRATCH_TICKET,
    name: 'Scratch Ticket',
    description: 'Reveal a x1–x5 multiplier for your next hand.',
    icon: '🎫',
  },
  HIGH_CARD_DRAW: {
    type: ConsumableType.HIGH_CARD_DRAW,
    name: 'High Card Draw',
    description: 'Draw 2 extra cards into your hand.',
    icon: '🃏',
  },
  ROULETTE: {
    type: ConsumableType.ROULETTE,
    name: 'Roulette',
    description: 'Bet up to 50 personal chips. Double or nothing.',
    icon: '🎰',
  },
  BURNED_HAND: {
    type: ConsumableType.BURNED_HAND,
    name: 'Burned Hand',
    description: 'Sacrifice 1 hand. Your next hand scores ×3.',
    icon: '🔥',
  },
};

export function getConsumable(type: ConsumableTypeValue): Consumable {
  return CONSUMABLES[type];
}

export function rollScratchMultiplier(rngState?: number): number | { value: number; rngState: number } {
  const rolls = [1, 1, 2, 2, 3, 4, 5];
  const draw = nextInt(rngState ?? (Date.now() >>> 0), rolls.length);
  if (rngState === undefined) return rolls[draw.value];
  return { value: rolls[draw.value], rngState: draw.state };
}

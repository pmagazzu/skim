export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export const CardModifier = {
  POLISHED:  'POLISHED',   // common   — +10 chips when scoring
  SCARRED:   'SCARRED',    // common   — +15 chips when scoring
  CHARGED:   'CHARGED',    // uncommon — doubles pip value contribution
  HOT:       'HOT',        // uncommon — ×1.5 mult on hands this card scores in
  WILD:      'WILD',       // uncommon — counts as any suit for flush eval
  VOLATILE:  'VOLATILE',   // rare     — +50 chips if scoring, −20 if selected but not scoring
  GHOST:     'GHOST',      // rare     — invisible to hand rank eval, still adds chips
  CURSED:    'CURSED',     // legendary — +80 chips, then permanently removed from deck
  MIMIC:     'MIMIC',      // legendary — copies modifier of highest-pip card in scoring hand
} as const;

export type CardModifierValue = typeof CardModifier[keyof typeof CardModifier];

export const MODIFIER_RARITY: Record<CardModifierValue, 'common' | 'uncommon' | 'rare' | 'legendary'> = {
  POLISHED: 'common',
  SCARRED:  'common',
  CHARGED:  'uncommon',
  HOT:      'uncommon',
  WILD:     'uncommon',
  VOLATILE: 'rare',
  GHOST:    'rare',
  CURSED:   'legendary',
  MIMIC:    'legendary',
};

export const MODIFIER_LABEL: Record<CardModifierValue, string> = {
  POLISHED: '💎 Polished',
  SCARRED:  '🔴 Scarred',
  CHARGED:  '⚡ Charged',
  HOT:      '🔥 Hot',
  WILD:     '🌀 Wild',
  VOLATILE: '💣 Volatile',
  GHOST:    '👻 Ghost',
  CURSED:   '💀 Cursed',
  MIMIC:    '🎭 Mimic',
};

export const MODIFIER_DESC: Record<CardModifierValue, string> = {
  POLISHED: '+10 chips when this card scores',
  SCARRED:  '+15 chips when this card scores',
  CHARGED:  'Doubles pip value contribution',
  HOT:      '×1.5 mult on any hand this card scores in',
  WILD:     'Counts as any suit for flush evaluation',
  VOLATILE: '+50 chips if scoring, −20 chips if selected but not scoring',
  GHOST:    'Invisible to hand rank evaluation, still contributes chips',
  CURSED:   '+80 chips when scoring, then permanently removed from deck',
  MIMIC:    'Copies the modifier of the highest-pip card in the scoring hand',
};

export interface Card {
  suit: Suit;
  rank: number; // 2-14, 14 = Ace
  id: string;
  modifier?: CardModifierValue;
}

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank, id: `${suit}-${rank}` });
    }
  }
  return deck;
}

export function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function rankName(rank: number): string {
  if (rank <= 10) return String(rank);
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return 'A';
}

export function suitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return map[suit];
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

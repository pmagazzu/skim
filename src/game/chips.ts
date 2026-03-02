export const ChipRarity = {
  COMMON:    'common',
  UNCOMMON:  'uncommon',
  RARE:      'rare',
  LEGENDARY: 'legendary',
} as const;

export type ChipRarityValue = typeof ChipRarity[keyof typeof ChipRarity];

export const RARITY_LABELS: Record<ChipRarityValue, string> = {
  common:    '○ Common',
  uncommon:  '◑ Uncommon',
  rare:      '● Rare',
  legendary: '★ Legendary',
};

export const RARITY_COLORS: Record<ChipRarityValue, string> = {
  common:    'text-gray-400',
  uncommon:  'text-blue-400',
  rare:      'text-purple-400',
  legendary: 'text-yellow-300',
};

// Weighted rarity roll
export function rollRarity(round: number): ChipRarityValue {
  const r = Math.random() * 100;
  if (round < 2) {
    if (r < 60) return 'common';
    if (r < 85) return 'uncommon';
    return 'rare';
  }
  if (r < 45) return 'common';
  if (r < 72) return 'uncommon';
  if (r < 92) return 'rare';
  return 'legendary';
}

export const ChipType = {
  RED:      'RED',
  BLUE:     'BLUE',
  BLACK:    'BLACK',
  GOLD:     'GOLD',
  LUCKY:    'LUCKY',
  SILVER:   'SILVER',
  DIAMOND:  'DIAMOND',
} as const;

export type ChipTypeValue = typeof ChipType[keyof typeof ChipType];

export interface Chip {
  type: ChipTypeValue;
  name: string;
  description: string;
  color: string;
  textColor: string;
  cost: number;
  rarity: ChipRarityValue;
}

export const CHIPS: Record<ChipTypeValue, Chip> = {
  RED: {
    type: ChipType.RED,
    name: 'Red Chip',
    description: '+15 chips added to every hand you play.',
    color: 'bg-red-600',
    textColor: 'text-red-400',
    cost: 40,
    rarity: 'common',
  },
  BLUE: {
    type: ChipType.BLUE,
    name: 'Blue Chip',
    description: 'Pairs and above score ×1.2.',
    color: 'bg-blue-600',
    textColor: 'text-blue-400',
    cost: 60,
    rarity: 'uncommon',
  },
  BLACK: {
    type: ChipType.BLACK,
    name: 'Black Chip',
    description: 'Once per round, double your skim on one hand.',
    color: 'bg-gray-800',
    textColor: 'text-gray-300',
    cost: 80,
    rarity: 'rare',
  },
  GOLD: {
    type: ChipType.GOLD,
    name: 'Gold Chip',
    description: 'Every 5th hand played triggers a +80 vault bonus.',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    cost: 100,
    rarity: 'rare',
  },
  LUCKY: {
    type: ChipType.LUCKY,
    name: 'Lucky Chip',
    description: 'Each hand adds a random +10 to +50 bonus.',
    color: 'bg-purple-600',
    textColor: 'text-purple-400',
    cost: 50,
    rarity: 'common',
  },
  SILVER: {
    type: ChipType.SILVER,
    name: 'Silver Chip',
    description: '+1 hand per round. More time at the table.',
    color: 'bg-gray-400',
    textColor: 'text-gray-300',
    cost: 70,
    rarity: 'uncommon',
  },
  DIAMOND: {
    type: ChipType.DIAMOND,
    name: 'Diamond Chip',
    description: 'Your skim also contributes 50% to the vault. Take it all.',
    color: 'bg-cyan-300',
    textColor: 'text-cyan-300',
    cost: 200,
    rarity: 'legendary',
  },
};

export function getChip(type: ChipTypeValue): Chip {
  return CHIPS[type];
}

/** How many bonus hands does the chip stack grant? */
export function bonusHandsFromChips(chips: ChipTypeValue[]): number {
  return chips.filter(c => c === ChipType.SILVER).length;
}

export interface ChipBonusResult {
  flatBonus: number;
  multiplier: number;
  skimDoubled: boolean;
  vaultBonus: number;
  diamondActive: boolean;  // skim also feeds vault at 50%
}

export function applyChips(
  chips: ChipTypeValue[],
  handRankValue: number,
  handsPlayedThisRound: number,
  blackChipUsed: boolean,
): ChipBonusResult {
  let flatBonus = 0;
  let multiplier = 1.0;
  let skimDoubled = false;
  let vaultBonus = 0;
  let diamondActive = false;

  for (const chip of chips) {
    switch (chip) {
      case ChipType.RED:
        flatBonus += 15;
        break;
      case ChipType.BLUE:
        if (handRankValue >= 2) multiplier += 0.2;
        break;
      case ChipType.BLACK:
        if (!blackChipUsed) skimDoubled = true;
        break;
      case ChipType.GOLD:
        if ((handsPlayedThisRound + 1) % 5 === 0) vaultBonus += 80;
        break;
      case ChipType.LUCKY:
        flatBonus += 10 + Math.floor(Math.random() * 41);
        break;
      case ChipType.SILVER:
        break;
      case ChipType.DIAMOND:
        diamondActive = true;
        break;
    }
  }

  return { flatBonus, multiplier, skimDoubled, vaultBonus, diamondActive };
}

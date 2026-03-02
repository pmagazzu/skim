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
    description: '+15 chips added to running total.',
    color: 'bg-red-600',
    textColor: 'text-red-400',
    cost: 40,
    rarity: 'common',
  },
  BLUE: {
    type: ChipType.BLUE,
    name: 'Blue Chip',
    description: 'Pairs and above: ×1.2 to running total.',
    color: 'bg-blue-600',
    textColor: 'text-blue-400',
    cost: 60,
    rarity: 'uncommon',
  },
  BLACK: {
    type: ChipType.BLACK,
    name: 'Black Chip',
    description: 'Once per round: double your skim on this hand.',
    color: 'bg-gray-800',
    textColor: 'text-gray-300',
    cost: 80,
    rarity: 'rare',
  },
  GOLD: {
    type: ChipType.GOLD,
    name: 'Gold Chip',
    description: 'Every 5th hand: +80 vault bonus (not in chain).',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    cost: 100,
    rarity: 'rare',
  },
  LUCKY: {
    type: ChipType.LUCKY,
    name: 'Lucky Chip',
    description: 'Random +10–50 added to running total.',
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
    description: 'Your skim also contributes 50% to the vault.',
    color: 'bg-cyan-300',
    textColor: 'text-cyan-300',
    cost: 200,
    rarity: 'legendary',
  },
};

export function getChip(type: ChipTypeValue): Chip {
  return CHIPS[type];
}

export function bonusHandsFromChips(chips: ChipTypeValue[]): number {
  return chips.filter(c => c === ChipType.SILVER).length;
}

// A single step in the scoring chain
export interface ScoreStep {
  chipType: ChipTypeValue;
  label: string;       // e.g. "Red Chip"
  delta: string;       // e.g. "+15" or "×1.2"
  before: number;
  after: number;
  skimDoubled?: boolean;
  vaultBonus?: number;
  diamondActive?: boolean;
}

export interface ChainResult {
  finalScore: number;
  steps: ScoreStep[];
  skimDoubled: boolean;
  vaultBonus: number;
  diamondActive: boolean;
}

// Apply chips sequentially — order matters!
// Flat bonuses add to running total, multipliers multiply running total
export function applyChipsSequential(
  chips: ChipTypeValue[],
  baseScore: number,
  handRankValue: number,
  handsPlayedThisRound: number,
  blackChipUsed: boolean,
): ChainResult {
  let running = baseScore;
  const steps: ScoreStep[] = [];
  let skimDoubled = false;
  let vaultBonus = 0;
  let diamondActive = false;

  for (const chip of chips) {
    const before = running;

    switch (chip) {
      case ChipType.RED: {
        running += 15;
        steps.push({ chipType: chip, label: 'Red Chip', delta: '+15', before, after: running });
        break;
      }
      case ChipType.BLUE: {
        if (handRankValue >= 2) {
          running = Math.floor(running * 1.2);
          steps.push({ chipType: chip, label: 'Blue Chip', delta: '×1.2', before, after: running });
        }
        break;
      }
      case ChipType.BLACK: {
        if (!blackChipUsed) {
          skimDoubled = true;
          steps.push({ chipType: chip, label: 'Black Chip', delta: 'Skim ×2', before, after: running, skimDoubled: true });
        }
        break;
      }
      case ChipType.GOLD: {
        if ((handsPlayedThisRound + 1) % 5 === 0) {
          vaultBonus += 80;
          steps.push({ chipType: chip, label: 'Gold Chip', delta: '+80 vault', before, after: running, vaultBonus: 80 });
        }
        break;
      }
      case ChipType.LUCKY: {
        const roll = 10 + Math.floor(Math.random() * 41);
        running += roll;
        steps.push({ chipType: chip, label: 'Lucky Chip', delta: `+${roll}`, before, after: running });
        break;
      }
      case ChipType.SILVER: {
        // No in-hand effect — handled at deal time
        break;
      }
      case ChipType.DIAMOND: {
        diamondActive = true;
        steps.push({ chipType: chip, label: 'Diamond Chip', delta: 'Skim→Vault 50%', before, after: running, diamondActive: true });
        break;
      }
    }
  }

  return { finalScore: running, steps, skimDoubled, vaultBonus, diamondActive };
}

// Keep old applyChips for compatibility — delegates to sequential
export interface ChipBonusResult {
  flatBonus: number;
  multiplier: number;
  skimDoubled: boolean;
  vaultBonus: number;
  diamondActive: boolean;
}

export function applyChips(
  chips: ChipTypeValue[],
  handRankValue: number,
  handsPlayedThisRound: number,
  blackChipUsed: boolean,
): ChipBonusResult {
  // Legacy shim — not used for scoring anymore, kept for type safety
  const result = applyChipsSequential(chips, 0, handRankValue, handsPlayedThisRound, blackChipUsed);
  return {
    flatBonus: 0,
    multiplier: 1,
    skimDoubled: result.skimDoubled,
    vaultBonus: result.vaultBonus,
    diamondActive: result.diamondActive,
  };
}

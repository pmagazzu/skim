export const ChipType = {
  RED:   'RED',
  BLUE:  'BLUE',
  BLACK: 'BLACK',
  GOLD:  'GOLD',
  LUCKY: 'LUCKY',
} as const;

export type ChipTypeValue = typeof ChipType[keyof typeof ChipType];

export interface Chip {
  type: ChipTypeValue;
  name: string;
  description: string;
  color: string;       // tailwind bg class
  textColor: string;   // tailwind text class
  cost: number;
}

export const CHIPS: Record<ChipTypeValue, Chip> = {
  RED: {
    type: ChipType.RED,
    name: 'Red Chip',
    description: '+15 chips added to every hand you play.',
    color: 'bg-red-600',
    textColor: 'text-red-400',
    cost: 40,
  },
  BLUE: {
    type: ChipType.BLUE,
    name: 'Blue Chip',
    description: 'Pairs and above score ×1.2.',
    color: 'bg-blue-600',
    textColor: 'text-blue-400',
    cost: 60,
  },
  BLACK: {
    type: ChipType.BLACK,
    name: 'Black Chip',
    description: 'Once per round, double your skim on one hand.',
    color: 'bg-gray-800',
    textColor: 'text-gray-300',
    cost: 80,
  },
  GOLD: {
    type: ChipType.GOLD,
    name: 'Gold Chip',
    description: 'Every 5th hand played triggers a +80 vault bonus.',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    cost: 100,
  },
  LUCKY: {
    type: ChipType.LUCKY,
    name: 'Lucky Chip',
    description: 'Each hand adds a random +10 to +50 bonus.',
    color: 'bg-purple-600',
    textColor: 'text-purple-400',
    cost: 50,
  },
};

export function getChip(type: ChipTypeValue): Chip {
  return CHIPS[type];
}

export interface ChipBonusResult {
  flatBonus: number;       // added to chips
  multiplier: number;      // applied after flat
  skimDoubled: boolean;    // black chip effect
  vaultBonus: number;      // gold chip vault bonus
}

export function applyChips(
  chips: ChipTypeValue[],
  handRankValue: number,  // 1-10
  handsPlayedThisRound: number,
  blackChipUsed: boolean,
): ChipBonusResult {
  let flatBonus = 0;
  let multiplier = 1.0;
  let skimDoubled = false;
  let vaultBonus = 0;

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
    }
  }

  return { flatBonus, multiplier, skimDoubled, vaultBonus };
}

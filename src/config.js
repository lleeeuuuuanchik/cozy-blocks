/**
 * Конфигурация игры «Уютные блоки»
 */
const CONFIG = {
  GRID_SIZE: 10,
  CELL_SIZE: 30,
  DEFAULT_LINES_GOAL: 5,
  POINTS_PER_LINE: 100,
  COMBO_MULTIPLIER: 1.5,
  LINES_GOAL_PER_LEVEL: 1,
  MAX_LINES_GOAL: 12,
  COINS_PER_LINE: 10,
  STREAK_MULTIPLIERS: [1, 1, 1.5, 2, 2.5],
  POWERUP_BOMB_CHANCE: 0.08,

  FREE_UNDOS: 3,
  AD_UNDOS: 3,

  FEVER_COMBO_THRESHOLD: 4,
  FEVER_DURATION: 20000,
  FEVER_MULTIPLIER: 3,

  STAR_CELLS_PER_LEVEL: 4,
  STAR_BONUS_COINS: 50,

  // Lucky Spin
  LUCKY_SPIN_COST: 30,

  // Daily Bonus
  DAILY_BONUS_COINS: 25,

  // Score Multiplier Bar
  MULTIPLIER_BAR_MAX: 5,
  MULTIPLIER_BAR_BONUS: 2,
};

/** Темы блоков — id: { cell, glow, name } */
const THEMES = {
  default: { cell: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.6)', name: 'Розовый' },
  wood:    { cell: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', name: 'Дерево' },
  nature:  { cell: '#4ade80', glow: 'rgba(74, 222, 128, 0.6)', name: 'Природа' },
  cosmos:  { cell: '#818cf8', glow: 'rgba(129, 140, 248, 0.6)', name: 'Космос' },
  fire:    { cell: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)', name: 'Огонь' },
};

const ASSETS = {
  characters: 'assets/characters/',
  blocks: 'assets/blocks/',
  ui: 'assets/ui/',
};

const PIECE_SKINS = [
  { id: 'default', name: 'Вода', price: 0, file: 'skin_water.png' },
  { id: 'fire', name: 'Огонь', price: 50, file: 'skin_fire.png' },
  { id: 'ice', name: 'Лёд', price: 75, file: 'skin_ice.png' },
  { id: 'forest', name: 'Лес', price: 75, file: 'skin_forest.png' },
  { id: 'puyo', name: 'Классика Puyo', price: 25, file: 'pieces.png' },
];

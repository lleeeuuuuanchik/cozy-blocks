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
  POWERUP_BOMB_CHANCE: 0.04,
  POWERUP_MAGNET_CHANCE: 0.02,

  FREE_UNDOS: 3,
  AD_UNDOS: 3,

  FEVER_COMBO_THRESHOLD: 4,
  FEVER_DURATION: 20000,
  FEVER_MULTIPLIER: 3,

  STAR_CELLS_PER_LEVEL: 4,
  STAR_BONUS_COINS: 50,

  // Lucky Spin
  LUCKY_SPIN_COST: 300,

  // Daily Bonus
  DAILY_BONUS_COINS: 30,

  // Score Multiplier Bar
  MULTIPLIER_BAR_MAX: 5,
  MULTIPLIER_BAR_BONUS: 2,

  // Frozen Blocks (level 7+)
  FROZEN_CELLS_MIN_LEVEL: 7,
  FROZEN_CELLS_PER_LEVEL: 3,

  // Time Attack
  TIME_ATTACK_DURATIONS: [60, 120],

  // Power-up Prices
  POWERUP_PRICES: { clearRow: 250, clearCol: 250, bomb: 200, shuffle: 150 },

  // Login Streak
  STREAK_REWARDS: [30, 50, 80, 120, 200, 300, 500],
};

/** Темы блоков — id: { cell, glow, name, gridBg, gridLine, accent } */
const THEMES = {
  default: { cell: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.6)', nameKey: 'theme_default',
             gridBg: '#1a1825', gridLine: 'rgba(255, 107, 157, 0.08)', accent: '#ff6b9d' },
  wood:    { cell: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', nameKey: 'theme_wood',
             gridBg: '#1c1a14', gridLine: 'rgba(245, 158, 11, 0.08)', accent: '#f59e0b' },
  nature:  { cell: '#4ade80', glow: 'rgba(74, 222, 128, 0.6)', nameKey: 'theme_nature',
             gridBg: '#141c17', gridLine: 'rgba(74, 222, 128, 0.08)', accent: '#4ade80' },
  cosmos:  { cell: '#818cf8', glow: 'rgba(129, 140, 248, 0.6)', nameKey: 'theme_cosmos',
             gridBg: '#12111f', gridLine: 'rgba(129, 140, 248, 0.1)', accent: '#818cf8' },
  fire:    { cell: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)', nameKey: 'theme_fire',
             gridBg: '#1c1510', gridLine: 'rgba(251, 146, 60, 0.1)', accent: '#fb923c' },
};


const PIECE_SKINS = [
  { id: 'default', nameKey: 'skin_default', price: 0, file: 'skin_water.png' },
  { id: 'fire', nameKey: 'skin_fire', price: 500, file: 'skin_fire.png' },
  { id: 'ice', nameKey: 'skin_ice', price: 800, file: 'skin_ice.png' },
  { id: 'forest', nameKey: 'skin_forest', price: 800, file: 'skin_forest.png' },
  { id: 'puyo', nameKey: 'skin_puyo', price: 250, file: 'pieces.png' },
  { id: 'gem', nameKey: 'skin_gem', price: 1000, file: 'skin_gem.png', noTint: true },
  { id: 'candy', nameKey: 'skin_candy', price: 650, file: 'skin_candy.png', noTint: true },
  { id: 'metal', nameKey: 'skin_metal', price: 1200, file: 'skin_metal.png', noTint: true },
];

/** Шаблоны ежедневных заданий */
const DAILY_CHALLENGE_TEMPLATES = [
  { id: 'clear_3_lines', textKey: 'chall_clear_3_lines', target: 3, type: 'lines', reward: 100 },
  { id: 'clear_5_lines', textKey: 'chall_clear_5_lines', target: 5, type: 'lines', reward: 150 },
  { id: 'use_bomb', textKey: 'chall_use_bomb', target: 1, type: 'bombs', reward: 75 },
  { id: 'use_2_bombs', textKey: 'chall_use_2_bombs', target: 2, type: 'bombs', reward: 120 },
  { id: 'combo_2', textKey: 'chall_combo_2', target: 2, type: 'combo', reward: 100 },
  { id: 'combo_3', textKey: 'chall_combo_3', target: 3, type: 'combo', reward: 200 },
  { id: 'score_1000', textKey: 'chall_score_1000', target: 1000, type: 'score', reward: 100 },
  { id: 'score_3000', textKey: 'chall_score_3000', target: 3000, type: 'score', reward: 200 },
  { id: 'play_2_games', textKey: 'chall_play_2_games', target: 2, type: 'games', reward: 80 },
  { id: 'collect_star', textKey: 'chall_collect_star', target: 1, type: 'stars', reward: 75 },
  { id: 'collect_3_stars', textKey: 'chall_collect_3_stars', target: 3, type: 'stars', reward: 150 },
  { id: 'clear_level', textKey: 'chall_clear_level', target: 1, type: 'levels', reward: 120 },
];

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
  default: { cell: '#ff6b9d', glow: 'rgba(255, 107, 157, 0.6)', name: 'Розовый',
             gridBg: '#1a1825', gridLine: 'rgba(255, 107, 157, 0.08)', accent: '#ff6b9d' },
  wood:    { cell: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', name: 'Дерево',
             gridBg: '#1c1a14', gridLine: 'rgba(245, 158, 11, 0.08)', accent: '#f59e0b' },
  nature:  { cell: '#4ade80', glow: 'rgba(74, 222, 128, 0.6)', name: 'Природа',
             gridBg: '#141c17', gridLine: 'rgba(74, 222, 128, 0.08)', accent: '#4ade80' },
  cosmos:  { cell: '#818cf8', glow: 'rgba(129, 140, 248, 0.6)', name: 'Космос',
             gridBg: '#12111f', gridLine: 'rgba(129, 140, 248, 0.1)', accent: '#818cf8' },
  fire:    { cell: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)', name: 'Огонь',
             gridBg: '#1c1510', gridLine: 'rgba(251, 146, 60, 0.1)', accent: '#fb923c' },
};

const ASSETS = {
  characters: 'assets/characters/',
  blocks: 'assets/blocks/',
  ui: 'assets/ui/',
};

const PIECE_SKINS = [
  { id: 'default', name: 'Вода', price: 0, file: 'skin_water.png' },
  { id: 'fire', name: 'Огонь', price: 500, file: 'skin_fire.png' },
  { id: 'ice', name: 'Лёд', price: 800, file: 'skin_ice.png' },
  { id: 'forest', name: 'Лес', price: 800, file: 'skin_forest.png' },
  { id: 'puyo', name: 'Классика Puyo', price: 250, file: 'pieces.png' },
  { id: 'gem', name: 'Драгоценность', price: 1000, file: 'skin_gem.png', noTint: true },
  { id: 'candy', name: 'Конфета', price: 650, file: 'skin_candy.png', noTint: true },
  { id: 'metal', name: 'Металл', price: 1200, file: 'skin_metal.png', noTint: true },
];

/** Шаблоны ежедневных заданий */
const DAILY_CHALLENGE_TEMPLATES = [
  { id: 'clear_3_lines', text: 'Очисти 3 линии за одну игру', target: 3, type: 'lines', reward: 100 },
  { id: 'clear_5_lines', text: 'Очисти 5 линий за одну игру', target: 5, type: 'lines', reward: 150 },
  { id: 'use_bomb', text: 'Используй бомбу', target: 1, type: 'bombs', reward: 75 },
  { id: 'use_2_bombs', text: 'Используй 2 бомбы', target: 2, type: 'bombs', reward: 120 },
  { id: 'combo_2', text: 'Сделай комбо x2', target: 2, type: 'combo', reward: 100 },
  { id: 'combo_3', text: 'Сделай комбо x3', target: 3, type: 'combo', reward: 200 },
  { id: 'score_1000', text: 'Набери 1000 очков за игру', target: 1000, type: 'score', reward: 100 },
  { id: 'score_3000', text: 'Набери 3000 очков за игру', target: 3000, type: 'score', reward: 200 },
  { id: 'play_2_games', text: 'Сыграй 2 игры', target: 2, type: 'games', reward: 80 },
  { id: 'collect_star', text: 'Собери звезду', target: 1, type: 'stars', reward: 75 },
  { id: 'collect_3_stars', text: 'Собери 3 звезды', target: 3, type: 'stars', reward: 150 },
  { id: 'clear_level', text: 'Пройди уровень', target: 1, type: 'levels', reward: 120 },
];

/**
 * Достижения: таблица условий и наград, проверка и разблокировка.
 * Каждая ачивка имеет icon, description, getProgress для отображения в карточках.
 */
const ACHIEVEMENTS_LIST = [
  {
    id: 'first_win',
    name: 'Первая победа',
    icon: '🏆',
    description: 'Пройди первый уровень',
    condition: function (data, session) { return session.levelsPassed >= 1; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed, 1) * 100; },
    reward: 'Тема «Дерево»',
    unlockTheme: 'wood',
  },
  {
    id: 'levels_5',
    name: 'Пять уровней',
    icon: '⭐',
    description: 'Пройди 5 уровней',
    condition: function (data) { return data.totalLevelsPassed >= 5; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed / 5, 1) * 100; },
    reward: 'Тема «Природа»',
    unlockTheme: 'nature',
  },
  {
    id: 'lines_10_one',
    name: 'Комбо-мастер',
    icon: '🔥',
    description: 'Очисти 10 линий за одну игру',
    condition: function (data, session) { return session.sessionLines >= 10; },
    getProgress: function (data) { return 0; },
    reward: 'Бейдж «Комбо-мастер»',
  },
  {
    id: 'total_lines_50',
    name: '50 линий',
    icon: '📏',
    description: 'Очисти 50 линий всего',
    condition: function (data) { return data.totalLinesCleared >= 50; },
    getProgress: function (data) { return Math.min(data.totalLinesCleared / 50, 1) * 100; },
    reward: 'Персонаж Нацуми',
    unlockCharacter: '2',
  },
  {
    id: 'total_levels_10',
    name: 'Десять уровней',
    icon: '🎯',
    description: 'Пройди 10 уровней',
    condition: function (data) { return data.totalLevelsPassed >= 10; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed / 10, 1) * 100; },
    reward: 'Персонаж Михо',
    unlockCharacter: '3',
  },
  {
    id: 'score_5000',
    name: 'Рекордсмен',
    icon: '💎',
    description: 'Набери 5000 очков за одну игру',
    condition: function (data) { return data.bestScoreInOneSession >= 5000; },
    getProgress: function (data) { return Math.min(data.bestScoreInOneSession / 5000, 1) * 100; },
    reward: 'Бейдж «Рекордсмен»',
  },
  // === Новые ачивки ===
  {
    id: 'combo_3',
    name: 'Тройное комбо',
    icon: '⚡',
    description: 'Сделай 3 комбо подряд',
    condition: function (data) { return (data.bestCombo || 0) >= 3; },
    getProgress: function (data) { return Math.min((data.bestCombo || 0) / 3, 1) * 100; },
    reward: '50 монет',
    rewardCoins: 50,
  },
  {
    id: 'combo_5',
    name: 'Комбо-машина',
    icon: '💥',
    description: 'Сделай 5 комбо подряд',
    condition: function (data) { return (data.bestCombo || 0) >= 5; },
    getProgress: function (data) { return Math.min((data.bestCombo || 0) / 5, 1) * 100; },
    reward: '100 монет',
    rewardCoins: 100,
  },
  {
    id: 'lines_100',
    name: 'Сотня линий',
    icon: '🌟',
    description: 'Очисти 100 линий всего',
    condition: function (data) { return data.totalLinesCleared >= 100; },
    getProgress: function (data) { return Math.min(data.totalLinesCleared / 100, 1) * 100; },
    reward: 'Тема «Космос»',
    unlockTheme: 'cosmos',
  },
  {
    id: 'score_10000',
    name: 'Мега-рекордсмен',
    icon: '👑',
    description: 'Набери 10000 очков за одну игру',
    condition: function (data) { return data.bestScoreInOneSession >= 10000; },
    getProgress: function (data) { return Math.min(data.bestScoreInOneSession / 10000, 1) * 100; },
    reward: '150 монет',
    rewardCoins: 150,
  },
  {
    id: 'levels_20',
    name: 'Марафонец',
    icon: '🏃',
    description: 'Пройди 20 уровней',
    condition: function (data) { return data.totalLevelsPassed >= 20; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed / 20, 1) * 100; },
    reward: 'Тема «Огонь»',
    unlockTheme: 'fire',
  },
  {
    id: 'bombs_10',
    name: 'Бомбардир',
    icon: '💣',
    description: 'Используй 10 бомб',
    condition: function (data) { return (data.totalBombsUsed || 0) >= 10; },
    getProgress: function (data) { return Math.min((data.totalBombsUsed || 0) / 10, 1) * 100; },
    reward: '75 монет',
    rewardCoins: 75,
  },
];

const Achievements = {
  /**
   * Проверить все достижения после обновления прогресса.
   * @param {object} data - Progress.data
   * @param {object} session - { levelsPassed, sessionScore, sessionLines, currentLevel }
   */
  checkAll: function (data, session) {
    const newlyUnlocked = [];
    for (var i = 0; i < ACHIEVEMENTS_LIST.length; i++) {
      var a = ACHIEVEMENTS_LIST[i];
      if (data.achievements[a.id]) continue;
      if (!a.condition(data, session)) continue;
      Progress.setAchievement(a.id);
      if (a.unlockTheme) Progress.unlockTheme(a.unlockTheme);
      if (a.unlockCharacter) Progress.unlockCharacter(a.unlockCharacter);
      if (a.rewardCoins) {
        data.coins = (data.coins || 0) + a.rewardCoins;
        Progress.save();
      }
      newlyUnlocked.push(a);
    }
    return newlyUnlocked;
  },

  getList: function () {
    return ACHIEVEMENTS_LIST;
  },

  getUnlockedIds: function () {
    if (!Progress.data) Progress.load();
    return Object.keys(Progress.data.achievements).filter(function (id) { return Progress.data.achievements[id]; });
  },
};

/**
 * Достижения: таблица условий и наград, проверка и разблокировка.
 * Каждая ачивка имеет icon, description, getProgress для отображения в карточках.
 */
const ACHIEVEMENTS_LIST = [
  {
    id: 'first_win',
    nameKey: 'ach_first_win_name',
    icon: '🏆',
    descKey: 'ach_first_win_desc',
    condition: function (data, session) { return session.levelsPassed >= 1; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed, 1) * 100; },
    rewardKey: 'ach_first_win_reward',
    unlockTheme: 'wood',
  },
  {
    id: 'levels_5',
    nameKey: 'ach_levels_5_name',
    icon: '⭐',
    descKey: 'ach_levels_5_desc',
    condition: function (data) { return data.totalLevelsPassed >= 5; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed / 5, 1) * 100; },
    rewardKey: 'ach_levels_5_reward',
    unlockTheme: 'nature',
  },
  {
    id: 'lines_10_one',
    nameKey: 'ach_lines_10_one_name',
    icon: '🔥',
    descKey: 'ach_lines_10_one_desc',
    condition: function (data, session) { return session.sessionLines >= 10; },
    getProgress: function (data) { return 0; },
    rewardKey: 'ach_lines_10_one_reward',
  },
  {
    id: 'total_lines_50',
    nameKey: 'ach_total_lines_50_name',
    icon: '📏',
    descKey: 'ach_total_lines_50_desc',
    condition: function (data) { return data.totalLinesCleared >= 50; },
    getProgress: function (data) { return Math.min(data.totalLinesCleared / 50, 1) * 100; },
    rewardKey: 'ach_total_lines_50_reward',
    unlockCharacter: '2',
  },
  {
    id: 'total_levels_10',
    nameKey: 'ach_total_levels_10_name',
    icon: '🎯',
    descKey: 'ach_total_levels_10_desc',
    condition: function (data) { return data.totalLevelsPassed >= 10; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed / 10, 1) * 100; },
    rewardKey: 'ach_total_levels_10_reward',
    unlockCharacter: '3',
  },
  {
    id: 'score_5000',
    nameKey: 'ach_score_5000_name',
    icon: '💎',
    descKey: 'ach_score_5000_desc',
    condition: function (data) { return data.bestScoreInOneSession >= 5000; },
    getProgress: function (data) { return Math.min(data.bestScoreInOneSession / 5000, 1) * 100; },
    rewardKey: 'ach_score_5000_reward',
  },
  {
    id: 'combo_3',
    nameKey: 'ach_combo_3_name',
    icon: '⚡',
    descKey: 'ach_combo_3_desc',
    condition: function (data) { return (data.bestCombo || 0) >= 3; },
    getProgress: function (data) { return Math.min((data.bestCombo || 0) / 3, 1) * 100; },
    rewardKey: 'ach_combo_3_reward',
    rewardCoins: 200,
  },
  {
    id: 'combo_5',
    nameKey: 'ach_combo_5_name',
    icon: '💥',
    descKey: 'ach_combo_5_desc',
    condition: function (data) { return (data.bestCombo || 0) >= 5; },
    getProgress: function (data) { return Math.min((data.bestCombo || 0) / 5, 1) * 100; },
    rewardKey: 'ach_combo_5_reward',
    rewardCoins: 400,
  },
  {
    id: 'lines_100',
    nameKey: 'ach_lines_100_name',
    icon: '🌟',
    descKey: 'ach_lines_100_desc',
    condition: function (data) { return data.totalLinesCleared >= 100; },
    getProgress: function (data) { return Math.min(data.totalLinesCleared / 100, 1) * 100; },
    rewardKey: 'ach_lines_100_reward',
    unlockTheme: 'cosmos',
  },
  {
    id: 'score_10000',
    nameKey: 'ach_score_10000_name',
    icon: '👑',
    descKey: 'ach_score_10000_desc',
    condition: function (data) { return data.bestScoreInOneSession >= 10000; },
    getProgress: function (data) { return Math.min(data.bestScoreInOneSession / 10000, 1) * 100; },
    rewardKey: 'ach_score_10000_reward',
    rewardCoins: 600,
  },
  {
    id: 'levels_20',
    nameKey: 'ach_levels_20_name',
    icon: '🏃',
    descKey: 'ach_levels_20_desc',
    condition: function (data) { return data.totalLevelsPassed >= 20; },
    getProgress: function (data) { return Math.min(data.totalLevelsPassed / 20, 1) * 100; },
    rewardKey: 'ach_levels_20_reward',
    unlockTheme: 'fire',
  },
  {
    id: 'bombs_10',
    nameKey: 'ach_bombs_10_name',
    icon: '💣',
    descKey: 'ach_bombs_10_desc',
    condition: function (data) { return (data.totalBombsUsed || 0) >= 10; },
    getProgress: function (data) { return Math.min((data.totalBombsUsed || 0) / 10, 1) * 100; },
    rewardKey: 'ach_bombs_10_reward',
    rewardCoins: 300,
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

/**
 * Постоянный прогресс игрока (localStorage).
 */
const STORAGE_KEY = 'uyutnye_bloki_progress';

const Progress = {
  data: null,

  getDefault: function () {
    return {
      totalLevelsPassed: 0,
      totalScore: 0,
      totalLinesCleared: 0,
      maxLevelReached: 1,
      bestScoreInOneSession: 0,
      achievements: {},
      unlockedThemes: ['default'],
      unlockedCharacters: ['1'],
      coins: 0,
      purchasedPieceSkins: ['default'],
      equippedPieceSkin: 'default',
      bestCombo: 0,
      totalCombos: 0,
      totalBombsUsed: 0,
      selectedTheme: 'default',
      bestEndlessScore: 0,
      lastDailyDate: '',
      totalGamesPlayed: 0,
    };
  },

  load: function () {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.data = Object.assign(this.getDefault(), JSON.parse(raw));
        if (!Array.isArray(this.data.unlockedThemes)) this.data.unlockedThemes = ['default'];
        if (!Array.isArray(this.data.unlockedCharacters)) this.data.unlockedCharacters = ['1'];
        if (!Array.isArray(this.data.purchasedPieceSkins)) this.data.purchasedPieceSkins = ['default'];
        if (!this.data.equippedPieceSkin) this.data.equippedPieceSkin = 'default';
        return this.data;
      }
    } catch (e) {}
    this.data = this.getDefault();
    return this.data;
  },

  save: function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
  },

  addSession: function (levelsPassed, sessionScore, sessionLines, currentLevel, bombsUsed) {
    if (!this.data) this.load();
    this.data.totalLevelsPassed += levelsPassed;
    this.data.totalScore += sessionScore;
    this.data.totalLinesCleared += sessionLines;
    if (currentLevel > this.data.maxLevelReached) {
      this.data.maxLevelReached = currentLevel;
    }
    if (sessionScore > this.data.bestScoreInOneSession) {
      this.data.bestScoreInOneSession = sessionScore;
    }
    this.data.totalBombsUsed = (this.data.totalBombsUsed || 0) + (bombsUsed || 0);
    const coinsToAdd = (typeof CONFIG !== 'undefined' && CONFIG.COINS_PER_LINE) ? sessionLines * CONFIG.COINS_PER_LINE : 0;
    this.data.coins = (this.data.coins || 0) + coinsToAdd;
    this.save();
    if (typeof Achievements !== 'undefined') {
      return Achievements.checkAll(this.data, { levelsPassed: levelsPassed, sessionScore: sessionScore, sessionLines: sessionLines, currentLevel: currentLevel });
    }
    return [];
  },

  isThemeUnlocked: function (themeId) {
    if (!this.data) this.load();
    return this.data.unlockedThemes.indexOf(themeId) !== -1;
  },

  isCharacterUnlocked: function (characterId) {
    if (!this.data) this.load();
    return this.data.unlockedCharacters.indexOf(characterId) !== -1;
  },

  unlockTheme: function (themeId) {
    if (!this.data) this.load();
    if (this.data.unlockedThemes.indexOf(themeId) === -1) {
      this.data.unlockedThemes.push(themeId);
      this.save();
    }
  },

  unlockCharacter: function (characterId) {
    if (!this.data) this.load();
    if (this.data.unlockedCharacters.indexOf(characterId) === -1) {
      this.data.unlockedCharacters.push(characterId);
      this.save();
    }
  },

  hasAchievement: function (achievementId) {
    if (!this.data) this.load();
    return !!this.data.achievements[achievementId];
  },

  setAchievement: function (achievementId) {
    if (!this.data) this.load();
    if (!this.data.achievements[achievementId]) {
      this.data.achievements[achievementId] = true;
      this.save();
      return true;
    }
    return false;
  },

  isSkinPurchased: function (skinId) {
    if (!this.data) this.load();
    return (this.data.purchasedPieceSkins || ['default']).indexOf(skinId) !== -1;
  },

  purchaseSkin: function (skinId) {
    if (!this.data) this.load();
    if (this.data.purchasedPieceSkins.indexOf(skinId) === -1) {
      this.data.purchasedPieceSkins.push(skinId);
      this.save();
    }
  },

  spendCoins: function (amount) {
    if (!this.data) this.load();
    if ((this.data.coins || 0) < amount) return false;
    this.data.coins -= amount;
    this.save();
    return true;
  },

  equipPieceSkin: function (skinId) {
    if (!this.data) this.load();
    if (this.data.purchasedPieceSkins.indexOf(skinId) !== -1) {
      this.data.equippedPieceSkin = skinId;
      this.save();
    }
  },

  selectTheme: function (themeId) {
    if (!this.data) this.load();
    if (this.data.unlockedThemes.indexOf(themeId) !== -1) {
      this.data.selectedTheme = themeId;
      this.save();
    }
  },

  updateBestEndless: function (score) {
    if (!this.data) this.load();
    if (score > (this.data.bestEndlessScore || 0)) {
      this.data.bestEndlessScore = score;
      this.save();
    }
  },

  checkDailyBonus: function () {
    if (!this.data) this.load();
    var today = new Date().toISOString().slice(0, 10);
    if (this.data.lastDailyDate === today) return 0;
    this.data.lastDailyDate = today;
    var bonus = 25;
    this.data.coins = (this.data.coins || 0) + bonus;
    this.save();
    return bonus;
  },

  incrementGamesPlayed: function () {
    if (!this.data) this.load();
    this.data.totalGamesPlayed = (this.data.totalGamesPlayed || 0) + 1;
    this.save();
  },
};

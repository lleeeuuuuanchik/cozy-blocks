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
      bestGravityScore: 0,
      dailyChallenges: null,
      dailyChallengesDate: '',
      weeklyScores: [],
      weeklyResetDate: '',
      bestTimeAttackScore: 0,
      loginStreak: 0,
      lastLoginDate: '',
      completedPuzzles: [],
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
    var result = this.checkLoginStreak();
    return result.reward;
  },

  checkLoginStreak: function () {
    if (!this.data) this.load();
    var today = new Date().toISOString().slice(0, 10);
    if (this.data.lastLoginDate === today) {
      return { streak: this.data.loginStreak || 0, reward: 0, isNew: false };
    }
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (this.data.lastLoginDate === yesterday) {
      this.data.loginStreak = Math.min((this.data.loginStreak || 0) + 1, 7);
    } else {
      this.data.loginStreak = 1;
    }
    this.data.lastLoginDate = today;
    this.data.lastDailyDate = today;
    var rewards = (typeof CONFIG !== 'undefined' && CONFIG.STREAK_REWARDS) ? CONFIG.STREAK_REWARDS : [30, 50, 80, 120, 200, 300, 500];
    var reward = rewards[Math.min(this.data.loginStreak - 1, rewards.length - 1)];
    this.data.coins = (this.data.coins || 0) + reward;
    this.save();
    return { streak: this.data.loginStreak, reward: reward, isNew: true };
  },

  incrementGamesPlayed: function () {
    if (!this.data) this.load();
    this.data.totalGamesPlayed = (this.data.totalGamesPlayed || 0) + 1;
    this.save();
  },

  updateBestGravity: function (score) {
    if (!this.data) this.load();
    if (score > (this.data.bestGravityScore || 0)) {
      this.data.bestGravityScore = score;
      this.save();
    }
  },

  updateBestTimeAttack: function (score) {
    if (!this.data) this.load();
    if (score > (this.data.bestTimeAttackScore || 0)) {
      this.data.bestTimeAttackScore = score;
      this.save();
    }
  },

  // === Daily Challenges ===
  getDailyChallenges: function () {
    if (!this.data) this.load();
    var today = new Date().toISOString().slice(0, 10);
    if (this.data.dailyChallengesDate === today && this.data.dailyChallenges) {
      return this.data.dailyChallenges;
    }
    // Generate 3 random challenges
    var templates = typeof DAILY_CHALLENGE_TEMPLATES !== 'undefined' ? DAILY_CHALLENGE_TEMPLATES : [];
    var shuffled = templates.slice().sort(function () { return Math.random() - 0.5; });
    var picked = shuffled.slice(0, 3);
    var challenges = [];
    for (var i = 0; i < picked.length; i++) {
      challenges.push({ id: picked[i].id, textKey: picked[i].textKey, target: picked[i].target, type: picked[i].type, reward: picked[i].reward, progress: 0, completed: false });
    }
    this.data.dailyChallenges = challenges;
    this.data.dailyChallengesDate = today;
    this.save();
    return challenges;
  },

  updateChallengeProgress: function (type, value) {
    if (!this.data) this.load();
    var challenges = this.data.dailyChallenges;
    if (!challenges) return [];
    var completed = [];
    for (var i = 0; i < challenges.length; i++) {
      var ch = challenges[i];
      if (ch.completed || ch.type !== type) continue;
      ch.progress = Math.max(ch.progress, value);
      if (ch.progress >= ch.target) {
        ch.completed = true;
        this.data.coins = (this.data.coins || 0) + ch.reward;
        completed.push(ch);
      }
    }
    if (completed.length > 0) this.save();
    return completed;
  },

  // === Weekly Leaderboard ===
  getWeeklyScores: function () {
    if (!this.data) this.load();
    this._checkWeeklyReset();
    return this.data.weeklyScores || [];
  },

  addWeeklyScore: function (score, mode) {
    if (!this.data) this.load();
    this._checkWeeklyReset();
    var scores = this.data.weeklyScores || [];
    scores.push({ score: score, mode: mode || 'classic', date: new Date().toISOString().slice(0, 10) });
    scores.sort(function (a, b) { return b.score - a.score; });
    this.data.weeklyScores = scores.slice(0, 10);
    this.save();
  },

  isPuzzleCompleted: function (puzzleId) {
    if (!this.data) this.load();
    return (this.data.completedPuzzles || []).indexOf(puzzleId) !== -1;
  },

  completePuzzle: function (puzzleId, reward) {
    if (!this.data) this.load();
    if ((this.data.completedPuzzles || []).indexOf(puzzleId) === -1) {
      if (!this.data.completedPuzzles) this.data.completedPuzzles = [];
      this.data.completedPuzzles.push(puzzleId);
      this.data.coins = (this.data.coins || 0) + (reward || 0);
      this.save();
      return true;
    }
    return false;
  },

  _checkWeeklyReset: function () {
    var now = new Date();
    var monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    var mondayStr = monday.toISOString().slice(0, 10);
    if (this.data.weeklyResetDate !== mondayStr) {
      this.data.weeklyScores = [];
      this.data.weeklyResetDate = mondayStr;
      this.save();
    }
  },
};

/**
 * Точка входа: экраны, клики, запуск игры.
 * Интеграция: rotate, hold, undo (с рекламой), combo, particles, juice,
 * hover-превью, fever mode, star cells, очередь фигур, ачивки-карточки,
 * персонажи, бесконечный режим, выбор темы, lucky spin, инструкции,
 * grid fill, time attack, power-ups, leaderboard podium.
 */
(function () {
  var _currentScreenId = 'screen-menu';
  var _feverTimer = null;
  var _feverStartTime = 0;
  var _feverAnimFrame = null;
  var _timeAttackInterval = null;
  var _timeAttackRemaining = 0;
  var _powerupSelectMode = null; // null | 'clearRow' | 'clearCol'

  // ==================== Screen Management ====================
  function showScreen(id) {
    var allScreens = document.querySelectorAll('.screen');
    for (var i = 0; i < allScreens.length; i++) {
      allScreens[i].classList.remove('active');
    }

    var newEl = document.getElementById(id);
    if (newEl) {
      newEl.classList.add('active');
      if (typeof gsap !== 'undefined' && id !== _currentScreenId) {
        gsap.fromTo(newEl,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    }

    _currentScreenId = id;
    if (id === 'screen-menu') updateMenuProgress();
    if (id === 'screen-achievements') renderAchievementsList();
    if (id === 'screen-shop') renderShopList();
    if (id === 'screen-themes') renderThemesList();
    if (id === 'screen-challenges') renderChallengesList();
    if (id === 'screen-leaderboard') renderLeaderboard();
    if (id === 'screen-game' && typeof Render !== 'undefined') Render.loadBlockSkin();
  }

  function updateMenuProgress() {
    Progress.load();
    var d = Progress.data;
    var elCoins = document.getElementById('stat-coins');
    var elLevels = document.getElementById('stat-levels');
    var elMax = document.getElementById('stat-max-level');
    var elLines = document.getElementById('stat-lines');
    var elEndless = document.getElementById('stat-endless');
    var elTA = document.getElementById('stat-timeattack');
    if (elCoins) elCoins.textContent = d.coins != null ? d.coins : 0;
    if (elLevels) elLevels.textContent = d.totalLevelsPassed;
    if (elMax) elMax.textContent = d.maxLevelReached;
    if (elLines) elLines.textContent = d.totalLinesCleared;
    if (elEndless) elEndless.textContent = d.bestEndlessScore || 0;
    if (elTA) elTA.textContent = d.bestTimeAttackScore || 0;
  }

  // ==================== Shop ====================
  function renderShopList() {
    var list = document.getElementById('shop-list');
    var coinsEl = document.getElementById('shop-coins');
    if (!list || typeof PIECE_SKINS === 'undefined') return;
    Progress.load();
    var coins = Progress.data.coins != null ? Progress.data.coins : 0;
    if (coinsEl) coinsEl.textContent = coins;
    var purchased = Progress.data.purchasedPieceSkins || ['default'];
    var equipped = Progress.data.equippedPieceSkin || 'default';
    list.innerHTML = PIECE_SKINS.map(function (s) {
      var owned = purchased.indexOf(s.id) !== -1;
      var isEquipped = equipped === s.id;
      var btn = '';
      if (s.price === 0) btn = '<span class="shop-default">' + I18N.t('shop_default') + '</span>';
      else if (!owned) btn = '<button class="btn btn-shop-buy" data-skin-id="' + s.id + '" data-price="' + s.price + '">' + I18N.t('shop_buy') + ' ' + s.price + '</button>';
      else if (!isEquipped) btn = '<button class="btn btn-shop-equip" data-skin-id="' + s.id + '">' + I18N.t('shop_equip') + '</button>';
      else btn = '<span class="shop-equipped">' + I18N.t('shop_equipped') + '</span>';
      return (
        '<div class="shop-item' + (isEquipped ? ' shop-item-equipped' : '') + '">' +
        '<div class="shop-item-preview" data-skin-file="assets/blocks/' + s.file + '"></div>' +
        '<span class="shop-item-name">' + I18N.t(s.nameKey) + '</span>' +
        '<div class="shop-item-action">' + btn + '</div>' +
        '</div>'
      );
    }).join('');
    list.querySelectorAll('.btn-shop-buy').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = this.getAttribute('data-skin-id');
        var price = parseInt(this.getAttribute('data-price'), 10);
        if (Progress.data.coins >= price) {
          Progress.spendCoins(price);
          Progress.purchaseSkin(id);
          renderShopList();
        }
      });
    });
    list.querySelectorAll('.btn-shop-equip').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = this.getAttribute('data-skin-id');
        Progress.equipPieceSkin(id);
        if (typeof Render !== 'undefined') Render.loadBlockSkin();
        renderShopList();
      });
    });
    list.querySelectorAll('.shop-item-preview').forEach(function (el) {
      var url = el.getAttribute('data-skin-file');
      if (url) {
        el.style.backgroundImage = 'url(' + url + ')';
        el.style.backgroundSize = 'cover';
      }
    });
  }

  // ==================== Achievements ====================
  function renderAchievementsList() {
    var grid = document.getElementById('achievements-grid');
    if (!grid) return;
    Progress.load();
    var unlocked = Achievements.getUnlockedIds();
    grid.innerHTML = Achievements.getList().map(function (a) {
      var isUnlocked = unlocked.indexOf(a.id) !== -1;
      var progress = 0;
      if (a.getProgress) {
        progress = a.getProgress(Progress.data);
      } else {
        progress = isUnlocked ? 100 : 0;
      }
      progress = Math.min(Math.round(progress), 100);
      return '<div class="achievement-card' + (isUnlocked ? ' achievement-unlocked' : '') + '">' +
        '<div class="achievement-icon">' + (a.icon || '?') + '</div>' +
        '<div class="achievement-name">' + (a.nameKey ? I18N.t(a.nameKey) : (a.name || '')) + '</div>' +
        '<div class="achievement-desc">' + (a.descKey ? I18N.t(a.descKey) : (a.description || '')) + '</div>' +
        '<div class="achievement-progress"><div class="achievement-progress-fill" style="width:' + progress + '%"></div></div>' +
        '<div class="achievement-reward">' + (a.rewardKey ? I18N.t(a.rewardKey) : (a.reward || '')) + '</div>' +
        '</div>';
    }).join('');
  }

  // ==================== Daily Challenges ====================
  function renderChallengesList() {
    var list = document.getElementById('challenges-list');
    if (!list) return;
    Progress.load();
    var challenges = Progress.getDailyChallenges();
    if (!challenges || challenges.length === 0) {
      list.innerHTML = '<p class="challenges-empty">' + I18N.t('challenges_empty') + '</p>';
      return;
    }
    list.innerHTML = challenges.map(function (ch) {
      var pct = Math.min(100, Math.round((ch.progress / ch.target) * 100));
      var cls = 'challenge-card' + (ch.completed ? ' challenge-completed' : '');
      return '<div class="' + cls + '">' +
        '<div class="challenge-text">' + (ch.textKey ? I18N.t(ch.textKey) : (ch.text || '')) + '</div>' +
        '<div class="challenge-progress"><div class="challenge-progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="challenge-meta"><span>' + ch.progress + '/' + ch.target + '</span><span class="challenge-reward">+' + ch.reward + ' ' + I18N.t('challenge_reward_suffix') + '</span></div>' +
        '</div>';
    }).join('');
  }

  function updateChallenges() {
    if (typeof Progress === 'undefined') return;
    var completed = [];
    completed = completed.concat(Progress.updateChallengeProgress('lines', Game.linesClearedThisGame));
    completed = completed.concat(Progress.updateChallengeProgress('score', Game.score));
    completed = completed.concat(Progress.updateChallengeProgress('combo', Game.comboCounter));
    completed = completed.concat(Progress.updateChallengeProgress('bombs', Game.bombsUsedThisGame));
    completed = completed.concat(Progress.updateChallengeProgress('stars', Game._sessionStars));
    for (var i = 0; i < completed.length; i++) {
      var ch = completed[i];
      if (typeof Juice !== 'undefined') {
        var wrap = document.getElementById('game-canvas-wrap');
        if (wrap) Juice.floatText(I18N.t('challenge_task', { n: ch.reward }), wrap.offsetWidth / 2 - 40, 20, wrap, '#4ade80');
      }
    }
  }

  // ==================== Leaderboard (Podium) ====================
  function renderLeaderboard() {
    var list = document.getElementById('leaderboard-list');
    if (!list) return;
    Progress.load();
    var scores = Progress.getWeeklyScores();
    if (!scores || scores.length === 0) {
      list.innerHTML = '<p class="leaderboard-empty">' + I18N.t('leaderboard_empty') + '</p>';
      return;
    }

    function modeText(mode) {
      if (mode === 'gravity') return I18N.t('lb_gravity');
      if (mode === 'endless') return I18N.t('lb_endless');
      if (mode === 'timeattack') return I18N.t('lb_timer');
      return I18N.t('lb_levels');
    }

    var medals = ['🥇', '🥈', '🥉'];
    var podiumClasses = ['lb-first', 'lb-second', 'lb-third'];

    // Podium for top 3
    var podiumHtml = '<div class="lb-podium">';
    // Order: 2nd, 1st, 3rd
    var podiumOrder = [1, 0, 2];
    for (var pi = 0; pi < podiumOrder.length; pi++) {
      var idx = podiumOrder[pi];
      if (idx < scores.length) {
        var s = scores[idx];
        podiumHtml += '<div class="lb-podium-item ' + podiumClasses[idx] + '">' +
          '<div class="lb-medal">' + medals[idx] + '</div>' +
          '<div class="lb-score">' + s.score + '</div>' +
          '<div class="lb-mode">' + modeText(s.mode) + '</div>' +
          '<div class="lb-date">' + (s.date || '') + '</div>' +
          '</div>';
      }
    }
    podiumHtml += '</div>';

    // Rest (4-10)
    var restHtml = '';
    if (scores.length > 3) {
      restHtml = '<div class="lb-rest">';
      for (var i = 3; i < scores.length; i++) {
        var s = scores[i];
        restHtml += '<div class="lb-entry">' +
          '<span class="lb-rank">' + (i + 1) + '</span>' +
          '<span class="lb-entry-score">' + s.score + '</span>' +
          '<span class="lb-entry-mode">' + modeText(s.mode) + '</span>' +
          '<span class="lb-entry-date">' + (s.date || '') + '</span>' +
          '</div>';
      }
      restHtml += '</div>';
    }

    list.innerHTML = podiumHtml + restHtml;
  }

  // ==================== Theme CSS ====================
  function applyThemeCSS(themeId) {
    var theme = (typeof THEMES !== 'undefined' && THEMES[themeId]) ? THEMES[themeId] : null;
    if (!theme) return;
    var root = document.documentElement;
    root.style.setProperty('--accent', theme.accent || theme.cell);
    root.style.setProperty('--glow', theme.glow);
  }

  // ==================== Theme Selector ====================
  function renderThemesList() {
    var grid = document.getElementById('themes-grid');
    if (!grid || typeof THEMES === 'undefined') return;
    Progress.load();
    var unlocked = Progress.data.unlockedThemes || ['default'];
    var selected = Progress.data.selectedTheme || 'default';
    var html = '';
    var themeIds = Object.keys(THEMES);
    for (var i = 0; i < themeIds.length; i++) {
      var id = themeIds[i];
      var theme = THEMES[id];
      var isUnlocked = unlocked.indexOf(id) !== -1;
      var isSelected = selected === id;
      var cls = 'theme-card';
      if (isUnlocked) cls += ' theme-unlocked';
      else cls += ' theme-locked';
      if (isSelected) cls += ' theme-selected';
      var status = isSelected ? I18N.t('theme_selected') : (isUnlocked ? I18N.t('theme_available') : I18N.t('theme_locked'));
      html += '<div class="' + cls + '" data-theme-id="' + id + '">' +
        '<div class="theme-swatch" style="background:' + theme.cell + ';box-shadow:0 0 16px ' + theme.glow + '"></div>' +
        '<span class="theme-card-name">' + (theme.nameKey ? I18N.t(theme.nameKey) : id) + '</span>' +
        '<span class="theme-card-status">' + status + '</span>' +
        '</div>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.theme-card.theme-unlocked').forEach(function (card) {
      card.addEventListener('click', function () {
        var tid = this.getAttribute('data-theme-id');
        Progress.selectTheme(tid);
        applyThemeCSS(tid);
        if (typeof Render !== 'undefined') {
          Render._invalidateCellBuffer();
          Render.drawAll();
        }
        renderThemesList();
      });
    });
  }

  // ==================== Lucky Spin ====================
  var SPIN_PRIZES = [
    { icon: '↩', textKey: 'spin_undo_1', apply: function () { Game.undosRemaining += 1; } },
    { icon: '↩↩', textKey: 'spin_undo_2', apply: function () { Game.undosRemaining += 2; } },
    { icon: '💣', textKey: 'spin_bomb', apply: function () {
      var bomb = BOMB_SHAPE.map(function (r) { return [].concat(r); });
      bomb.isBomb = true;
      Game.currentShape = bomb;
    }},
    { icon: '⭐', textKey: 'spin_stars', apply: function () {
      for (var n = 0; n < 3; n++) {
        var r = Math.floor(Math.random() * CONFIG.GRID_SIZE);
        var c = Math.floor(Math.random() * CONFIG.GRID_SIZE);
        Game.starCells.push({ row: r, col: c });
      }
    }},
    { icon: '💰', textKey: 'spin_coins', apply: function () {
      Progress.data.coins = (Progress.data.coins || 0) + 100;
      Progress.save();
    }},
    { icon: '🔥', textKey: 'spin_fever', apply: function () {
      Game.feverActive = true;
      startFever();
    }},
  ];

  function doLuckySpin() {
    var cost = CONFIG.LUCKY_SPIN_COST || 200;
    if (!Progress.data || (Progress.data.coins || 0) < cost) return;
    Progress.spendCoins(cost);
    updateGameCoins();

    var prize = SPIN_PRIZES[Math.floor(Math.random() * SPIN_PRIZES.length)];
    prize.apply();

    // Show result
    var resultEl = document.getElementById('spin-result');
    var iconEl = document.getElementById('spin-result-icon');
    var textEl = document.getElementById('spin-result-text');
    if (resultEl && iconEl && textEl) {
      iconEl.textContent = prize.icon;
      textEl.textContent = I18N.t(prize.textKey);
      resultEl.classList.remove('hidden');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(resultEl.querySelector('.spin-result-card'),
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
      }
      setTimeout(function () {
        resultEl.classList.add('hidden');
      }, 2500);
      resultEl.onclick = function () { resultEl.classList.add('hidden'); };
    }

    Render.drawAll();
    Render.updateUI();
  }

  // ==================== Game Start ====================
  function startGame(endless, gravity) {
    Game.init(!!endless, !!gravity);
    Progress.incrementGamesPlayed();
    Render.drawAll();
    Render.updateUI();
    updateGameCoins();
    updatePuzzleMoves(); // hides puzzle moves counter
    stopFever();
    stopTimeAttack();
    _powerupSelectMode = null;
    hidePowerupShop();
    showScreen('screen-game');
    if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStart();
    if (typeof Dialogue !== 'undefined') Dialogue.showMessage('onStart');
  }

  function startTimeAttack(duration) {
    Game.init(true, false);
    Game.isTimeAttack = true;
    Game.timeAttackDuration = duration;
    Progress.incrementGamesPlayed();
    Render.drawAll();
    Render.updateUI();
    updateGameCoins();
    stopFever();
    _powerupSelectMode = null;
    hidePowerupShop();
    showScreen('screen-game');

    // Show timer
    var taWrap = document.getElementById('time-attack-wrap');
    var taTimer = document.getElementById('time-attack-timer');
    if (taWrap) taWrap.style.display = '';
    _timeAttackRemaining = duration;
    if (taTimer) {
      taTimer.textContent = duration;
      taTimer.classList.remove('time-danger');
    }

    // Start countdown
    if (_timeAttackInterval) clearInterval(_timeAttackInterval);
    _timeAttackInterval = setInterval(function () {
      _timeAttackRemaining--;
      if (taTimer) {
        taTimer.textContent = _timeAttackRemaining;
        if (_timeAttackRemaining <= 10) {
          taTimer.classList.add('time-danger');
          if (typeof Juice !== 'undefined') Juice.pulseElement(taTimer);
        }
      }
      if (_timeAttackRemaining <= 0) {
        stopTimeAttack();
        Game.isGameOver = true;
        checkGameOver();
      }
    }, 1000);

    if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStart();
    if (typeof Dialogue !== 'undefined') Dialogue.showMessage('onStart');
  }

  function stopTimeAttack() {
    if (_timeAttackInterval) {
      clearInterval(_timeAttackInterval);
      _timeAttackInterval = null;
    }
    var taWrap = document.getElementById('time-attack-wrap');
    if (taWrap) taWrap.style.display = 'none';
  }

  function updateGameCoins() {
    var el = document.getElementById('game-coins');
    if (el && Progress.data) el.textContent = Progress.data.coins != null ? Progress.data.coins : 0;
  }

  function updatePuzzleMoves() {
    var el = document.getElementById('puzzle-moves');
    var num = document.getElementById('puzzle-moves-num');
    if (!el || !num) return;
    if (Game.isPuzzle) {
      el.style.display = '';
      num.textContent = Game.movesRemaining;
    } else {
      el.style.display = 'none';
    }
  }

  // ==================== Level / Game Over ====================
  function checkLevelComplete() {
    if (Game.isLevelComplete()) {
      document.getElementById('win-score').textContent = Game.score;
      Progress.addWeeklyScore(Game.score, 'classic');
      var newlyUnlocked = Progress.addSession(1, Game.score, Game.linesClearedThisGame, Game.level, Game.bombsUsedThisGame);
      Progress.updateChallengeProgress('levels', Progress.data.totalLevelsPassed);
      Progress.updateChallengeProgress('games', Progress.data.totalGamesPlayed || 0);
      if (Game.comboCounter > (Progress.data.bestCombo || 0)) {
        Progress.data.bestCombo = Game.comboCounter;
        Progress.save();
      }
      var unlocksEl = document.getElementById('win-unlocks');
      if (unlocksEl && newlyUnlocked.length > 0) {
        unlocksEl.style.display = 'block';
        unlocksEl.innerHTML = '<p>' + I18N.t('unlocked') + '</p><ul>' +
          newlyUnlocked.map(function (a) { return '<li>' + (a.rewardKey ? I18N.t(a.rewardKey) : (a.reward || '')) + '</li>'; }).join('') + '</ul>';
      } else if (unlocksEl) {
        unlocksEl.style.display = 'none';
        unlocksEl.innerHTML = '';
      }
      stopFever();
      stopTimeAttack();
      if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStop();
      showScreen('screen-level-win');
      if (typeof YandexSDK !== 'undefined') YandexSDK.showInterstitial();
      if (typeof Dialogue !== 'undefined') {
        var level = Game.level;
        if (newlyUnlocked.length > 0) Dialogue.showMessage('onAchievement', { reward: newlyUnlocked[0].reward });
        else if (level === 3 || level === 5 || level === 10) Dialogue.showMessage('onLevelMilestone', { level: level });
        else Dialogue.showMessage('onLevelWin');
      }
      return true;
    }
    return false;
  }

  function checkGameOver() {
    if (Game.isGameOver) {
      if (Game.isEndless) {
        Progress.updateBestEndless(Game.score);
      }
      if (Game.isGravity) {
        Progress.updateBestGravity(Game.score);
      }
      if (Game.isTimeAttack) {
        Progress.updateBestTimeAttack(Game.score);
      }
      var mode = Game.isTimeAttack ? 'timeattack' : (Game.isGravity ? 'gravity' : (Game.isEndless ? 'endless' : 'classic'));
      Progress.addWeeklyScore(Game.score, mode);
      Progress.addSession(0, Game.score, Game.linesClearedThisGame, Game.level, Game.bombsUsedThisGame);
      Progress.updateChallengeProgress('games', Progress.data.totalGamesPlayed || 0);
      Progress.updateChallengeProgress('levels', Progress.data.totalLevelsPassed);
      if (Game.comboCounter > (Progress.data.bestCombo || 0)) {
        Progress.data.bestCombo = Game.comboCounter;
        Progress.save();
      }
      document.getElementById('gameover-score').textContent = Game.score;
      stopFever();
      stopTimeAttack();
      if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStop();
      showScreen('screen-gameover');
      if (typeof Dialogue !== 'undefined') Dialogue.showMessage('onGameOver');
      return true;
    }
    return false;
  }

  // ==================== Fever Mode ====================
  function startFever() {
    var feverBar = document.getElementById('fever-bar');
    var feverFill = document.getElementById('fever-bar-fill');
    var wrap = document.getElementById('game-canvas-wrap');
    if (feverBar) feverBar.style.display = '';
    if (wrap) wrap.classList.add('fever-active');
    _feverStartTime = Date.now();

    if (_feverTimer) clearTimeout(_feverTimer);
    _feverTimer = setTimeout(function () {
      Game.endFever();
      stopFever();
    }, CONFIG.FEVER_DURATION);

    function animateFeverBar() {
      var elapsed = Date.now() - _feverStartTime;
      var remaining = Math.max(0, 1 - elapsed / CONFIG.FEVER_DURATION);
      if (feverFill) feverFill.style.width = (remaining * 100) + '%';
      if (remaining > 0 && Game.feverActive) {
        _feverAnimFrame = requestAnimationFrame(animateFeverBar);
      }
    }
    if (_feverAnimFrame) cancelAnimationFrame(_feverAnimFrame);
    animateFeverBar();

    if (typeof Dialogue !== 'undefined') Dialogue.showMessage('onFever');
  }

  function stopFever() {
    var feverBar = document.getElementById('fever-bar');
    var wrap = document.getElementById('game-canvas-wrap');
    if (feverBar) feverBar.style.display = 'none';
    if (wrap) wrap.classList.remove('fever-active');
    if (_feverTimer) { clearTimeout(_feverTimer); _feverTimer = null; }
    if (_feverAnimFrame) { cancelAnimationFrame(_feverAnimFrame); _feverAnimFrame = null; }
  }

  // ==================== Place Result ====================
  function handlePlaceResult(result) {
    if (!result.placed) return;

    // Bomb explosion animation
    if (result.isBomb && result.clearedCells && result.clearedCells.length > 0) {
      if (typeof Particles !== 'undefined') {
        // Calculate center of explosion
        var sumX = 0, sumY = 0;
        for (var bi = 0; bi < result.clearedCells.length; bi++) {
          sumX += result.clearedCells[bi].col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
          sumY += result.clearedCells[bi].row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
        }
        var bombCx = sumX / result.clearedCells.length;
        var bombCy = sumY / result.clearedCells.length;
        Particles.emitExplosion(bombCx, bombCy);
      }
      if (typeof Juice !== 'undefined') {
        var wrap = document.getElementById('game-canvas-wrap');
        if (wrap) Juice.bombFlash(wrap);
      }
    }

    if (result.clearedCells && result.clearedCells.length > 0 && typeof Particles !== 'undefined') {
      Particles.emitForCells(result.clearedCells);
    }

    if (result.starsCollected && result.starsCollected.length > 0) {
      var wrap = document.getElementById('game-canvas-wrap');
      for (var si = 0; si < result.starsCollected.length; si++) {
        var star = result.starsCollected[si];
        if (typeof Particles !== 'undefined') {
          var cx = star.col * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
          var cy = star.row * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2;
          Particles.emit(cx, cy, '#fbbf24', 10);
        }
        if (wrap && typeof Juice !== 'undefined') {
          Juice.floatText('+' + CONFIG.STAR_BONUS_COINS, star.col * CONFIG.CELL_SIZE, star.row * CONFIG.CELL_SIZE, wrap, '#fbbf24');
        }
      }
      if (typeof Dialogue !== 'undefined') {
        Dialogue.showMessage('onStar', { coins: result.starsCollected.length * CONFIG.STAR_BONUS_COINS });
      }
    }

    if (result.feverTriggered) startFever();

    if (result.linesCleared >= 2) {
      var wrap = document.getElementById('game-canvas-wrap');
      if (wrap && typeof Juice !== 'undefined') {
        Juice.shake(wrap, result.linesCleared >= 3 ? 6 : 4);
      }
      if (typeof Dialogue !== 'undefined') Dialogue.showMessage('onCombo');
    }

    if (result.points > 0) {
      var wrap = document.getElementById('game-canvas-wrap');
      if (wrap && typeof Juice !== 'undefined') {
        var color = result.linesCleared >= 2 ? '#67e8f9' : '#ff6b9d';
        if (Game.feverActive) color = '#fb923c';
        Juice.floatText('+' + result.points, wrap.offsetWidth / 2 - 20, wrap.offsetHeight / 2, wrap, color);
      }
    }

    if (Game.comboCounter > 1) {
      var comboEl = document.getElementById('combo-counter');
      if (comboEl && typeof Juice !== 'undefined') Juice.pulseElement(comboEl);
    }

    // Cascade text
    if (result.cascadeCount && result.cascadeCount > 0) {
      var wrap = document.getElementById('game-canvas-wrap');
      if (wrap && typeof Juice !== 'undefined') {
        Juice.floatText('x' + (result.cascadeCount + 1) + ' ' + I18N.t('cascade'), wrap.offsetWidth / 2 - 40, wrap.offsetHeight / 3, wrap, '#fbbf24');
        Juice.shake(wrap, 5, 0.4);
      }
    }

    // Gravity animation
    if (result.gravityMoves && result.gravityMoves.length > 0 && typeof Render !== 'undefined' && Render.animateGravity) {
      Render.animateGravity(result.gravityMoves);
    } else {
      Render.drawAll();
    }

    Render.updateUI();
    updateGameCoins();
    updatePuzzleMoves();
    updateChallenges();

    // Puzzle completion check (must be before checkGameOver — clearing last cells
    // may leave no valid placement, but the puzzle is already solved)
    if (Game.isPuzzle && Game.isPuzzleComplete()) {
      Game.isGameOver = false; // override game over if puzzle is solved
      var pz = Game.puzzleData;
      var alreadyDone = Progress.isPuzzleCompleted(pz.id);
      if (!alreadyDone) {
        Progress.completePuzzle(pz.id, pz.reward);
      }
      document.getElementById('win-score').textContent = Game.score;
      var unlocksEl = document.getElementById('win-unlocks');
      if (unlocksEl) {
        if (!alreadyDone) {
          unlocksEl.style.display = 'block';
          unlocksEl.innerHTML = '<p>' + I18N.t('puzzle_solved_reward', { n: pz.reward }) + '</p>';
        } else {
          unlocksEl.style.display = 'block';
          unlocksEl.innerHTML = '<p>' + I18N.t('puzzle_solved') + '</p>';
        }
      }
      updateMenuProgress();
      if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStop();
      showScreen('screen-level-win');
      return;
    }

    // Puzzle game over: show special message
    if (Game.isPuzzle && Game.isGameOver) {
      if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStop();
      var msg = Game.movesRemaining <= 0 ? I18N.t('puzzle_no_moves') : I18N.t('puzzle_no_space');
      document.getElementById('gameover-score').textContent = msg;
      showScreen('screen-gameover');
      return;
    }

    if (!checkGameOver()) checkLevelComplete();
  }

  // ==================== Power-up Shop ====================
  function hidePowerupShop() {
    var shop = document.getElementById('powerup-shop');
    if (shop) shop.classList.add('hidden');
  }

  function togglePowerupShop() {
    var shop = document.getElementById('powerup-shop');
    if (!shop) return;
    shop.classList.toggle('hidden');
  }

  function applyPowerup(type) {
    if (Game.isGameOver) return;
    var prices = (typeof CONFIG !== 'undefined' && CONFIG.POWERUP_PRICES) ? CONFIG.POWERUP_PRICES : {};
    var price = prices[type] || 100;
    if (!Progress.data || (Progress.data.coins || 0) < price) {
      var wrap = document.getElementById('game-canvas-wrap');
      if (wrap && typeof Juice !== 'undefined') {
        Juice.floatText(I18N.t('not_enough_coins'), wrap.offsetWidth / 2 - 40, wrap.offsetHeight / 2, wrap, '#f87171');
      }
      return;
    }

    if (type === 'clearRow' || type === 'clearCol') {
      _powerupSelectMode = type;
      hidePowerupShop();
      return;
    }

    Progress.spendCoins(price);
    updateGameCoins();
    hidePowerupShop();

    if (type === 'bomb') {
      var bomb = BOMB_SHAPE.map(function (r) { return [].concat(r); });
      bomb.isBomb = true;
      Game.currentShape = bomb;
      Render.drawAll();
      Render.drawCurrentShape();
      Render.updateUI();
    } else if (type === 'shuffle') {
      Game.shuffleCurrentPiece();
      Render.drawAll();
      Render.updateUI();
      checkGameOver();
    }
  }

  function handlePowerupGridClick(row, col) {
    if (!_powerupSelectMode) return false;

    var prices = (typeof CONFIG !== 'undefined' && CONFIG.POWERUP_PRICES) ? CONFIG.POWERUP_PRICES : {};
    var price = prices[_powerupSelectMode] || 150;
    if (!Progress.data || (Progress.data.coins || 0) < price) {
      _powerupSelectMode = null;
      Render.clearPlacePreview();
      return false;
    }

    Progress.spendCoins(price);
    updateGameCoins();

    var cleared = [];
    if (_powerupSelectMode === 'clearRow') {
      cleared = Game.clearRow(row);
    } else if (_powerupSelectMode === 'clearCol') {
      cleared = Game.clearCol(col);
    }

    if (cleared.length > 0 && typeof Particles !== 'undefined') {
      Particles.emitForCells(cleared);
    }

    var wrap = document.getElementById('game-canvas-wrap');
    if (wrap && typeof Juice !== 'undefined') {
      Juice.shake(wrap, 3, 0.25);
    }

    _powerupSelectMode = null;
    Render.clearPlacePreview();
    Render.drawAll();
    Render.updateUI();
    return true;
  }

  // ==================== Hover Preview ====================
  function getHoverCell(evt) {
    var canvas = Render.canvas;
    if (!canvas || !Game.currentShape || Game.isGameOver) return null;
    var rect = canvas.getBoundingClientRect();
    var t = evt.touches ? evt.touches[0] : evt;
    var clientX = t.clientX;
    var clientY = t.clientY;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var col = Math.floor(((clientX - rect.left) * scaleX) / CONFIG.CELL_SIZE);
    var row = Math.floor(((clientY - rect.top) * scaleY) / CONFIG.CELL_SIZE);
    // Clamp to grid bounds so edge pixels still register
    var maxIdx = CONFIG.GRID_SIZE - 1;
    if (col < 0) col = 0;
    if (col > maxIdx) col = maxIdx;
    if (row < 0) row = 0;
    if (row > maxIdx) row = maxIdx;
    return Game.getPlacementOrigin(row, col, Game.currentShape);
  }

  function getGridCellFromEvent(evt) {
    var canvas = Render.canvas;
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    var t = evt.touches ? evt.touches[0] : evt;
    var clientX = t.clientX;
    var clientY = t.clientY;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var col = Math.floor(((clientX - rect.left) * scaleX) / CONFIG.CELL_SIZE);
    var row = Math.floor(((clientY - rect.top) * scaleY) / CONFIG.CELL_SIZE);
    var maxIdx = CONFIG.GRID_SIZE - 1;
    if (col < 0) col = 0;
    if (col > maxIdx) col = maxIdx;
    if (row < 0) row = 0;
    if (row > maxIdx) row = maxIdx;
    return { row: row, col: col };
  }

  function onCanvasMouseMove(evt) {
    // Power-up selection mode: highlight row/col
    if (_powerupSelectMode) {
      var gridCell = getGridCellFromEvent(evt);
      if (!gridCell) { Render.clearPlacePreview(); return; }
      if (_powerupSelectMode === 'clearRow') {
        Render.drawRowHighlight(gridCell.row);
      } else if (_powerupSelectMode === 'clearCol') {
        Render.drawColHighlight(gridCell.col);
      }
      return;
    }

    var cell = getHoverCell(evt);
    if (!cell) { Render.clearPlacePreview(); return; }
    var canPlace = Game.canPlace(Game.currentShape, cell.row, cell.col);
    Render.drawPlacePreview(cell.row, cell.col, canPlace);
  }

  function onCanvasMouseLeave() {
    Render.clearPlacePreview();
  }

  function onCanvasClick(evt) {
    evt.preventDefault();
    if (Game.isGameOver) return;

    // Power-up selection mode
    if (_powerupSelectMode) {
      var gridCell = getGridCellFromEvent(evt);
      if (gridCell) {
        handlePowerupGridClick(gridCell.row, gridCell.col);
      }
      return;
    }

    if (!Game.currentShape) return;
    var cell = getHoverCell(evt);
    if (!cell) return;
    if (!Game.canPlace(Game.currentShape, cell.row, cell.col)) return;
    var result = Game.placeShape(cell.row, cell.col);
    handlePlaceResult(result);
    onCanvasMouseMove(evt);
  }

  function setupTouch(canvas) {
    canvas.addEventListener('touchend', function (evt) {
      evt.preventDefault();
      onCanvasClick(evt);
    }, { passive: false });
  }

  // ==================== Event Listeners ====================

  // Играть (уровни)
  document.getElementById('btn-play').addEventListener('click', function () { startGame(false); });

  // Бесконечный режим
  var btnEndless = document.getElementById('btn-endless');
  if (btnEndless) btnEndless.addEventListener('click', function () { startGame(true, false); });

  // Гравитация
  var btnGravity = document.getElementById('btn-gravity');
  if (btnGravity) btnGravity.addEventListener('click', function () { startGame(true, true); });

  // Time Attack
  var btnTimeAttack = document.getElementById('btn-time-attack');
  if (btnTimeAttack) btnTimeAttack.addEventListener('click', function () { showScreen('screen-time-attack'); });
  var btnTA60 = document.getElementById('btn-ta-60');
  if (btnTA60) btnTA60.addEventListener('click', function () { startTimeAttack(60); });
  var btnTA120 = document.getElementById('btn-ta-120');
  if (btnTA120) btnTA120.addEventListener('click', function () { startTimeAttack(120); });
  var btnTABack = document.getElementById('btn-ta-back');
  if (btnTABack) btnTABack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Клик по полю
  var canvas = document.getElementById('game-canvas');
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseleave', onCanvasMouseLeave);
  setupTouch(canvas);

  // Меню из игры (двойной клик для подтверждения)
  var _menuConfirm = false;
  var _menuTimer = null;
  var btnGameMenu = document.getElementById('btn-game-menu');
  if (btnGameMenu) {
    btnGameMenu.addEventListener('click', function () {
      if (!_menuConfirm) {
        _menuConfirm = true;
        btnGameMenu.textContent = I18N.t('btn_confirm');
        btnGameMenu.classList.add('btn-confirm');
        _menuTimer = setTimeout(function () {
          _menuConfirm = false;
          btnGameMenu.textContent = I18N.t('btn_exit_menu');
          btnGameMenu.classList.remove('btn-confirm');
        }, 2000);
        return;
      }
      _menuConfirm = false;
      if (_menuTimer) clearTimeout(_menuTimer);
      btnGameMenu.textContent = I18N.t('btn_exit_menu');
      btnGameMenu.classList.remove('btn-confirm');
      stopFever();
      stopTimeAttack();
      if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStop();
      showScreen('screen-menu');
    });
  }

  // Заново (двойной клик для подтверждения)
  var _restartConfirm = false;
  var _restartTimer = null;
  var btnRestart = document.getElementById('btn-restart');
  if (btnRestart) {
    btnRestart.addEventListener('click', function () {
      if (!_restartConfirm) {
        _restartConfirm = true;
        btnRestart.textContent = I18N.t('btn_confirm');
        btnRestart.classList.add('btn-confirm');
        _restartTimer = setTimeout(function () {
          _restartConfirm = false;
          btnRestart.textContent = I18N.t('btn_restart');
          btnRestart.classList.remove('btn-confirm');
        }, 2000);
        return;
      }
      _restartConfirm = false;
      if (_restartTimer) clearTimeout(_restartTimer);
      btnRestart.textContent = I18N.t('btn_restart');
      btnRestart.classList.remove('btn-confirm');
      var wasEndless = Game.isEndless;
      var wasGravity = Game.isGravity;
      var wasTimeAttack = Game.isTimeAttack;
      var wasPuzzle = Game.isPuzzle;
      var puzzleData = Game.puzzleData;
      var taDuration = Game.timeAttackDuration;
      stopFever();
      stopTimeAttack();
      if (wasPuzzle && puzzleData) {
        startPuzzle(puzzleData);
      } else if (wasTimeAttack) {
        startTimeAttack(taDuration);
      } else {
        Game.init(wasEndless, wasGravity);
        Render.drawAll();
        Render.updateUI();
        showScreen('screen-game');
      }
    });
  }

  // Следующий уровень
  document.getElementById('btn-next-level').addEventListener('click', function () {
    if (Game.isPuzzle) {
      // Return to puzzle list after winning a puzzle
      renderPuzzleList();
      showScreen('screen-puzzles');
      return;
    }
    Game.goNextLevel();
    Render.updateUI();
    Render.drawAll();
    stopFever();
    showScreen('screen-game');
    checkGameOver();
  });

  // Повторить после проигрыша
  document.getElementById('btn-retry').addEventListener('click', function () {
    if (Game.isPuzzle && Game.puzzleData) {
      startPuzzle(Game.puzzleData);
    } else if (Game.isTimeAttack) {
      startTimeAttack(Game.timeAttackDuration || 60);
    } else {
      startGame(Game.isEndless, Game.isGravity);
    }
  });

  // В меню
  document.getElementById('btn-to-menu').addEventListener('click', function () {
    stopFever();
    stopTimeAttack();
    showScreen('screen-menu');
  });

  // Магазин
  var btnShop = document.getElementById('btn-shop');
  if (btnShop) btnShop.addEventListener('click', function () { showScreen('screen-shop'); });
  var btnShopBack = document.getElementById('btn-shop-back');
  if (btnShopBack) btnShopBack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Достижения
  var btnAchievements = document.getElementById('btn-achievements');
  if (btnAchievements) btnAchievements.addEventListener('click', function () { showScreen('screen-achievements'); });
  var btnAchievementsBack = document.getElementById('btn-achievements-back');
  if (btnAchievementsBack) btnAchievementsBack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Темы
  var btnThemes = document.getElementById('btn-themes');
  if (btnThemes) btnThemes.addEventListener('click', function () { showScreen('screen-themes'); });
  var btnThemesBack = document.getElementById('btn-themes-back');
  if (btnThemesBack) btnThemesBack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Задания
  var btnChallenges = document.getElementById('btn-challenges');
  if (btnChallenges) btnChallenges.addEventListener('click', function () { showScreen('screen-challenges'); });
  var btnChallengesBack = document.getElementById('btn-challenges-back');
  if (btnChallengesBack) btnChallengesBack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Рейтинг
  var btnLeaderboard = document.getElementById('btn-leaderboard');
  if (btnLeaderboard) btnLeaderboard.addEventListener('click', function () { showScreen('screen-leaderboard'); });
  var btnLeaderboardBack = document.getElementById('btn-leaderboard-back');
  if (btnLeaderboardBack) btnLeaderboardBack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Инструкции
  var btnInstructions = document.getElementById('btn-instructions');
  if (btnInstructions) btnInstructions.addEventListener('click', function () { showScreen('screen-instructions'); });
  var btnInstructionsBack = document.getElementById('btn-instructions-back');
  if (btnInstructionsBack) btnInstructionsBack.addEventListener('click', function () { showScreen('screen-menu'); });

  // Puzzles
  var btnPuzzles = document.getElementById('btn-puzzles');
  if (btnPuzzles) btnPuzzles.addEventListener('click', function () {
    renderPuzzleList();
    showScreen('screen-puzzles');
  });
  var btnPuzzlesBack = document.getElementById('btn-puzzles-back');
  if (btnPuzzlesBack) btnPuzzlesBack.addEventListener('click', function () { showScreen('screen-menu'); });

  function renderPuzzleList() {
    var list = document.getElementById('puzzle-list');
    if (!list || typeof PUZZLES === 'undefined') return;
    Progress.load();
    list.innerHTML = PUZZLES.map(function (p) {
      var done = Progress.isPuzzleCompleted(p.id);
      return '<div class="puzzle-card' + (done ? ' completed' : '') + '" data-puzzle-id="' + p.id + '">' +
        '<div class="puzzle-num">' + (done ? '✓' : '#' + p.id.replace('p', '')) + '</div>' +
        '<div class="puzzle-name">' + (p.nameKey ? I18N.t(p.nameKey) : (p.name || '')) + '</div>' +
        '<div class="puzzle-moves">' + I18N.t('puzzle_moves') + ' ' + p.maxMoves + '</div>' +
        '<div class="puzzle-reward">' + (done ? I18N.t('puzzle_completed') : '+' + p.reward + ' ' + I18N.t('puzzle_reward')) + '</div>' +
        '</div>';
    }).join('');
    list.querySelectorAll('.puzzle-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var pid = this.getAttribute('data-puzzle-id');
        var puzzle = null;
        for (var i = 0; i < PUZZLES.length; i++) {
          if (PUZZLES[i].id === pid) { puzzle = PUZZLES[i]; break; }
        }
        if (puzzle) startPuzzle(puzzle);
      });
    });
  }

  function startPuzzle(puzzle) {
    Game.initPuzzle(puzzle);
    Progress.incrementGamesPlayed();
    stopFever();
    stopTimeAttack();
    _powerupSelectMode = null;
    hidePowerupShop();
    showScreen('screen-game');
    if (typeof YandexSDK !== 'undefined') YandexSDK.gameplayStart();
    Render.drawAll();
    Render.drawCurrentShape();
    Render.drawNextShapes();
    Render.updateUI();
    updateGameCoins();
    updatePuzzleMoves();
    // Hide level/goal, show puzzle info
    var goalEl = document.getElementById('goal-text');
    if (goalEl) goalEl.textContent = I18N.t('puzzle_prefix') + ' ' + (puzzle.nameKey ? I18N.t(puzzle.nameKey) : (puzzle.name || ''));
  }

  // Streak calendar close
  var btnStreakClose = document.getElementById('btn-streak-close');
  if (btnStreakClose) btnStreakClose.addEventListener('click', function () {
    var popup = document.getElementById('streak-popup');
    if (popup) popup.classList.add('hidden');
  });

  function showStreakCalendar(streakInfo) {
    var popup = document.getElementById('streak-popup');
    var cal = document.getElementById('streak-calendar');
    var rewardEl = document.getElementById('streak-reward');
    if (!popup || !cal) return;
    var rewards = (typeof CONFIG !== 'undefined' && CONFIG.STREAK_REWARDS) ? CONFIG.STREAK_REWARDS : [30, 50, 80, 120, 200, 300, 500];
    var html = '';
    for (var i = 0; i < 7; i++) {
      var dayNum = i + 1;
      var isFilled = dayNum < streakInfo.streak;
      var isCurrent = dayNum === streakInfo.streak;
      var cls = isCurrent ? 'streak-day current' : (isFilled ? 'streak-day filled' : 'streak-day');
      html += '<div class="' + cls + '">' +
        '<span class="day-num">' + I18N.t('streak_day') + ' ' + dayNum + '</span>' +
        '<span class="day-coins">' + rewards[i] + '</span>' +
        '</div>';
    }
    cal.innerHTML = html;
    if (rewardEl) rewardEl.textContent = '+' + streakInfo.reward + ' ' + I18N.t('daily_bonus_coins');
    popup.classList.remove('hidden');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(popup.querySelector('.streak-content'),
        { scale: 0.5, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }

  // Rotate
  var btnRotate = document.getElementById('btn-rotate');
  if (btnRotate) {
    btnRotate.addEventListener('click', function () {
      if (!Game.currentShape || Game.isGameOver) return;
      Game.currentShape = rotateShapeCW(Game.currentShape);
      if (!Game.canPlaceAnywhere(Game.currentShape)) {
        Game.isGameOver = true;
        checkGameOver();
      }
      Render.drawAll();
      Render.updateUI();
    });
  }

  // Undo (3 free + 3 after ad)
  var btnUndo = document.getElementById('btn-undo');
  if (btnUndo) {
    btnUndo.addEventListener('click', function () {
      if (Game.undosRemaining > 0 && Game.canUndo) {
        if (Game.undo()) {
          Render.drawAll();
          Render.updateUI();
          updateGameCoins();
        }
      }
    });
  }

  // Undo via ad
  var btnUndoAd = document.getElementById('btn-undo-ad');
  if (btnUndoAd) {
    btnUndoAd.addEventListener('click', function () {
      if (!Game.canUndo) return;
      if (typeof YandexSDK !== 'undefined' && YandexSDK._ready) {
        YandexSDK.showRewarded(function () {
          Game.undosRemaining += CONFIG.AD_UNDOS;
          if (Game.undo()) {
            Render.drawAll();
            Render.updateUI();
            updateGameCoins();
          }
        });
      } else {
        Game.undosRemaining += CONFIG.AD_UNDOS;
        Render.updateUI();
      }
    });
  }

  // Hold
  var holdContainer = document.getElementById('hold-shape-container');
  if (holdContainer) {
    holdContainer.addEventListener('click', function () {
      if (Game.holdShape()) {
        Render.drawAll();
        Render.updateUI();
        checkGameOver();
      }
    });
  }

  // Lucky Spin
  var btnSpin = document.getElementById('btn-lucky-spin');
  if (btnSpin) {
    btnSpin.addEventListener('click', doLuckySpin);
  }
  var spinCostEl = document.getElementById('spin-cost');
  if (spinCostEl) spinCostEl.textContent = CONFIG.LUCKY_SPIN_COST || 200;

  // Power-ups
  var btnPowerups = document.getElementById('btn-powerups');
  if (btnPowerups) {
    btnPowerups.addEventListener('click', function () {
      if (Game.isGameOver) return;
      togglePowerupShop();
    });
  }

  // Power-up buttons
  document.querySelectorAll('.powerup-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var power = this.getAttribute('data-power');
      if (power) applyPowerup(power);
    });
  });

  // Escape: cancel power-up / go to menu
  document.addEventListener('keydown', function (evt) {
    if (evt.key === 'Escape') {
      if (_powerupSelectMode) {
        _powerupSelectMode = null;
        Render.clearPlacePreview();
        return;
      }
      var shop = document.getElementById('powerup-shop');
      if (shop && !shop.classList.contains('hidden')) {
        hidePowerupShop();
        return;
      }
      if (_currentScreenId === 'screen-game') {
        if (btnGameMenu) btnGameMenu.click();
        return;
      }
    }
  });

  // Запрет контекстного меню на всей странице
  document.addEventListener('contextmenu', function (evt) { evt.preventDefault(); });

  // Drag-drop
  function onPlaceSuccess(result) {
    handlePlaceResult(result);
  }

  // ==================== Pause / Resume (п. 1.19.4, 4.7) ====================
  var _pausedTimeAttackRemaining = 0;
  var _pausedFeverRemaining = 0;
  var _isPaused = false;

  function pauseGame() {
    if (_isPaused) return;
    _isPaused = true;
    // Пауза time attack таймера
    if (_timeAttackInterval) {
      clearInterval(_timeAttackInterval);
      _timeAttackInterval = null;
      _pausedTimeAttackRemaining = _timeAttackRemaining;
    }
    // Пауза fever таймера
    if (_feverTimer && Game.feverActive) {
      var elapsed = Date.now() - _feverStartTime;
      _pausedFeverRemaining = Math.max(0, CONFIG.FEVER_DURATION - elapsed);
      clearTimeout(_feverTimer);
      _feverTimer = null;
      if (_feverAnimFrame) { cancelAnimationFrame(_feverAnimFrame); _feverAnimFrame = null; }
    }
  }

  function resumeGame() {
    if (!_isPaused) return;
    _isPaused = false;
    // Возобновление time attack
    if (_pausedTimeAttackRemaining > 0 && Game.isTimeAttack && !Game.isGameOver) {
      _timeAttackRemaining = _pausedTimeAttackRemaining;
      _pausedTimeAttackRemaining = 0;
      var taTimer = document.getElementById('time-attack-timer');
      _timeAttackInterval = setInterval(function () {
        _timeAttackRemaining--;
        if (taTimer) {
          taTimer.textContent = _timeAttackRemaining;
          if (_timeAttackRemaining <= 10) {
            taTimer.classList.add('time-danger');
            if (typeof Juice !== 'undefined') Juice.pulseElement(taTimer);
          }
        }
        if (_timeAttackRemaining <= 0) {
          stopTimeAttack();
          Game.isGameOver = true;
          checkGameOver();
        }
      }, 1000);
    }
    // Возобновление fever
    if (_pausedFeverRemaining > 0 && Game.feverActive) {
      var feverLeft = _pausedFeverRemaining;
      _feverStartTime = Date.now() - (CONFIG.FEVER_DURATION - feverLeft);
      _pausedFeverRemaining = 0;
      _feverTimer = setTimeout(function () {
        Game.endFever();
        stopFever();
      }, feverLeft);
      var feverFill = document.getElementById('fever-bar-fill');
      function animateFeverBar() {
        var elapsed = Date.now() - _feverStartTime;
        var remaining = Math.max(0, 1 - elapsed / CONFIG.FEVER_DURATION);
        if (feverFill) feverFill.style.width = (remaining * 100) + '%';
        if (remaining > 0 && Game.feverActive) {
          _feverAnimFrame = requestAnimationFrame(animateFeverBar);
        }
      }
      if (_feverAnimFrame) cancelAnimationFrame(_feverAnimFrame);
      animateFeverBar();
    }
  }

  // ==================== Init ====================
  function init() {
    Progress.load();
    applyThemeCSS(Progress.data.selectedTheme || 'default');
    Game.init(false);
    // Начальная локализация DOM (до SDK, используется язык по умолчанию)
    if (typeof I18N !== 'undefined') I18N.applyToDOM();

    // Инициализация подсистем
    Render.init();
    Render.drawAll();
    Render.updateUI();
    if (typeof Particles !== 'undefined') Particles.init();
    if (typeof Dialogue !== 'undefined') Dialogue.init();
    if (typeof DragDrop !== 'undefined') DragDrop.init(onPlaceSuccess);

    // Функция завершения загрузки: показать меню и сообщить платформе
    function finishLoading() {
      showScreen('screen-menu');
      if (typeof YandexSDK !== 'undefined') YandexSDK.notifyReady();

      // Login streak check (replaces old daily bonus)
      var streakResult = Progress.checkLoginStreak();
      if (streakResult.isNew && streakResult.reward > 0) {
        showStreakCalendar(streakResult);
      }
    }

    // Инициализация SDK: ждём завершения, затем показываем меню
    if (typeof YandexSDK !== 'undefined') {
      YandexSDK.onPauseResume(pauseGame, resumeGame);
      YandexSDK.init(function () {
        // SDK готов (или недоступен) — переходим к меню
        if (typeof I18N !== 'undefined') I18N.applyToDOM();
        finishLoading();
      });
    } else {
      finishLoading();
    }
  }

  function showDailyBonus(amount) {
    var el = document.getElementById('daily-bonus-popup');
    var amountEl = document.getElementById('daily-bonus-amount');
    if (!el) return;
    if (amountEl) amountEl.textContent = '+' + amount;
    el.classList.remove('hidden');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(el.querySelector('.daily-bonus-card'),
        { scale: 0.5, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
    el.onclick = function () { el.classList.add('hidden'); };
    setTimeout(function () { el.classList.add('hidden'); }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

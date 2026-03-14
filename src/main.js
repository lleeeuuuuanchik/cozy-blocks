/**
 * Точка входа: экраны, клики, запуск игры.
 * Интеграция: rotate, hold, undo (с рекламой), combo, particles, juice,
 * hover-превью, fever mode, star cells, очередь фигур, ачивки-карточки,
 * персонажи, бесконечный режим, выбор темы, lucky spin, инструкции, grid fill.
 */
(function () {
  var _currentScreenId = 'screen-menu';
  var _feverTimer = null;
  var _feverStartTime = 0;
  var _feverAnimFrame = null;

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
    if (elCoins) elCoins.textContent = d.coins != null ? d.coins : 0;
    if (elLevels) elLevels.textContent = d.totalLevelsPassed;
    if (elMax) elMax.textContent = d.maxLevelReached;
    if (elLines) elLines.textContent = d.totalLinesCleared;
    if (elEndless) elEndless.textContent = d.bestEndlessScore || 0;
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
      if (s.price === 0) btn = '<span class="shop-default">По умолчанию</span>';
      else if (!owned) btn = '<button class="btn btn-shop-buy" data-skin-id="' + s.id + '" data-price="' + s.price + '">Купить ' + s.price + '</button>';
      else if (!isEquipped) btn = '<button class="btn btn-shop-equip" data-skin-id="' + s.id + '">Надеть</button>';
      else btn = '<span class="shop-equipped">Надето</span>';
      return (
        '<div class="shop-item' + (isEquipped ? ' shop-item-equipped' : '') + '">' +
        '<div class="shop-item-preview" data-skin-file="' + (ASSETS.blocks + s.file) + '"></div>' +
        '<span class="shop-item-name">' + s.name + '</span>' +
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
        '<div class="achievement-name">' + a.name + '</div>' +
        '<div class="achievement-desc">' + (a.description || '') + '</div>' +
        '<div class="achievement-progress"><div class="achievement-progress-fill" style="width:' + progress + '%"></div></div>' +
        '<div class="achievement-reward">' + a.reward + '</div>' +
        '</div>';
    }).join('');
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
      var status = isSelected ? 'Выбрана' : (isUnlocked ? 'Доступна' : 'Заблокирована');
      html += '<div class="' + cls + '" data-theme-id="' + id + '">' +
        '<div class="theme-swatch" style="background:' + theme.cell + ';box-shadow:0 0 16px ' + theme.glow + '"></div>' +
        '<span class="theme-card-name">' + (theme.name || id) + '</span>' +
        '<span class="theme-card-status">' + status + '</span>' +
        '</div>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.theme-card.theme-unlocked').forEach(function (card) {
      card.addEventListener('click', function () {
        var tid = this.getAttribute('data-theme-id');
        Progress.selectTheme(tid);
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
    { icon: '↩', text: '+1 отмена', apply: function () { Game.undosRemaining += 1; } },
    { icon: '↩↩', text: '+2 отмены', apply: function () { Game.undosRemaining += 2; } },
    { icon: '💣', text: 'Бомба! Следующая фигура — бомба', apply: function () {
      if (Game.currentShape) {
        Game.currentShape.isBomb = true;
      }
    }},
    { icon: '⭐', text: '+3 звезды на поле', apply: function () {
      for (var n = 0; n < 3; n++) {
        var r = Math.floor(Math.random() * CONFIG.GRID_SIZE);
        var c = Math.floor(Math.random() * CONFIG.GRID_SIZE);
        Game.starCells.push({ row: r, col: c });
      }
    }},
    { icon: '💰', text: '+20 монет', apply: function () {
      Progress.data.coins = (Progress.data.coins || 0) + 20;
      Progress.save();
    }},
    { icon: '🔥', text: 'Fever Mode активирован!', apply: function () {
      Game.feverActive = true;
      startFever();
    }},
  ];

  function doLuckySpin() {
    var cost = CONFIG.LUCKY_SPIN_COST || 30;
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
      textEl.textContent = prize.text;
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
  function startGame(endless) {
    Game.init(!!endless);
    Render.drawAll();
    Render.updateUI();
    updateGameCoins();
    stopFever();
    showScreen('screen-game');
    if (typeof Dialogue !== 'undefined') Dialogue.showMessage('onStart');
  }

  function updateGameCoins() {
    var el = document.getElementById('game-coins');
    if (el && Progress.data) el.textContent = Progress.data.coins != null ? Progress.data.coins : 0;
  }

  // ==================== Level / Game Over ====================
  function checkLevelComplete() {
    if (Game.isLevelComplete()) {
      document.getElementById('win-score').textContent = Game.score;
      var newlyUnlocked = Progress.addSession(1, Game.score, Game.linesClearedThisGame, Game.level, Game.bombsUsedThisGame);
      if (Game.comboCounter > (Progress.data.bestCombo || 0)) {
        Progress.data.bestCombo = Game.comboCounter;
        Progress.save();
      }
      var unlocksEl = document.getElementById('win-unlocks');
      if (unlocksEl && newlyUnlocked.length > 0) {
        unlocksEl.style.display = 'block';
        unlocksEl.innerHTML = '<p>Разблокировано:</p><ul>' +
          newlyUnlocked.map(function (a) { return '<li>' + a.reward + '</li>'; }).join('') + '</ul>';
      } else if (unlocksEl) {
        unlocksEl.style.display = 'none';
        unlocksEl.innerHTML = '';
      }
      stopFever();
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
      Progress.addSession(0, Game.score, Game.linesClearedThisGame, Game.level, Game.bombsUsedThisGame);
      if (Game.comboCounter > (Progress.data.bestCombo || 0)) {
        Progress.data.bestCombo = Game.comboCounter;
        Progress.save();
      }
      document.getElementById('gameover-score').textContent = Game.score;
      stopFever();
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

    Render.drawAll();
    Render.updateUI();
    updateGameCoins();
    if (!checkGameOver()) checkLevelComplete();
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
    if (row < 0 || row >= CONFIG.GRID_SIZE || col < 0 || col >= CONFIG.GRID_SIZE) return null;
    return Game.getPlacementOrigin(row, col, Game.currentShape);
  }

  function onCanvasMouseMove(evt) {
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
    if (Game.isGameOver || !Game.currentShape) return;
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
  if (btnEndless) btnEndless.addEventListener('click', function () { startGame(true); });

  // Клик по полю
  var canvas = document.getElementById('game-canvas');
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseleave', onCanvasMouseLeave);
  setupTouch(canvas);

  // Заново
  document.getElementById('btn-restart').addEventListener('click', function () {
    var wasEndless = Game.isEndless;
    Game.init(wasEndless);
    Render.drawAll();
    Render.updateUI();
    stopFever();
    showScreen('screen-game');
  });

  // Следующий уровень
  document.getElementById('btn-next-level').addEventListener('click', function () {
    Game.goNextLevel();
    Render.updateUI();
    Render.drawAll();
    stopFever();
    showScreen('screen-game');
    checkGameOver();
  });

  // Повторить после проигрыша
  document.getElementById('btn-retry').addEventListener('click', function () { startGame(Game.isEndless); });

  // В меню
  document.getElementById('btn-to-menu').addEventListener('click', function () {
    stopFever();
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

  // Инструкции
  var btnInstructions = document.getElementById('btn-instructions');
  if (btnInstructions) btnInstructions.addEventListener('click', function () { showScreen('screen-instructions'); });
  var btnInstructionsBack = document.getElementById('btn-instructions-back');
  if (btnInstructionsBack) btnInstructionsBack.addEventListener('click', function () { showScreen('screen-menu'); });

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
  if (spinCostEl) spinCostEl.textContent = CONFIG.LUCKY_SPIN_COST || 30;

  // Drag-drop
  function onPlaceSuccess(result) {
    handlePlaceResult(result);
  }

  // ==================== Init ====================
  function init() {
    Progress.load();
    Game.init(false);
    if (typeof YandexSDK !== 'undefined') {
      YandexSDK.init(function () {});
    }
    Render.init();
    Render.drawAll();
    Render.updateUI();
    if (typeof Particles !== 'undefined') Particles.init();
    if (typeof Dialogue !== 'undefined') Dialogue.init();
    if (typeof DragDrop !== 'undefined') DragDrop.init(onPlaceSuccess);
    showScreen('screen-menu');
    if (typeof YandexSDK !== 'undefined') YandexSDK.notifyReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Отрисовка: сетка, поле, текущая/следующая/запасная фигура.
 * Neon Cozy тема: тёмный фон, свечение, скруглённые клетки.
 * Оптимизировано: batch draw calls, минимальные save/restore, offscreen буфер.
 */
var Render = {
  canvas: null,
  ctx: null,
  nextCanvas: null,
  nextCtx: null,
  currentShapeCanvas: null,
  currentShapeCtx: null,
  holdCanvas: null,
  holdCtx: null,
  next2Canvas: null,
  next2Ctx: null,
  previewCanvas: null,
  previewCtx: null,
  particleCanvas: null,
  particleCtx: null,
  blockImage: null,
  blockImageCache: {},
  _starAnimFrame: 0,
  _cellBuffer: null,
  _cellBufferCtx: null,
  _bombBuffer: null,
  _bombBufferCtx: null,
  _lastThemeId: null,
  _lastCellSize: 0,

  init: function () {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');
    this.currentShapeCanvas = document.getElementById('current-shape-canvas');
    this.currentShapeCtx = this.currentShapeCanvas ? this.currentShapeCanvas.getContext('2d') : null;
    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas ? this.holdCanvas.getContext('2d') : null;
    this.next2Canvas = document.getElementById('next2-canvas');
    this.next2Ctx = this.next2Canvas ? this.next2Canvas.getContext('2d') : null;
    this.previewCanvas = document.getElementById('place-preview-canvas');
    this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;
    this.particleCanvas = document.getElementById('particle-canvas');
    this.particleCtx = this.particleCanvas ? this.particleCanvas.getContext('2d') : null;
    this.resize();
    window.addEventListener('resize', this._onResize.bind(this));
    this.loadBlockSkin();
    this._startStarAnimation();
  },

  _onResize: function () {
    this.resize();
  },

  getEquippedSkinId: function () {
    if (typeof Progress === 'undefined' || !Progress.data) return 'default';
    return Progress.data.equippedPieceSkin || 'default';
  },

  loadBlockSkin: function () {
    var skinId = this.getEquippedSkinId();
    if (this.blockImageCache[skinId]) {
      this.blockImage = this.blockImageCache[skinId];
      this._invalidateCellBuffer();
      this.drawAll();
      return;
    }
    var skins = typeof PIECE_SKINS !== 'undefined' ? PIECE_SKINS : [{ id: 'default', file: 'pieces.png' }];
    var skin = null;
    for (var i = 0; i < skins.length; i++) {
      if (skins[i].id === skinId) { skin = skins[i]; break; }
    }
    if (!skin) skin = skins[0];
    var path = (typeof ASSETS !== 'undefined' && ASSETS.blocks) ? ASSETS.blocks + skin.file : 'assets/blocks/pieces.png';
    var img = new Image();
    var self = this;
    img.onload = function () {
      self.blockImageCache[skinId] = img;
      self.blockImage = img;
      self._invalidateCellBuffer();
      self.drawAll();
    };
    img.onerror = function () {
      if (skinId !== 'default' && self.blockImageCache['default']) self.blockImage = self.blockImageCache['default'];
      else if (skinId === 'default') self.blockImage = null;
      self._invalidateCellBuffer();
      self.drawAll();
    };
    img.src = path;
  },

  resize: function () {
    var size = CONFIG.GRID_SIZE * CONFIG.CELL_SIZE;
    var maxW = Math.min(size, window.innerWidth - 24);
    this.canvas.style.width = maxW + 'px';
    this.canvas.style.height = maxW + 'px';
    this.canvas.width = size;
    this.canvas.height = size;
    if (this.previewCanvas) {
      this.previewCanvas.style.width = maxW + 'px';
      this.previewCanvas.style.height = maxW + 'px';
      this.previewCanvas.width = size;
      this.previewCanvas.height = size;
    }
    if (this.particleCanvas) {
      this.particleCanvas.style.width = maxW + 'px';
      this.particleCanvas.style.height = maxW + 'px';
      this.particleCanvas.width = size;
      this.particleCanvas.height = size;
    }
    this._invalidateCellBuffer();
    this.drawAll();
  },

  // === Offscreen cell buffer for optimized rendering ===
  _invalidateCellBuffer: function () {
    this._cellBuffer = null;
    this._bombBuffer = null;
    this._lastThemeId = null;
  },

  _ensureCellBuffer: function () {
    var cellInner = CONFIG.CELL_SIZE - 2;
    var themeId = this._getSelectedThemeId();
    if (this._cellBuffer && this._lastThemeId === themeId && this._lastCellSize === cellInner) return;

    this._lastThemeId = themeId;
    this._lastCellSize = cellInner;

    // Create normal cell buffer
    this._cellBuffer = document.createElement('canvas');
    this._cellBuffer.width = cellInner;
    this._cellBuffer.height = cellInner;
    this._cellBufferCtx = this._cellBuffer.getContext('2d');
    this._renderCellToBuffer(this._cellBufferCtx, cellInner, false);

    // Create bomb cell buffer
    this._bombBuffer = document.createElement('canvas');
    this._bombBuffer.width = cellInner;
    this._bombBuffer.height = cellInner;
    this._bombBufferCtx = this._bombBuffer.getContext('2d');
    this._renderCellToBuffer(this._bombBufferCtx, cellInner, true);
  },

  _renderCellToBuffer: function (ctx, cellInner, isBomb) {
    var theme = this.getThemeObj();
    var radius = 4;
    ctx.clearRect(0, 0, cellInner, cellInner);
    ctx.save();
    ctx.shadowColor = isBomb ? '#67e8f9' : theme.glow;
    ctx.shadowBlur = isBomb ? 14 : 8;

    if (this.blockImage && this.blockImage.width && this.blockImage.height) {
      this._drawRoundedRect(ctx, 0, 0, cellInner, cellInner, radius);
      ctx.clip();
      this._drawCellImage(ctx, this.blockImage, 0, 0, cellInner, cellInner);
    } else {
      this._drawRoundedRect(ctx, 0, 0, cellInner, cellInner, radius);
      ctx.fillStyle = isBomb ? '#67e8f9' : theme.cell;
      ctx.fill();
    }
    ctx.restore();
  },

  _drawRoundedRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  // Keep old name for compatibility
  drawRoundedRect: function (ctx, x, y, w, h, r) {
    this._drawRoundedRect(ctx, x, y, w, h, r);
  },

  drawPlacePreview: function (row, col, canPlace) {
    if (!this.previewCtx || !this.previewCanvas || !Game.currentShape) return;
    var shape = Game.currentShape;
    var h = shape.length;
    var w = shape[0].length;
    var cell = CONFIG.CELL_SIZE;
    var pCtx = this.previewCtx;
    pCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    var color = canPlace !== false ? '#4ade80' : '#f87171';
    var alpha = canPlace !== false ? 0.35 : 0.2;
    var strokeAlpha = canPlace !== false ? 0.7 : 0.4;

    pCtx.fillStyle = color;
    pCtx.strokeStyle = color;
    pCtx.lineWidth = 1.5;

    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (shape[r][c] === '1') {
          var cellRow = row + r;
          var cellCol = col + c;
          if (cellRow < 0 || cellRow >= CONFIG.GRID_SIZE || cellCol < 0 || cellCol >= CONFIG.GRID_SIZE) continue;
          var x = cellCol * cell + 2;
          var y = cellRow * cell + 2;
          var d = cell - 4;
          pCtx.globalAlpha = alpha;
          this._drawRoundedRect(pCtx, x, y, d, d, 4);
          pCtx.fill();
          pCtx.globalAlpha = strokeAlpha;
          this._drawRoundedRect(pCtx, x, y, d, d, 4);
          pCtx.stroke();
        }
      }
    }
    pCtx.globalAlpha = 1;
  },

  clearPlacePreview: function () {
    if (!this.previewCtx || !this.previewCanvas) return;
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  },

  drawAll: function () {
    this.drawGrid();
    this.drawCurrentShape();
    this.drawNextShape();
    this.drawNext2Shape();
    this.drawHoldShape();
  },

  _getSelectedThemeId: function () {
    if (typeof Progress === 'undefined' || !Progress.data) return 'default';
    return Progress.data.selectedTheme || 'default';
  },

  getThemeObj: function () {
    var id = this._getSelectedThemeId();
    if (typeof THEMES !== 'undefined' && THEMES[id]) return THEMES[id];
    return THEMES.default;
  },

  getThemeColor: function () {
    return this.getThemeObj().cell;
  },

  _drawCellImage: function (ctx, img, dx, dy, dw, dh) {
    if (!img || !img.width || !img.height) return;
    var srcW = img.width;
    var srcH = img.height;
    var scale = Math.min(dw / srcW, dh / srcH);
    var drawW = srcW * scale;
    var drawH = srcH * scale;
    var offsetX = (dw - drawW) / 2;
    var offsetY = (dh - drawH) / 2;
    ctx.drawImage(img, 0, 0, srcW, srcH, dx + offsetX, dy + offsetY, drawW, drawH);
  },

  drawFilledCell: function (ctx, x, y, cellInner, isBomb) {
    this._ensureCellBuffer();
    var buf = isBomb ? this._bombBuffer : this._cellBuffer;
    if (buf) {
      ctx.drawImage(buf, x, y);
    }
  },

  drawGrid: function () {
    var ctx = this.ctx;
    var size = CONFIG.GRID_SIZE;
    var cell = CONFIG.CELL_SIZE;
    var totalPx = size * cell;

    // Dark background
    ctx.fillStyle = '#1a1825';
    ctx.fillRect(0, 0, totalPx, totalPx);

    // Subtle grid lines — batch into single path
    ctx.beginPath();
    for (var i = 0; i <= size; i++) {
      var pos = i * cell;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, totalPx);
      ctx.moveTo(0, pos);
      ctx.lineTo(totalPx, pos);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Draw star cells
    this._drawStarCells(ctx, cell);

    // Filled cells — use offscreen buffer
    if (!Game.grid) return;
    this._ensureCellBuffer();
    for (var row = 0; row < size; row++) {
      var gridRow = Game.grid[row];
      if (!gridRow) continue;
      for (var col = 0; col < size; col++) {
        if (gridRow[col] !== 0) {
          var isBomb = gridRow[col] === 2;
          var buf = isBomb ? this._bombBuffer : this._cellBuffer;
          if (buf) {
            ctx.drawImage(buf, col * cell + 1, row * cell + 1);
          }
        }
      }
    }
  },

  _drawStarCells: function (ctx, cell) {
    if (!Game.starCells || Game.starCells.length === 0) return;
    var t = this._starAnimFrame;
    var pulse = 0.6 + 0.4 * Math.sin(t * 0.05);

    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < Game.starCells.length; i++) {
      var s = Game.starCells[i];
      var cx = s.col * cell + cell / 2;
      var cy = s.row * cell + cell / 2;
      ctx.globalAlpha = 0.3 + 0.2 * pulse;
      ctx.shadowBlur = 8 + 4 * pulse;
      ctx.font = (12 + 2 * pulse) + 'px Inter, sans-serif';
      ctx.fillText('\u2726', cx, cy);
    }
    ctx.restore();
  },

  _startStarAnimation: function () {
    var self = this;
    function tick() {
      self._starAnimFrame++;
      if (self._starAnimFrame % 3 === 0 && Game.starCells && Game.starCells.length > 0) {
        self.drawGrid();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  },

  _drawShapeInCanvas: function (ctx, canvas, shape) {
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(26, 24, 37, 0.6)';
    ctx.fillRect(0, 0, w, h);
    if (!shape) return;

    var sh = shape.length;
    var sw = shape[0].length;
    var cellMax = w >= 90 ? 22 : 16;
    var cellSize = Math.min(w / (sw + 1), h / (sh + 1), cellMax);
    var offsetX = (w - sw * cellSize) / 2;
    var offsetY = (h - sh * cellSize) / 2;
    var ci = cellSize - 2;
    var isBomb = shape.isBomb;
    var theme = this.getThemeObj();

    // Draw cells directly (no offscreen buffer for small canvases)
    for (var r = 0; r < sh; r++) {
      for (var c = 0; c < sw; c++) {
        if (shape[r][c] === '1') {
          var x = offsetX + c * cellSize + 1;
          var y = offsetY + r * cellSize + 1;
          ctx.save();
          ctx.shadowColor = isBomb ? '#67e8f9' : theme.glow;
          ctx.shadowBlur = isBomb ? 10 : 6;
          if (this.blockImage && this.blockImage.width) {
            this._drawRoundedRect(ctx, x, y, ci, ci, 3);
            ctx.clip();
            this._drawCellImage(ctx, this.blockImage, x, y, ci, ci);
          } else {
            this._drawRoundedRect(ctx, x, y, ci, ci, 3);
            ctx.fillStyle = isBomb ? '#67e8f9' : theme.cell;
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }
  },

  drawCurrentShape: function () {
    if (!this.currentShapeCtx || !this.currentShapeCanvas) return;
    this._drawShapeInCanvas(this.currentShapeCtx, this.currentShapeCanvas, Game.currentShape);
  },

  drawNextShape: function () {
    if (!this.nextCtx || !this.nextCanvas) return;
    this._drawShapeInCanvas(this.nextCtx, this.nextCanvas, Game.nextShape);
  },

  drawNext2Shape: function () {
    if (!this.next2Ctx || !this.next2Canvas) return;
    this._drawShapeInCanvas(this.next2Ctx, this.next2Canvas, Game.nextShape2 || null);
  },

  drawHoldShape: function () {
    if (!this.holdCtx || !this.holdCanvas) return;
    this._drawShapeInCanvas(this.holdCtx, this.holdCanvas, Game.heldShape || null);
  },

  updateUI: function () {
    var levelEl = document.getElementById('level-num');
    var scoreEl = document.getElementById('score');
    var goalEl = document.getElementById('goal-text');
    var coinsEl = document.getElementById('game-coins');
    var comboEl = document.getElementById('combo-counter');
    var comboNum = document.getElementById('combo-num');
    var undoBtn = document.getElementById('btn-undo');
    var undoAdBtn = document.getElementById('btn-undo-ad');
    var undoCount = document.getElementById('undo-count');
    var fillEl = document.getElementById('grid-fill-percent');
    var fillBar = document.getElementById('grid-fill-bar-fill');

    if (levelEl) levelEl.textContent = Game.isEndless ? '∞' : Game.level;
    if (scoreEl) scoreEl.textContent = Game.score;
    if (goalEl) {
      if (Game.isEndless) {
        goalEl.textContent = 'Бесконечный режим — набери максимум очков!';
      } else {
        goalEl.textContent = 'Цель: очисти ' + Game.linesGoal + ' линий (' + Game.linesClearedThisLevel + '/' + Game.linesGoal + ')';
      }
    }
    if (coinsEl && typeof Progress !== 'undefined' && Progress.data) coinsEl.textContent = Progress.data.coins != null ? Progress.data.coins : 0;

    // Combo counter
    if (comboEl && comboNum) {
      if (Game.comboCounter > 1) {
        comboEl.style.display = '';
        comboNum.textContent = Game.comboCounter;
      } else {
        comboEl.style.display = 'none';
      }
    }

    // Undo button + ad button
    if (undoBtn && undoCount) {
      if (Game.canUndo && Game.undosRemaining > 0) {
        undoBtn.style.display = '';
        undoCount.textContent = Game.undosRemaining;
      } else {
        undoBtn.style.display = 'none';
      }
    }
    if (undoAdBtn) {
      undoAdBtn.style.display = (Game.canUndo && Game.undosRemaining <= 0) ? '' : 'none';
    }

    // Grid fill meter
    var fillPct = Game.getGridFillPercent();
    if (fillEl) fillEl.textContent = fillPct + '%';
    if (fillBar) fillBar.style.width = fillPct + '%';
  },
};

/**
 * Ядро игры: сетка, фигуры, размещение, очистка линий, уровни.
 * Комбо-серия, запас (hold), отмена (undo), бомба, fever, звёзды, очередь фигур.
 * Бесконечный режим, измерение заполненности поля.
 */
const Game = {
  grid: null,
  currentShape: null,
  nextShape: null,
  nextShape2: null,
  score: 0,
  level: 1,
  linesClearedThisLevel: 0,
  linesGoal: CONFIG.DEFAULT_LINES_GOAL,
  isGameOver: false,
  linesClearedThisGame: 0,

  // Endless mode
  isEndless: false,

  // Combo streak
  comboCounter: 0,

  // Hold / swap
  heldShape: null,
  hasHeldThisTurn: false,

  // Undo
  _undoState: null,
  canUndo: false,
  undosRemaining: CONFIG.FREE_UNDOS,

  // Fever Mode
  feverActive: false,

  // Star Cells
  starCells: [],

  // Bombs used (for achievements)
  bombsUsedThisGame: 0,

  // Score Multiplier Bar
  multiplierBar: 0,
  multiplierActive: false,

  init: function (endless) {
    this.isEndless = !!endless;
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.level = 1;
    this.linesClearedThisLevel = 0;
    this.linesClearedThisGame = 0;
    this.linesGoal = this.isEndless ? 0 : Math.min(
      CONFIG.DEFAULT_LINES_GOAL + (this.level - 1) * CONFIG.LINES_GOAL_PER_LEVEL,
      CONFIG.MAX_LINES_GOAL
    );
    this.isGameOver = false;
    this.comboCounter = 0;
    this.heldShape = null;
    this.hasHeldThisTurn = false;
    this._undoState = null;
    this.canUndo = false;
    this.undosRemaining = CONFIG.FREE_UNDOS;
    this.feverActive = false;
    this.bombsUsedThisGame = 0;
    this.multiplierBar = 0;
    this.multiplierActive = false;
    this.nextShape2 = getRandomShape();
    this.nextShape = getRandomShape();
    this.spawnNextShape();
    this._generateStarCells();
  },

  createEmptyGrid: function () {
    var size = CONFIG.GRID_SIZE;
    var grid = new Array(size);
    for (var row = 0; row < size; row++) {
      grid[row] = new Array(size);
      for (var col = 0; col < size; col++) {
        grid[row][col] = 0;
      }
    }
    return grid;
  },

  _deepCopyGrid: function () {
    var size = CONFIG.GRID_SIZE;
    var copy = new Array(size);
    for (var i = 0; i < size; i++) {
      copy[i] = this.grid[i].slice();
    }
    return copy;
  },

  spawnNextShape: function () {
    this.currentShape = this.nextShape;
    this.nextShape = this.nextShape2;
    this.nextShape2 = getRandomShape();
    this.hasHeldThisTurn = false;
    if (!this.canPlaceAnywhere(this.currentShape)) {
      this.isGameOver = true;
    }
  },

  /**
   * Возвращает реальные границы '1'-ячеек в матрице фигуры.
   * { minR, maxR, minC, maxC } — смещения внутри матрицы.
   */
  _shapeBounds: function (shape) {
    var h = shape.length;
    var w = shape[0].length;
    var minR = h, maxR = -1, minC = w, maxC = -1;
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (shape[r][c] === '1') {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    return { minR: minR, maxR: maxR, minC: minC, maxC: maxC };
  },

  canPlace: function (shape, row, col) {
    var h = shape.length;
    var w = shape[0].length;
    var size = CONFIG.GRID_SIZE;
    if (typeof row !== 'number' || typeof col !== 'number' || row !== row || col !== col) return false;
    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (shape[r][c] === '1') {
          var gr = row + r;
          var gc = col + c;
          if (gr < 0 || gr >= size || gc < 0 || gc >= size) return false;
          if (this.grid[gr][gc] !== 0) return false;
        }
      }
    }
    return true;
  },

  canPlaceAnywhere: function (shape) {
    var size = CONFIG.GRID_SIZE;
    var b = this._shapeBounds(shape);
    // Origin can range so that all '1' cells stay within grid
    var minRow = -b.minR;
    var maxRow = size - 1 - b.maxR;
    var minCol = -b.minC;
    var maxCol = size - 1 - b.maxC;
    for (var row = minRow; row <= maxRow; row++) {
      for (var col = minCol; col <= maxCol; col++) {
        if (this.canPlace(shape, row, col)) return true;
      }
    }
    return false;
  },

  getPlacementOrigin: function (row, col, shape) {
    var size = CONFIG.GRID_SIZE;
    var b = this._shapeBounds(shape);
    // Center on the actual '1' cells, not the full matrix
    var realH = b.maxR - b.minR + 1;
    var realW = b.maxC - b.minC + 1;
    // Cursor cell should be center of real shape content
    var r = row - b.minR - Math.floor(realH / 2);
    var c = col - b.minC - Math.floor(realW / 2);
    // Clamp so all '1' cells stay within grid
    if (r + b.minR < 0) r = -b.minR;
    if (c + b.minC < 0) c = -b.minC;
    if (r + b.maxR >= size) r = size - 1 - b.maxR;
    if (c + b.maxC >= size) c = size - 1 - b.maxC;
    return { row: r, col: c };
  },

  _saveUndo: function () {
    this._undoState = {
      grid: this._deepCopyGrid(),
      currentShape: this.currentShape,
      nextShape: this.nextShape,
      nextShape2: this.nextShape2,
      score: this.score,
      linesClearedThisLevel: this.linesClearedThisLevel,
      linesClearedThisGame: this.linesClearedThisGame,
      comboCounter: this.comboCounter,
      heldShape: this.heldShape,
      hasHeldThisTurn: this.hasHeldThisTurn,
      starCells: this.starCells.slice(),
      bombsUsedThisGame: this.bombsUsedThisGame,
    };
  },

  undo: function () {
    if (!this._undoState || !this.canUndo) return false;
    if (this.undosRemaining <= 0) return false;
    this.grid = this._undoState.grid;
    this.currentShape = this._undoState.currentShape;
    this.nextShape = this._undoState.nextShape;
    this.nextShape2 = this._undoState.nextShape2;
    this.score = this._undoState.score;
    this.linesClearedThisLevel = this._undoState.linesClearedThisLevel;
    this.linesClearedThisGame = this._undoState.linesClearedThisGame;
    this.comboCounter = this._undoState.comboCounter;
    this.heldShape = this._undoState.heldShape;
    this.hasHeldThisTurn = this._undoState.hasHeldThisTurn;
    this.starCells = this._undoState.starCells;
    this.bombsUsedThisGame = this._undoState.bombsUsedThisGame;
    this.isGameOver = false;
    this.canUndo = false;
    this._undoState = null;
    this.undosRemaining--;
    return true;
  },

  holdShape: function () {
    if (this.hasHeldThisTurn || this.isGameOver) return false;
    this.hasHeldThisTurn = true;
    if (this.heldShape) {
      var tmp = this.heldShape;
      this.heldShape = this.currentShape;
      this.currentShape = tmp;
    } else {
      this.heldShape = this.currentShape;
      this.currentShape = this.nextShape;
      this.nextShape = this.nextShape2;
      this.nextShape2 = getRandomShape();
    }
    if (!this.canPlaceAnywhere(this.currentShape)) {
      this.isGameOver = true;
    }
    return true;
  },

  placeShape: function (row, col) {
    if (!this.currentShape || this.isGameOver) return { placed: false };
    if (!this.canPlace(this.currentShape, row, col)) return { placed: false };

    this._saveUndo();

    var shape = this.currentShape;
    var isBomb = !!shape.isBomb;
    var h = shape.length;
    var w = shape[0].length;

    var starsCollected = [];

    if (isBomb) {
      this.bombsUsedThisGame++;
      var clearedCells = this._applyBomb(row, col);
      var linesCleared = clearedCells.length > 0 ? 1 : 0;
      var points = clearedCells.length * 20;
      points = Math.floor(points * this.getFeverMultiplier());
      this.score += points;
      this.linesClearedThisLevel += linesCleared;
      this.linesClearedThisGame += linesCleared;
      if (linesCleared > 0) {
        this.comboCounter++;
      } else {
        this.comboCounter = 0;
      }
      this.canUndo = true;
      var feverTriggered = this.checkFever();
      this.spawnNextShape();
      return { placed: true, linesCleared: linesCleared, clearedCells: clearedCells, points: points, isBomb: true, starsCollected: [], feverTriggered: feverTriggered };
    }

    for (var r = 0; r < h; r++) {
      for (var c = 0; c < w; c++) {
        if (shape[r][c] === '1') {
          this.grid[row + r][col + c] = 1;
          starsCollected = starsCollected.concat(this._collectStars(row + r, col + c));
        }
      }
    }

    var cellsToClear = this._findCellsToClear();
    var linesCleared = this._clearLines(cellsToClear);

    if (linesCleared > 0) {
      this.comboCounter++;
    } else {
      this.comboCounter = 0;
    }

    var points = this.calcPoints(linesCleared);
    points = Math.floor(points * this.getFeverMultiplier());
    this.score += points;
    this.linesClearedThisLevel += linesCleared;
    this.linesClearedThisGame += linesCleared;
    this.canUndo = true;

    if (starsCollected.length > 0 && typeof Progress !== 'undefined') {
      var starBonus = starsCollected.length * CONFIG.STAR_BONUS_COINS;
      Progress.data.coins = (Progress.data.coins || 0) + starBonus;
      Progress.save();
    }

    var feverTriggered = this.checkFever();
    this.spawnNextShape();
    return { placed: true, linesCleared: linesCleared, clearedCells: cellsToClear, points: points, isBomb: false, starsCollected: starsCollected, feverTriggered: feverTriggered };
  },

  _applyBomb: function (row, col) {
    var size = CONFIG.GRID_SIZE;
    var cleared = [];
    for (var r = row - 1; r <= row + 1; r++) {
      for (var c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < size && c >= 0 && c < size && this.grid[r][c] !== 0) {
          cleared.push({ row: r, col: c });
          this.grid[r][c] = 0;
        }
      }
    }
    return cleared;
  },

  _findCellsToClear: function () {
    var size = CONFIG.GRID_SIZE;
    var cells = [];
    var fullRows = 0;
    var fullCols = 0;

    // Check rows
    for (var i = 0; i < size; i++) {
      var full = true;
      for (var j = 0; j < size; j++) {
        if (this.grid[i][j] === 0) { full = false; break; }
      }
      if (full) {
        fullRows++;
        for (var j = 0; j < size; j++) {
          cells.push({ row: i, col: j });
        }
      }
    }
    // Check columns
    for (var j = 0; j < size; j++) {
      var full = true;
      for (var i = 0; i < size; i++) {
        if (this.grid[i][j] === 0) { full = false; break; }
      }
      if (full) {
        fullCols++;
        for (var i = 0; i < size; i++) {
          cells.push({ row: i, col: j });
        }
      }
    }

    // Deduplicate
    if (fullRows > 0 && fullCols > 0) {
      var seen = {};
      var unique = [];
      for (var k = 0; k < cells.length; k++) {
        var key = cells[k].row * size + cells[k].col;
        if (!seen[key]) {
          seen[key] = true;
          unique.push(cells[k]);
        }
      }
      cells = unique;
    }

    // Store line count for _clearLines
    cells._lineCount = fullRows + fullCols;
    return cells;
  },

  _clearLines: function (cells) {
    if (!cells.length) return 0;
    var totalLines = cells._lineCount || 0;
    if (totalLines === 0) return 0;
    for (var k = 0; k < cells.length; k++) {
      this.grid[cells[k].row][cells[k].col] = 0;
    }
    return totalLines;
  },

  calcPoints: function (linesCount) {
    if (linesCount === 0) return 0;
    var points = CONFIG.POINTS_PER_LINE * linesCount;
    if (linesCount > 1) {
      points = Math.floor(points * Math.pow(CONFIG.COMBO_MULTIPLIER, linesCount - 1));
    }
    var mults = CONFIG.STREAK_MULTIPLIERS || [1, 1, 1.5, 2, 2.5];
    var idx = Math.min(this.comboCounter, mults.length - 1);
    points = Math.floor(points * mults[idx]);
    return points;
  },

  isLevelComplete: function () {
    if (this.isEndless) return false;
    return this.linesClearedThisLevel >= this.linesGoal && !this.isGameOver;
  },

  goNextLevel: function () {
    this.level++;
    this.linesClearedThisLevel = 0;
    this.comboCounter = 0;
    this.canUndo = false;
    this._undoState = null;
    this.feverActive = false;
    this.linesGoal = Math.min(
      CONFIG.DEFAULT_LINES_GOAL + (this.level - 1) * CONFIG.LINES_GOAL_PER_LEVEL,
      CONFIG.MAX_LINES_GOAL
    );
    this.grid = this.createEmptyGrid();
    this.nextShape2 = getRandomShape();
    this.nextShape = getRandomShape();
    this.spawnNextShape();
    this._generateStarCells();
  },

  getCellFromEvent: function (canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var t = evt.changedTouches ? evt.changedTouches[0] : evt.touches ? evt.touches[0] : evt;
    var x = (t.clientX !== undefined ? t.clientX : evt.clientX) - rect.left;
    var y = (t.clientY !== undefined ? t.clientY : evt.clientY) - rect.top;
    var col = Math.floor((x * scaleX) / CONFIG.CELL_SIZE);
    var row = Math.floor((y * scaleY) / CONFIG.CELL_SIZE);
    return { row: row, col: col };
  },

  // === Grid Fill Meter ===
  getGridFillPercent: function () {
    var size = CONFIG.GRID_SIZE;
    var total = size * size;
    var filled = 0;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (this.grid[r][c] !== 0) filled++;
      }
    }
    return Math.round((filled / total) * 100);
  },

  // === Fever Mode ===
  checkFever: function () {
    if (!this.feverActive && this.comboCounter >= CONFIG.FEVER_COMBO_THRESHOLD) {
      this.feverActive = true;
      return true;
    }
    return false;
  },

  endFever: function () {
    this.feverActive = false;
  },

  getFeverMultiplier: function () {
    return this.feverActive ? CONFIG.FEVER_MULTIPLIER : 1;
  },

  // === Star Cells ===
  _generateStarCells: function () {
    var count = CONFIG.STAR_CELLS_PER_LEVEL || 4;
    this.starCells = [];
    var attempts = 0;
    while (this.starCells.length < count && attempts < 100) {
      attempts++;
      var r = Math.floor(Math.random() * CONFIG.GRID_SIZE);
      var c = Math.floor(Math.random() * CONFIG.GRID_SIZE);
      var exists = false;
      for (var i = 0; i < this.starCells.length; i++) {
        if (this.starCells[i].row === r && this.starCells[i].col === c) { exists = true; break; }
      }
      if (!exists) {
        this.starCells.push({ row: r, col: c });
      }
    }
  },

  _collectStars: function (row, col) {
    var collected = [];
    for (var i = this.starCells.length - 1; i >= 0; i--) {
      if (this.starCells[i].row === row && this.starCells[i].col === col) {
        collected.push(this.starCells[i]);
        this.starCells.splice(i, 1);
      }
    }
    return collected;
  },
};

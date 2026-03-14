/**
 * Drag-and-drop для текущей фигуры (GSAP Draggable).
 * Фигура перетаскивается на сетку; при drop вызывается onPlaceSuccess.
 * Центрирование фигуры на ячейке.
 */
var DragDrop = {
  onPlaceSuccess: null,
  _draggable: null,

  init: function (onPlaceSuccess) {
    this.onPlaceSuccess = onPlaceSuccess || null;
    var container = document.getElementById('current-shape-container');
    if (!container || typeof gsap === 'undefined' || typeof Draggable === 'undefined') return;

    gsap.registerPlugin(Draggable);
    container.style.touchAction = 'none';

    var self = this;

    this._draggable = Draggable.create(container, {
      type: 'x,y',
      zIndexBoost: true,
      onDrag: function () {
        self._updatePreview(this.pointerX, this.pointerY);
      },
      onDragEnd: function () {
        var px = this.pointerX;
        var py = this.pointerY;
        gsap.to(container, { x: 0, y: 0, duration: 0.3, ease: 'back.out(1.7)' });
        Render.clearPlacePreview();
        self._tryPlace(px, py);
      },
    })[0];
  },

  /**
   * Получает ячейку грида с центрированием фигуры.
   * Возвращает {row, col} — координаты для верхнего левого угла (уже центрированные).
   */
  _getGridCell: function (clientX, clientY) {
    var canvas = Render.canvas;
    if (!canvas || !CONFIG) return null;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var col = Math.floor(((clientX - rect.left) * scaleX) / CONFIG.CELL_SIZE);
    var row = Math.floor(((clientY - rect.top) * scaleY) / CONFIG.CELL_SIZE);
    var size = CONFIG.GRID_SIZE;
    if (row < 0 || row >= size || col < 0 || col >= size || row !== row || col !== col) return null;

    // Center the shape on the hovered cell
    if (Game.currentShape) {
      var origin = Game.getPlacementOrigin(row, col, Game.currentShape);
      return { row: origin.row, col: origin.col };
    }
    return { row: row, col: col };
  },

  _updatePreview: function (clientX, clientY) {
    if (!Game.currentShape) { Render.clearPlacePreview(); return; }
    var cell = this._getGridCell(clientX, clientY);
    if (!cell) { Render.clearPlacePreview(); return; }
    var canPlace = Game.canPlace(Game.currentShape, cell.row, cell.col);
    Render.drawPlacePreview(cell.row, cell.col, canPlace);
  },

  _tryPlace: function (clientX, clientY) {
    if (!Game.currentShape || Game.isGameOver) return;
    var cell = this._getGridCell(clientX, clientY);
    if (!cell) return;
    if (!Game.canPlace(Game.currentShape, cell.row, cell.col)) return;
    var result = Game.placeShape(cell.row, cell.col);
    if (result.placed && this.onPlaceSuccess) {
      this.onPlaceSuccess(result);
    }
  },
};

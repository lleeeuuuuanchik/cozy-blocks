/**
 * Фигуры для блок-пазла (тетрисообразные).
 * Каждая фигура — массив строк: '1' — клетка, '0' — пусто.
 */
const SHAPES = [
  // I — горизонтальная линия из 4
  [['1', '1', '1', '1']],
  // O — квадрат 2x2
  [
    ['1', '1'],
    ['1', '1'],
  ],
  // L
  [
    ['1', '0', '0'],
    ['1', '0', '0'],
    ['1', '1', '0'],
  ],
  // J
  [
    ['0', '0', '1'],
    ['0', '0', '1'],
    ['0', '1', '1'],
  ],
  // T
  [
    ['1', '1', '1'],
    ['0', '1', '0'],
    ['0', '1', '0'],
  ],
  // S
  [
    ['0', '1', '1'],
    ['1', '1', '0'],
    ['0', '0', '0'],
  ],
  // Z
  [
    ['1', '1', '0'],
    ['0', '1', '1'],
    ['0', '0', '0'],
  ],
  // Маленький L (3 клетки)
  [
    ['1', '0'],
    ['1', '1'],
  ],
  // Точка
  [['1']],
];

/** Бомба — одноклеточная фигура, очищает 3×3 */
const BOMB_SHAPE = [['1']];

/**
 * Возвращает копию случайной фигуры из набора.
 * С шансом CONFIG.POWERUP_BOMB_CHANCE возвращает бомбу.
 */
function getRandomShape() {
  if (typeof CONFIG !== 'undefined' && CONFIG.POWERUP_BOMB_CHANCE && Math.random() < CONFIG.POWERUP_BOMB_CHANCE) {
    var bomb = BOMB_SHAPE.map(function (row) { return [].concat(row); });
    bomb.isBomb = true;
    return bomb;
  }
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return shape.map(row => [...row]);
}

/**
 * Поворот фигуры на 90° по часовой стрелке.
 */
function rotateShapeCW(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = [];
  for (let c = 0; c < cols; c++) {
    rotated[c] = [];
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(shape[r][c]);
    }
  }
  // Preserve special flags
  if (shape.isBomb) rotated.isBomb = true;
  return rotated;
}

function shapeWidth(shape) {
  return shape[0].length;
}

function shapeHeight(shape) {
  return shape.length;
}

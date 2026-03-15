/**
 * Система частиц: взрыв при очистке линий.
 * Рисует на #particle-canvas поверх сетки.
 */
var Particles = {
  particles: [],
  canvas: null,
  ctx: null,
  _running: false,
  _lastTime: 0,

  init() {
    this.canvas = document.getElementById('particle-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
  },

  /**
   * Создать частицы в точке (cx, cy) в координатах canvas.
   * @param {number} cx - x-координата центра
   * @param {number} cy - y-координата центра
   * @param {string} color - цвет частиц
   * @param {number} count - количество частиц
   */
  emit(cx, cy, color, count) {
    count = count || 6;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.8;
      var speed = 40 + Math.random() * 80;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 1.2 + Math.random() * 0.8,
        color: color,
        size: 2 + Math.random() * 3,
      });
    }
    if (!this._running) this._startLoop();
  },

  /**
   * Создать частицы для очищенных клеток.
   * @param {Array} cells - [{row, col}, ...]
   */
  emitForCells(cells) {
    if (!cells || !cells.length) return;
    var cell = CONFIG.CELL_SIZE;
    var theme = (typeof Render !== 'undefined') ? Render.getThemeObj() : { cell: '#ff6b9d' };
    var colors = [theme.cell, '#c084fc', '#67e8f9', '#fff'];
    for (var i = 0; i < cells.length; i++) {
      var cx = cells[i].col * cell + cell / 2;
      var cy = cells[i].row * cell + cell / 2;
      var color = colors[Math.floor(Math.random() * colors.length)];
      this.emit(cx, cy, color, 5);
    }
  },

  /**
   * Взрыв бомбы: кольцо + вспышка + усиленные частицы.
   */
  emitExplosion(cx, cy) {
    var colors = ['#67e8f9', '#ffffff', '#e879f9', '#c084fc'];
    for (var i = 0; i < 35; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 150 + Math.random() * 100;
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.8 + Math.random() * 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
      });
    }
    // Expanding ring
    this.particles.push({
      x: cx, y: cy, vx: 0, vy: 0,
      life: 1, decay: 2.5,
      color: '#67e8f9', size: 8,
      type: 'ring',
    });
    // Flash
    this.particles.push({
      x: cx, y: cy, vx: 0, vy: 0,
      life: 1, decay: 5,
      color: 'rgba(255,255,255,0.7)', size: 0,
      type: 'flash',
    });
    if (!this._running) this._startLoop();
  },

  _startLoop() {
    this._running = true;
    this._lastTime = performance.now();
    var self = this;
    function loop(now) {
      if (!self._running) return;
      var dt = (now - self._lastTime) / 1000;
      self._lastTime = now;
      self._update(dt);
      self._draw();
      if (self.particles.length > 0) {
        requestAnimationFrame(loop);
      } else {
        self._running = false;
      }
    }
    requestAnimationFrame(loop);
  },

  _update(dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      if (p.type === 'ring') {
        p.size += 200 * dt;
      } else if (p.type === 'flash') {
        // no movement
      } else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt;
      }
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  },

  _draw() {
    if (!this.ctx || !this.canvas) return;
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'flash') {
        ctx.fillStyle = p.color;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  },
};

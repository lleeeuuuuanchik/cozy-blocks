/**
 * Juice-эффекты: тряска, всплывающий текст, пульсация.
 * Использует GSAP для анимаций.
 */
var Juice = {
  /**
   * Тряска элемента.
   * @param {HTMLElement} el
   * @param {number} intensity - сила в пикселях (по умолч. 4)
   * @param {number} duration - длительность в секундах (по умолч. 0.35)
   */
  shake: function (el, intensity, duration) {
    if (!el || typeof gsap === 'undefined') return;
    intensity = intensity || 4;
    duration = duration || 0.35;
    var tl = gsap.timeline();
    var steps = 6;
    var stepDur = duration / steps;
    for (var i = 0; i < steps; i++) {
      var factor = 1 - (i / steps); // затухание
      tl.to(el, {
        x: (Math.random() - 0.5) * 2 * intensity * factor,
        y: (Math.random() - 0.5) * 2 * intensity * factor,
        duration: stepDur,
        ease: 'power1.inOut',
      });
    }
    tl.to(el, { x: 0, y: 0, duration: stepDur, ease: 'power2.out' });
  },

  /**
   * Всплывающий текст (например, "+100").
   * @param {string} text
   * @param {number} x - left в пикселях
   * @param {number} y - top в пикселях
   * @param {HTMLElement} parent - родительский элемент (position: relative)
   * @param {string} color - цвет текста
   */
  floatText: function (text, x, y, parent, color) {
    if (!parent || typeof gsap === 'undefined') return;
    var el = document.createElement('span');
    el.className = 'float-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = color || '#ff6b9d';
    parent.appendChild(el);
    gsap.fromTo(el,
      { opacity: 1, y: 0, scale: 1 },
      {
        opacity: 0,
        y: -50,
        scale: 1.4,
        duration: 0.9,
        ease: 'power2.out',
        onComplete: function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        },
      }
    );
  },

  /**
   * Пульсация элемента (масштаб).
   * @param {HTMLElement} el
   */
  pulseElement: function (el) {
    if (!el || typeof gsap === 'undefined') return;
    gsap.fromTo(el,
      { scale: 1.25 },
      { scale: 1, duration: 0.35, ease: 'back.out(2)' }
    );
  },
};

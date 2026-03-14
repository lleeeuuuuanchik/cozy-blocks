/**
 * Реплики персонажей по триггерам. Поддержка подстановок {level}, {reward}.
 * Анимация через GSAP. Редизайн: карточка с именем и цветом персонажа.
 */
const DIALOGUE_LINES = {
  onStart: [
    { characterId: '1', text: 'Давай соберём линии вместе!' },
    { characterId: '1', text: 'Ставь фигуры и заполняй строки и столбцы.' },
    { characterId: '1', text: 'Я буду подсказывать — ты собирай блоки!' },
  ],
  onLevelWin: [
    { characterId: '1', text: 'Супер! Так держать!' },
    { characterId: '1', text: 'Отлично справилась!' },
    { characterId: '1', text: 'Ещё один уровень — красота!' },
    { characterId: '2', text: 'Молодец! Продолжай в том же духе!' },
    { characterId: '3', text: 'Победа! Ты настоящий мастер блоков.' },
  ],
  onGameOver: [
    { characterId: '1', text: 'Бывает! Попробуй ещё раз — получится.' },
    { characterId: '1', text: 'Не сдавайся! Каждая попытка считается.' },
    { characterId: '2', text: 'В следующий раз повезёт. Давай заново!' },
    { characterId: '3', text: 'Отдохни и возвращайся — я в тебя верю!' },
  ],
  onCombo: [
    { characterId: '1', text: 'Несколько линий сразу — вот это да!' },
    { characterId: '1', text: 'Комбо! Ты огонь!' },
    { characterId: '2', text: 'Сразу столько линий — круто!' },
    { characterId: '3', text: 'Комбо-мастер! Продолжай!' },
  ],
  onAchievement: [
    { characterId: '1', text: 'Ты разблокировала что-то новое! Поздравляю!' },
    { characterId: '1', text: 'Достижение получено! Так держать!' },
    { characterId: '2', text: 'Награда твоя — ты её заслужила!' },
    { characterId: '3', text: 'Ещё один шаг вперёд. Горжусь тобой!' },
  ],
  onLevelMilestone: [
    { characterId: '1', text: 'Уровень {level} — уже серьёзно! Ты справляешься.' },
    { characterId: '1', text: 'Отличный прогресс! Дальше — больше.' },
    { characterId: '2', text: 'Мы с тобой уже далеко зашли. Вперёд!' },
    { characterId: '3', text: 'Уровень {level} покорён. Что дальше?' },
  ],
  onFever: [
    { characterId: '1', text: 'FEVER MODE! Очки утроены!' },
    { characterId: '2', text: 'Огонь! Все очки x3!' },
    { characterId: '3', text: 'Режим огня активирован!' },
  ],
  onStar: [
    { characterId: '1', text: 'Звезда собрана! +{coins} монет!' },
    { characterId: '2', text: 'Блестяще! Звезда — твоя!' },
  ],
};

const DIALOGUE_CHARACTERS = (function () {
  var base = typeof ASSETS !== 'undefined' && ASSETS.characters ? ASSETS.characters : 'assets/characters/';
  return [
    { id: '1', name: 'Подруга', baseFolder: base + '1/', color: 'pink' },
    { id: '2', name: 'Нацуми', baseFolder: base + '2/', unlockAchievementId: 'total_lines_50', color: 'purple' },
    { id: '3', name: 'Михо', baseFolder: base + '3/', unlockAchievementId: 'total_levels_10', color: 'cyan' },
  ];
})();

const TRIGGER_TO_AVATAR = {
  onStart: 'default',
  onLevelWin: 'happy',
  onGameOver: 'sad',
  onCombo: 'happy',
  onAchievement: 'happy',
  onLevelMilestone: 'happy',
  onFever: 'happy',
  onStar: 'happy',
};

const Dialogue = {
  container: null,
  avatarEl: null,
  textEl: null,
  nameBadge: null,
  hideTimer: null,
  _messageIndex: 0,

  init: function () {
    this.container = document.getElementById('character-message');
    this.avatarEl = document.querySelector('.character-avatar');
    this.textEl = document.querySelector('.message-text');
    this.nameBadge = document.querySelector('.char-name-badge');
    if (this.container) {
      this.container.addEventListener('click', () => this.hide());
    }
  },

  showMessage: function (trigger, payload) {
    payload = payload || {};
    var lines = DIALOGUE_LINES[trigger];
    if (!lines || lines.length === 0) return;

    var unlocked = (Progress.data && Progress.data.unlockedCharacters) || ['1'];
    var available = lines.filter(function (l) { return unlocked.indexOf(l.characterId) !== -1; });
    if (available.length === 0) return;

    var line = available[this._messageIndex % available.length];
    this._messageIndex += 1;

    var character = null;
    for (var i = 0; i < DIALOGUE_CHARACTERS.length; i++) {
      if (DIALOGUE_CHARACTERS[i].id === line.characterId) { character = DIALOGUE_CHARACTERS[i]; break; }
    }
    var mood = TRIGGER_TO_AVATAR[trigger] || 'default';
    var avatarUrl = character && character.baseFolder ? character.baseFolder + mood + '.png' : '';

    var text = (line && line.text) || '';
    text = text.replace(/\{level\}/g, payload.level !== undefined ? payload.level : '');
    text = text.replace(/\{reward\}/g, payload.reward !== undefined ? payload.reward : '');
    text = text.replace(/\{coins\}/g, payload.coins !== undefined ? payload.coins : '');

    if (!this.container || !this.textEl) {
      if (!this.container && document.getElementById('character-message')) this.init();
      if (!this.textEl) return;
    }

    // Set character color via data attribute
    var charColor = character ? character.color : 'pink';
    this.container.setAttribute('data-char-color', charColor);

    // Name badge
    if (this.nameBadge) {
      this.nameBadge.textContent = character ? character.name : '';
    }

    // Avatar
    if (this.avatarEl) {
      this.avatarEl.alt = character ? character.name : '';
      this.avatarEl.src = avatarUrl;
      this.avatarEl.onerror = function () {
        this.style.display = 'none';
      };
      this.avatarEl.style.display = avatarUrl ? '' : 'none';
    }
    this.textEl.textContent = text;

    // GSAP slide-in animation
    this.container.classList.remove('hidden');
    this.container.classList.add('visible');
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(this.container,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }
      );
    }

    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => this.hide(), 4000);
  },

  hide: function () {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (!this.container) return;
    var container = this.container;
    if (typeof gsap !== 'undefined') {
      gsap.to(container, {
        y: 50, opacity: 0, duration: 0.25,
        onComplete: function () {
          container.classList.remove('visible');
          container.classList.add('hidden');
        }
      });
    } else {
      container.classList.remove('visible');
      container.classList.add('hidden');
    }
  },
};

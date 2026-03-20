/**
 * Реплики персонажей по триггерам. Поддержка подстановок {level}, {reward}.
 * Анимация через GSAP. Редизайн: карточка с именем и цветом персонажа.
 */
const DIALOGUE_LINES = {
  onStart: [
    { characterId: '1', textKey: 'dlg_start_0' },
    { characterId: '1', textKey: 'dlg_start_1' },
    { characterId: '1', textKey: 'dlg_start_2' },
  ],
  onLevelWin: [
    { characterId: '1', textKey: 'dlg_win_0' },
    { characterId: '1', textKey: 'dlg_win_1' },
    { characterId: '1', textKey: 'dlg_win_2' },
    { characterId: '2', textKey: 'dlg_win_3' },
    { characterId: '3', textKey: 'dlg_win_4' },
  ],
  onGameOver: [
    { characterId: '1', textKey: 'dlg_over_0' },
    { characterId: '1', textKey: 'dlg_over_1' },
    { characterId: '2', textKey: 'dlg_over_2' },
    { characterId: '3', textKey: 'dlg_over_3' },
  ],
  onCombo: [
    { characterId: '1', textKey: 'dlg_combo_0' },
    { characterId: '1', textKey: 'dlg_combo_1' },
    { characterId: '2', textKey: 'dlg_combo_2' },
    { characterId: '3', textKey: 'dlg_combo_3' },
  ],
  onAchievement: [
    { characterId: '1', textKey: 'dlg_ach_0' },
    { characterId: '1', textKey: 'dlg_ach_1' },
    { characterId: '2', textKey: 'dlg_ach_2' },
    { characterId: '3', textKey: 'dlg_ach_3' },
  ],
  onLevelMilestone: [
    { characterId: '1', textKey: 'dlg_milestone_0' },
    { characterId: '1', textKey: 'dlg_milestone_1' },
    { characterId: '2', textKey: 'dlg_milestone_2' },
    { characterId: '3', textKey: 'dlg_milestone_3' },
  ],
  onFever: [
    { characterId: '1', textKey: 'dlg_fever_0' },
    { characterId: '2', textKey: 'dlg_fever_1' },
    { characterId: '3', textKey: 'dlg_fever_2' },
  ],
  onStar: [
    { characterId: '1', textKey: 'dlg_star_0' },
    { characterId: '2', textKey: 'dlg_star_1' },
  ],
};

const DIALOGUE_CHARACTERS = (function () {
  var base = 'assets/characters/';
  return [
    { id: '1', nameKey: 'char_1', baseFolder: base + '1/', color: 'pink' },
    { id: '2', nameKey: 'char_2', baseFolder: base + '2/', unlockAchievementId: 'total_lines_50', color: 'purple' },
    { id: '3', nameKey: 'char_3', baseFolder: base + '3/', unlockAchievementId: 'total_levels_10', color: 'cyan' },
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

    var text = '';
    if (line && line.textKey && typeof I18N !== 'undefined') {
      text = I18N.t(line.textKey, payload);
    } else if (line && line.textKey) {
      text = line.textKey;
    }

    if (!this.container || !this.textEl) {
      if (!this.container && document.getElementById('character-message')) this.init();
      if (!this.textEl) return;
    }

    // Set character color via data attribute
    var charColor = character ? character.color : 'pink';
    this.container.setAttribute('data-char-color', charColor);

    // Name badge
    if (this.nameBadge) {
      this.nameBadge.textContent = character ? (typeof I18N !== 'undefined' ? I18N.t(character.nameKey) : character.nameKey) : '';
    }

    // Avatar
    if (this.avatarEl) {
      this.avatarEl.alt = character ? (typeof I18N !== 'undefined' ? I18N.t(character.nameKey) : character.nameKey) : '';
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

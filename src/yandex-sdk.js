/**
 * Обёртка Yandex Games SDK v2.
 * Graceful degradation: если SDK недоступен, колбэки вызываются без рекламы.
 */
var YandexSDK = {
  ysdk: null,
  _ready: false,
  _pendingNotifyReady: false,
  _onPause: null,
  _onResume: null,

  init: function (cb) {
    if (typeof YaGames === 'undefined') {
      if (cb) cb(false);
      return;
    }
    var self = this;
    YaGames.init().then(function (ysdk) {
      self.ysdk = ysdk;
      self._ready = true;
      // Автоопределение языка через SDK (п. 2.14)
      try {
        var lang = ysdk.environment && ysdk.environment.i18n && ysdk.environment.i18n.lang;
        if (lang && typeof I18N !== 'undefined') {
          I18N.setLang(lang);
          I18N.applyToDOM();
        }
      } catch (e) {}
      // Подписка на паузу/возобновление от платформы (п. 1.19.4)
      try {
        ysdk.onEvent('game_api_pause', function () {
          if (self._onPause) self._onPause();
        });
        ysdk.onEvent('game_api_resume', function () {
          if (self._onResume) self._onResume();
        });
      } catch (e) {}
      if (cb) cb(true);
      if (self._pendingNotifyReady) self.notifyReady();
    }).catch(function () {
      if (cb) cb(false);
    });
  },

  /**
   * Получить текущий язык SDK (или 'ru' как фоллбэк).
   */
  getLang: function () {
    if (this.ysdk && this.ysdk.environment && this.ysdk.environment.i18n) {
      return this.ysdk.environment.i18n.lang || 'ru';
    }
    return 'ru';
  },

  /**
   * Сообщить платформе, что игра загружена и готова к игре (обязательно для модерации).
   * Вызывать один раз после отображения главного меню / готовности к взаимодействию.
   */
  notifyReady: function () {
    if (this.ysdk && this.ysdk.features && this.ysdk.features.LoadingAPI) {
      this.ysdk.features.LoadingAPI.ready();
      this._pendingNotifyReady = false;
    } else {
      this._pendingNotifyReady = true;
    }
  },

  /**
   * Сообщить платформе о начале геймплея (п. 1.19.3).
   */
  gameplayStart: function () {
    try {
      if (this.ysdk && this.ysdk.features && this.ysdk.features.GameplayAPI) {
        this.ysdk.features.GameplayAPI.start();
      }
    } catch (e) {}
  },

  /**
   * Сообщить платформе о конце геймплея (п. 1.19.3).
   */
  gameplayStop: function () {
    try {
      if (this.ysdk && this.ysdk.features && this.ysdk.features.GameplayAPI) {
        this.ysdk.features.GameplayAPI.stop();
      }
    } catch (e) {}
  },

  /**
   * Зарегистрировать колбэки паузы/возобновления (п. 1.19.4).
   * @param {function} onPause
   * @param {function} onResume
   */
  onPauseResume: function (onPause, onResume) {
    this._onPause = onPause;
    this._onResume = onResume;
  },

  /**
   * Показать rewarded-рекламу.
   * @param {function} onSuccess — вызывается после просмотра (onRewarded)
   * @param {function} [onError] — вызывается при ошибке или если SDK нет
   */
  showRewarded: function (onSuccess, onError) {
    if (!this.ysdk) {
      if (onError) onError();
      return;
    }
    var self = this;
    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onOpen: function () {
          if (self._onPause) self._onPause();
        },
        onRewarded: function () {
          if (onSuccess) onSuccess();
        },
        onClose: function () {
          if (self._onResume) self._onResume();
        },
        onError: function () {
          if (self._onResume) self._onResume();
          if (onError) onError();
        },
      },
    });
  },

  /**
   * Показать межстраничную рекламу (между уровнями и т.д.).
   * @param {function} [onClose]
   */
  showInterstitial: function (onClose) {
    if (!this.ysdk) {
      if (onClose) onClose();
      return;
    }
    var self = this;
    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: function () {
          if (self._onPause) self._onPause();
        },
        onClose: function (wasShown) {
          if (self._onResume) self._onResume();
          if (onClose) onClose();
        },
        onError: function () {
          if (self._onResume) self._onResume();
          if (onClose) onClose();
        },
      },
    });
  },
};

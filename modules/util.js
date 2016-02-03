var Util = function() {},
    gui,
    clipboard;

try {
  gui = window.require('nw.gui');
  clipboard = gui.Clipboard.get();
} catch (e) {
  console.error(e);
}

Util.prototype = {

  _PATTERN_HALFWIDTH: new RegExp('^[0-9a-zA-Z\u0020-\u007E\uFF61-\uFFDC\uFFE8-\uFFEE]+$'),

  /**
   * @param {string} str
   * @returns {boolean}
   */
  isHalfwidth: function(str) {
    return this._PATTERN_HALFWIDTH.test(str);
  },

  /**
   * @param {Array} ary
   * @param {string} text
   * @returns {Array}
   */
  findIndexes: function(ary, text) {
    var indexes = [],
      pattern = new RegExp(RegExp.escape(text), 'ig');
    for (var i = 0, l = ary.length; i < l; i++) {
      if (pattern.test(ary[i])) {
        indexes.push(i);
      }
    }
    return indexes;
  },

  /**
   * @param {number} keycode
   * @returns {boolean}
   */
  isCursorkey: function(keycode) {
    return (keycode >= 37 && keycode <= 40);
  },

  /**
   * @param {number} keycode
   * @returns {boolean}
   */
  isCmdkey: function(keycode) {
   return (keycode === 91 || keycode === 17);
  },

  /**
   * @param {string} text
   */
  setClipboard: function(text) {
    if (typeof clipboard !== 'undefined') {
      clipboard.set(text, 'text');
    }
  }

};

module.exports = Util;

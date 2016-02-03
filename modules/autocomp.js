var Autocomp = function() {},

  util   = new(require('./util.js')),
  cache  = require('./cache.js'),
  config = require('./config.js'),

  _timeoutId   = null,
  _keyPressing = false,
  _beforeWhich = null,
  _beforeValue = '',
  _focusIndex  = -1,
  _divAnalects = $('.analects-box'),
  _ulAnlects   = $('#analects'),
  _inputSearch = $('#search'),
  _divPopup    = $('#popup');

Autocomp.prototype = {

  bind: function() {
    $('#search')
      .keyup(this.onKeyup.bind(this))
      .keydown(this.onKeydown.bind(this));
  },

  /**
   * @param {Event} e
   */
  onKeydown: function(e) {
    var which = e.which | 0;
    if (util.isCmdkey(_beforeWhich)) {
      if (which === 65) {
        _inputSearch.select();
      }
    } else {
      _beforeWhich = which;
    }
    if (util.isCursorkey(which)) {
      this.moveFocus(which);
      _keyPressing = true;
    } else {
      _keyPressing = false;
    }
  },

  /**
   * @param {Event} e
   */
  onKeyup: function(e) {
    if (_keyPressing) return;
    // enter
    if (e.which === 13) {
      if (_focusIndex !== -1) {
        var focus = _ulAnlects.find('.focus'),
            dataidx = focus[0].dataset.idx|0;
        util.setClipboard(cache.analects[dataidx].text + ' #commando');
        _divPopup.show().delay(300).fadeOut(500);
      }
    }
    if (_timeoutId !== null) {
      clearTimeout(_timeoutId);
    }
    _timeoutId = setTimeout(this.onTimeout.bind(this, e), 200);
  },

  /**
   * @param {Event} e
   */
  onTimeout: function(e) {
    e.preventDefault();

    var value = e.currentTarget.value,
        lastChar = value.last(1),
        len = value.length,
        which = e.which | 0;

    if (len > 0) {
      if (util.isHalfwidth(lastChar)) {
        if (_beforeValue !== value) {
          this.showList(value);
        }
      } else {
        // enter, delete
        if ((which === 13 || which === 8) && _beforeValue !== value) {
          this.showList(value);
        }
      }
    } else {
      this.hideList();
    }

    _timeoutId = null;
  },

  /**
   * @param {number} which
   */
  moveFocus: function(which) {
    var v = 0;
    switch (which) {
      case 38:
        v = -1;
        break;
      case 40:
        v = 1;
        break;
      default:
        return;
    }
    var ancs = _ulAnlects.find('a');
    var nextIndex = _focusIndex + v;
    if (nextIndex < 0 || nextIndex >= ancs.length) return;
    ancs.removeClass('focus').eq(nextIndex).addClass('focus');
    _focusIndex = nextIndex;
  },

  hideList: function() {
    _beforeValue = '';
    _focusIndex = -1;
    _divAnalects.hide();
  },

  /**
   * @param {string} inputValue
   */
  showList: function(inputValue) {
    var indexes = util.findIndexes(cache.idx, inputValue);

    if (indexes.length <= 0) {
      this.hideList();
      return;
    }

    var frag = document.createDocumentFragment();

    indexes.some(function(idx, i) {
      if (i >= config.LIST_MAX_SIZE) {
        return true
      }
      var li = document.createElement('li');
      li.innerHTML = '<a data-idx="' + idx + '"><span><em>' + cache.analects[idx].title + '</em>' + cache.analects[idx].text + '</span></a>';
      frag.appendChild(li);
    });

    _focusIndex = -1;
    _beforeValue = inputValue;
    _ulAnlects.html(frag);
    _divAnalects.show();
  }

};

module.exports = Autocomp;

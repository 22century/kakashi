(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./cache.js":2,"./config.js":3,"./util.js":6}],2:[function(require,module,exports){
var cache = {
  analects: {},
  idx: []
};

module.exports = cache;

},{}],3:[function(require,module,exports){
const CONFIG = {
  PAGE_URL: 'http://www7.atwiki.jp/commando-matome/pages/11.html',
  LIST_MAX_SIZE: 14
};

module.exports = CONFIG;

},{}],4:[function(require,module,exports){
var Main = function() {
  this.initialize();
};

Main.prototype = {
  initialize: function() {
    $(window).on('load', this.onLoad.bind(this));
    $('form').on('submit', function(e) {
      e.preventDefault()
    });
    $('.analects-box').hide();
    var ac = new(require('./autocomp.js'));
    ac.bind();
  },
  onLoad: function() {
    var resource = new(require('./resource.js'));
    resource
      .get()
      .then(function() {
        console.log(require('./cache.js'));
      });
  }
};

new Main();

},{"./autocomp.js":1,"./cache.js":2,"./resource.js":5}],5:[function(require,module,exports){
var Resource = function() {},
    cache = require('./cache.js');

Resource.prototype = {

  /**
   * @returns {jQuery.Deferred}
   */
  get: function() {
    var def = $.ajax({
      url: 'http://www7.atwiki.jp/commando-matome/pages/11.html',
      dataType: 'html',
      context: this
    })
    .done(function(data) {
      var analectsText = this.createAnalectsText(data);
      var frag = this.createAnalectsNode(analectsText);
      this.setAnalects(frag);
      frag = null;
    })
    .fail(function() {
      console.error('fail');
    });
    return def;
  },

  /**
   * @returns {DocumentFragment}
   */
  createWorkspace: function() {
    var frag = document.createDocumentFragment();
    var article = document.createElement('article');
    frag.appendChild(article);
    return frag;
  },

  /**
   * @param {string} data
   * @returns {string}
   */
  createAnalectsText: function(data) {
    var m = data.match(/^.*<body[^>]*?>([\s\S]*)<\/body>.*$/im) || [];
    var buf = (m.length > 0) ? m[1] : '';
    buf = buf
      .stripTags('script', 'style', 'br')
      .replace(/^[\t 　]+/mg, '')
      .replace(/[\r\n]+/mg, '\n');

    var frag = this.createWorkspace();
    frag.firstChild.innerHTML = buf;

    var id = 'wikibody',
        body = frag.querySelector('#' + id),
        children = frag.querySelectorAll('#' + id + '>*');

    for (var i = 0, l = children.length; i < l; i++) {
      body.removeChild(children[i]);
    }

    var ret = body.innerHTML.trim();
    frag = null;

    return ret;
  },

  /**
   * @param {string} html
   * @returns {DocumentFragment}
   */
  createAnalectsNode: function(html) {
    var buf = html
      .replace(/^・/gm, '<dd>')
      .replace(/^[*]+/gm, '<dt>');
    buf = ['<dl><dt>', buf, '</dl>'].join('');
    var frag = this.createWorkspace();
    frag.firstChild.innerHTML = buf;
    return frag;
  },

  /**
   * @param {DocumentFragment} frag
   */
  setAnalects: function(frag) {
    var idx = [],
      map = [],
      lists = frag.querySelectorAll('dl > *'),
      beforTitle = '';

    Array.prototype.slice.call(lists).forEach(function(elm) {
      var textContent = elm.textContent.trim();
      if (elm.tagName === 'DT') {
        var m = textContent.match(/([\u30A0-\u30FF]+)語録/) || [];
        beforTitle = (m.length > 0) ? m[1] : null;
      } else {
        if (beforTitle !== null) {
          textContent = textContent.replace(/\n/g, ' ');
          map.push({
            'title': beforTitle,
            'text': textContent
          });
          idx.push(textContent.zenkaku('k'));
        }
      }
    });

    cache.analects = map.clone();
    cache.idx = idx.clone();
  }

};

module.exports = Resource;

},{"./cache.js":2}],6:[function(require,module,exports){
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

},{}]},{},[4]);

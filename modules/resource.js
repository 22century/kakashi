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

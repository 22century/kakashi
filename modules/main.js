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

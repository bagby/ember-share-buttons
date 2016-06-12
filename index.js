/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-share-buttons',

  included: function(app) {
    this._super.included(app);

    app.import('vendor/share-buttons.css');
  }
};

// Lightweight stub for Google Analytics and Google Tag Manager to prevent page crashes
(function() {
  'use strict';
  
  // Define empty dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Google Analytics stub
  var gaObject = window.GoogleAnalyticsObject || 'ga';
  window[gaObject] = window[gaObject] || function() {
    (window[gaObject].q = window[gaObject].q || []).push(arguments);
  };
  window[gaObject].l = +new Date();
  
  // Universal Analytics stubs
  if (!window.ga.create) {
    window.ga.create = function() {
      return {
        get: function() {},
        set: function() {},
        send: function() {}
      };
    };
    window.ga.getByName = function() {
      return {
        get: function() {},
        set: function() {},
        send: function() {}
      };
    };
    window.ga.getAll = function() { return []; };
    window.ga.remove = function() {};
  }

  // Google Tag Manager / Tag Services stubs
  window.google_tag_manager = window.google_tag_manager || {};
  window.google_tag_data = window.google_tag_data || {};
  window.googletag = window.googletag || {};
  window.googletag.cmd = window.googletag.cmd || [];
  window.googletag.cmd.push = function(fn) {
    if (typeof fn === 'function') {
      try { fn(); } catch (e) {}
    }
    return 1;
  };
})();

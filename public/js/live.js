// Near-real-time manage refresh (data-architecture plan, requirement 4).
// Subscribes to /manage/events (SSE). When another session mutates content,
// the current view reloads so admins always see live data. Guards:
//  - never reload while the user is typing in a form field
//  - never reload within 5s of the page loading or of a previous reload
//  - events are debounced (burst of mutations -> single reload)
(function () {
  'use strict';
  if (!window.EventSource) return;

  var lastReload = Date.now();
  var pending = null;

  function userIsTyping() {
    var el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  }

  function reloadSoon() {
    if (pending) return;
    pending = setTimeout(function () {
      pending = null;
      if (userIsTyping() || Date.now() - lastReload < 5000) return;
      lastReload = Date.now();
      window.location.reload();
    }, 800);
  }

  var source = new EventSource('/manage/events');
  source.addEventListener('data-changed', reloadSoon);
  source.onerror = function () { /* EventSource retries automatically */ };
})();

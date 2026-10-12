// CV print support (CSP-safe: external file, no inline handlers — the
// production CSP sets script-src-attr 'none').
(function () {
  'use strict';
  var button = document.getElementById('print-cv');
  if (button) {
    button.addEventListener('click', function () {
      window.print();
    });
  }
})();

/* Petits compléments pour les vieux navigateurs (vieil iPad, Safari 9+). */
(function(){
  if (!String.prototype.padStart) String.prototype.padStart = function(n, s){ var t = String(this); s = s === undefined ? ' ' : String(s); while (t.length < n) t = s + t; return t.slice(-Math.max(n, String(this).length)); };
  if (!String.prototype.normalize) String.prototype.normalize = function(){ return String(this); };
  if (!Object.entries) Object.entries = function(o){ return Object.keys(o).map(function(k){ return [k, o[k]]; }); };
  if (!Object.values) Object.values = function(o){ return Object.keys(o).map(function(k){ return o[k]; }); };
  if (!Array.prototype.flatMap) Array.prototype.flatMap = function(f, t){ return Array.prototype.concat.apply([], this.map(f, t)); };
  if (!Array.prototype.includes) Array.prototype.includes = function(v){ return this.indexOf(v) >= 0; };
  if (!String.prototype.includes) String.prototype.includes = function(v){ return this.indexOf(v) >= 0; };
  if (!String.prototype.startsWith) String.prototype.startsWith = function(v){ return this.indexOf(v) === 0; };
  if (window.Element && !Element.prototype.matches) Element.prototype.matches = Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector;
  if (window.Element && !Element.prototype.closest) Element.prototype.closest = function(s){ var el = this; while (el && el.nodeType === 1) { if (el.matches(s)) return el; el = el.parentNode; } return null; };
  if (!window.requestAnimationFrame) window.requestAnimationFrame = function(f){ return setTimeout(f, 16); };
})();

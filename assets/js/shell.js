/* Shared shell helpers for Internal Tools: logo, icons, top bar, toasts.
   Usage in any page (after gate.js):
     <script src="<path-to-root>/assets/js/shell.js"></script>
     <div id="hub-bar" data-title="My Tool"></div>      <- optional top bar
   Then call XMTools.toast('Saved') or XMTools.icon('chart') where needed. */
(function () {
  var script = document.currentScript;
  var ROOT = new URL('../../', script.src).href;          // site root
  var XM = window.XMTools = window.XMTools || {};
  XM.root = ROOT;
  XM.url = function (p) { return new URL(p, ROOT).href; };
  XM.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  XM.logo = function (onDark) {
    var c = onDark ? '#fff' : '#0b0d10';
    return '<svg viewBox="0 0 168 30" role="img" aria-label="XMTRADING"><path fill="#e5373f" d="M1 4h5.5L13 15 6.5 26H1l6.5-11z"/><text x="12" y="23" fill="' + c +
      '" font-family="Poppins,Inter,Arial,sans-serif" font-weight="800" font-style="italic" font-size="22.5" letter-spacing="-1.2">XMTRADING</text></svg>';
  };

  /* Stroke icons on a 24 grid. Add new names here when a tool needs one. */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    chart: '<path d="M4 19V5M4 19h16M8 15l3-4 3 3 5-7"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.5 5.5"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 4 5.8 4 9s-1.4 6.2-4 9c-2.6-2.8-4-5.8-4-9s1.4-6.2 4-9z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.3 2.3 3.8 5.2"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19V5"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    spark: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  XM.icon = function (name, cls) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' +
      (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true">' + (ICONS[name] || ICONS.grid) + '</svg>';
  };

  XM.toast = function (msg) {
    var host = document.querySelector('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  };

  /* Top bar: logo, optional tool title, link back to the hub, sign-out. */
  function bar() {
    var el = document.getElementById('hub-bar');
    if (!el) return;
    var title = el.getAttribute('data-title');
    var home = el.getAttribute('data-home') !== null;
    el.className = 'hub-bar';
    el.innerHTML =
      '<div class="in">' +
        '<a class="xm-logo" href="' + XM.url('index.html') + '" aria-label="XMTRADING Internal Tools home">' + XM.logo(true) + '</a>' +
        '<span class="sub">Internal AI Tools</span>' +
        (title ? '<span class="crumb">' + XM.esc(title) + '</span>' : '') +
        '<div class="right">' +
          (home ? '' : '<a class="lnk" href="' + XM.url('index.html') + '">All tools</a>') +
          '<button class="lnk" type="button" id="hub-signout">Sign out</button>' +
        '</div>' +
      '</div>';
    document.getElementById('hub-signout').addEventListener('click', function () { if (window.XMGate) XMGate.signOut(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar); else bar();
})();

/* SEO Agent - decision-oriented dashboard. Data: data/snapshot.json. No secrets, no third-party scripts. */
(function () {
  'use strict';
  var X = window.XMTools, esc = X.esc;
  var app = document.getElementById('app');
  var D = null, lastView = '';

  var VIEWS = [['overview', 'Overview'], ['opportunities', 'Opportunities'], ['evidence', 'Evidence'], ['sources', 'Data sources']];
  var EVIDENCE = [['keywords', 'Keywords'], ['competitors', 'Competitors'], ['pages', 'Site pages']];
  var DIST = { close: 1.25, mid: 1, far: 0.8 };
  var DIST_LABEL = { close: 'Close to registration', mid: 'Mid-funnel', far: 'Awareness' };
  var LEVEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
  var WAVES = [['now', 'Now', 'highest priority'], ['next', 'Next', 'plan after Now'], ['later', 'Later', 'revisit when data improves']];

  /* ---------- helpers ---------- */
  function n(v) { return Number(v).toLocaleString('en-US'); }
  function ic(name) { return X.icon(name); }
  function srcPill(s) { return '<span class="seo-src ' + (s === 'Similarweb' ? 'sim' : s === 'Ahrefs' ? 'ahr' : s === 'System' ? 'sys' : '') + '">' + esc(s) + '</span>'; }
  function score(o) { return Math.round(o.impact * o.confidence / o.effort * DIST[o.distance] / 18.75 * 100); }
  function wave(s) { return s >= 35 ? 'now' : s >= 20 ? 'next' : 'later'; }
  function tier(s) { return s >= 35 ? '' : s >= 20 ? 'mid' : 'low'; }
  function opps() { return D.opportunities.slice().sort(function (a, b) { return score(b) - score(a); }); }
  function byId(id) { return D.opportunities.filter(function (o) { return o.id === id; })[0]; }
  function head(eyebrow, title, text, extra) {
    return '<div class="page-head seo-ph"><div><div class="eyebrow">' + esc(eyebrow) + '</div><h1 class="h-l">' + esc(title) + '</h1>' + (text ? '<p>' + esc(text) + '</p>' : '') + '</div>' + (extra || '') + '</div>';
  }
  function oppLink(id) { return '<button class="seo-link" data-go="opportunities/' + id + '">' + id + '</button>'; }
  function tbl(cols, rows, widths) {
    var cg = widths ? '<colgroup>' + widths.map(function (w) { return '<col style="width:' + w + '">'; }).join('') + '</colgroup>' : '';
    return '<div class="card tbl-wrap"><table class="tbl seo-t">' + cg + '<thead><tr>' + cols.map(function (c) { return '<th' + (c[1] ? ' class="num"' : '') + '>' + esc(c[0]) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  function renderTabs(view) {
    document.getElementById('tabs').innerHTML = VIEWS.map(function (v) {
      return '<button class="seo-tab' + (v[0] === view ? ' on' : '') + '" data-go="' + v[0] + '">' + esc(v[1]) + (v[0] === 'opportunities' ? '<span class="seo-count">' + D.opportunities.length + '</span>' : '') + '</button>';
    }).join('');
    document.getElementById('ctx').innerHTML = esc(D.meta.market) + ' · <b>' + esc(D.meta.period) + '</b> <span class="tag amber">Estimated, not measured</span>';
  }

  /* ---------- overview ---------- */
  function viewOverview() {
    var sw = D.similarweb, nb = sw.nonBrandedShare, list = opps();
    var nowCount = list.filter(function (o) { return wave(score(o)) === 'now'; }).length;
    var h = '<section class="seo-hero"><div class="seo-hero-grid"><div><div class="eyebrow">' + esc(D.meta.market) + ' · ' + esc(D.meta.period) + ' · goal: ' + esc(D.meta.goal.toLowerCase()) + '</div>' +
      '<h1>XM wins on brand. Growth now depends on non-brand search.</h1>' +
      '<p>Only ' + nb + '% of estimated organic clicks come from people who did not already search for XM. Opportunities are ranked by likely effect on registrations, confidence and effort.</p></div>' +
      '<div class="seo-donut-wrap"><div class="seo-donut" style="--p:' + nb + '"><div><b>' + nb + '%</b><span>non-brand</span></div></div>' +
      '<p class="seo-dleg"><b>+' + sw.nonBrandedDelta + 'pp</b> vs July. The other ' + (100 - nb).toFixed(1) + '% is brand, mostly existing customers logging in.</p></div></div>' +
      '<div class="seo-hstats">' +
      '<div class="seo-hstat"><div class="k">Estimated organic clicks</div><div class="v">' + esc(sw.organicClicks) + '</div><div class="d good">+' + sw.organicClicksDelta + '% vs July</div></div>' +
      '<div class="seo-hstat"><div class="k">Top-3 keywords</div><div class="v">' + sw.top3Keywords + '</div><div class="d good">+' + sw.top3Delta + ' vs July</div></div>' +
      '<div class="seo-hstat"><div class="k">Opportunities</div><div class="v">' + list.length + '</div><div class="d">' + nowCount + ' to do now</div></div>' +
      '<div class="seo-hstat alert"><div class="k">Registrations</div><div class="v sm">Not connected</div><div class="d warn">See Data sources</div></div>' +
      '</div></section>';

    h += '<div class="seo-sec"><div class="seo-sec-h"><div><h2>Do this next</h2><p style="color:var(--mut);font-size:var(--fs-s);margin-top:2px">The three highest-scoring opportunities.</p></div>' +
      '<button class="seo-link" data-go="opportunities">All ' + list.length + ' opportunities ' + ic('arrow') + '</button></div><div class="seo-next">' +
      list.slice(0, 3).map(function (o) {
        var s = score(o);
        return '<button class="seo-card-go" data-go="opportunities/' + o.id + '"><span class="top"><span class="seo-score ' + tier(s) + '">' + s + '</span><span><span class="seo-id">' + o.id + '</span><br><span class="tag grey">' + esc(o.type) + '</span></span></span>' +
          '<h3>' + esc(o.title) + '</h3><p>' + esc(o.summary) + '</p><span class="go">View details ' + ic('arrow') + '</span></button>';
      }).join('') + '</div></div>';
    return h;
  }

  /* ---------- opportunities ---------- */
  function pips(v, max) {
    var h = '<span class="pips">';
    for (var i = 1; i <= max; i++) h += '<i class="' + (i <= v ? 'on' : '') + '"></i>';
    return h + '</span>';
  }
  function oppRow(o, sel) {
    var s = score(o);
    return '<button class="seo-row ' + tier(s) + (sel ? ' sel' : '') + '" data-go="opportunities/' + o.id + '"><span class="n">' + s + '</span><span class="t"><b>' + esc(o.title) + '</b><small>' + o.id + ' · ' + esc(o.type) + '</small></span></button>';
  }
  function oppDetail(o) {
    var s = score(o), w = wave(s);
    return '<div class="card seo-detail"><span class="seo-id">' + o.id + '</span><h2>' + esc(o.title) + '</h2>' +
      '<div class="tags"><span class="tag">' + w.charAt(0).toUpperCase() + w.slice(1) + '</span><span class="tag grey">' + esc(o.type) + '</span><span class="tag grey">Suggested owner: ' + esc(o.owner) + '</span></div>' +
      '<div class="seo-factors"><div class="seo-big"><div><div class="v">' + s + '</div><div class="k">Priority</div></div></div>' +
      '<div class="seo-factor"><div class="k">Impact</div><div class="v">' + o.impact + ' of 5</div>' + pips(o.impact, 5) + '</div>' +
      '<div class="seo-factor"><div class="k">Confidence</div><div class="v">' + LEVEL[o.confidence] + '</div>' + pips(o.confidence, 3) + '</div>' +
      '<div class="seo-factor"><div class="k">Effort</div><div class="v">' + LEVEL[o.effort] + '</div>' + pips(o.effort, 3) + '</div>' +
      '<div class="seo-factor"><div class="k">Distance</div><div class="v">' + esc(DIST_LABEL[o.distance]) + '</div>' + pips(o.distance === 'close' ? 3 : o.distance === 'mid' ? 2 : 1, 3) + '</div></div>' +
      '<details class="seo-score-info"><summary>How priority is scored</summary><p>Impact (1-5) × confidence (1-3) ÷ effort (1-3), × 1.25 if close to registration or × 0.8 if it only builds awareness, scaled to 0-100. Now is 35 and above, Next 20 to 34, Later below 20. It ranks opportunities; it does not forecast registrations.</p></details>' +
      '<span class="seo-h">Why it matters</span><p class="seo-lead">' + esc(o.summary) + '</p>' +
      '<span class="seo-h">Evidence</span><ul class="seo-ev">' + o.evidence.map(function (e) { return '<li>' + srcPill(e[0]) + '<span>' + esc(e[1]) + '</span></li>'; }).join('') + '</ul>' +
      '<span class="seo-h">Recommended action</span><div class="seo-action">' + ic('spark') + '<div>' + esc(o.action) + '</div></div>' +
      '<span class="seo-h">How we will know it worked</span><p class="seo-plain">' + esc(o.validation) + '</p></div>';
  }
  function viewOpps(arg) {
    var list = opps(), sel = byId(arg) || list[0];
    var rows = WAVES.map(function (w) {
      var r = list.filter(function (o) { return wave(score(o)) === w[0]; });
      return r.length ? '<div class="seo-grp"><h4>' + w[1] + ' <span>' + w[2] + '</span></h4>' + r.map(function (o) { return oppRow(o, o.id === sel.id); }).join('') + '</div>' : '';
    }).join('');
    return head('Opportunities', 'What to do next, and why', 'Each item shows its evidence, effort and how we will check it worked. None of it predicts registrations until Search Console and sign-up events are connected.') +
      '<div class="seo-opps"><aside class="card seo-list">' + rows + '</aside><section>' + oppDetail(sel) + '</section></div>' +
      '<div class="seo-sec"><header><div><h2>Not pursuing</h2><p>Topics with demand that do not fit XM, so we do not build for them.</p></div></header><div class="seo-no">' +
      D.notPursuing.map(function (p) { return '<div class="card"><b>' + esc(p.title) + '</b><p>' + esc(p.reason) + '</p></div>'; }).join('') + '</div></div>';
  }

  /* ---------- evidence ---------- */
  function kwRow(k) {
    var pos = k.position ? '<span class="seo-pos ' + (k.position <= 3 ? 'top' : !k.branded && k.position <= 15 ? 'hot' : '') + '">' + k.position + '</span>' : '<span class="mut">Not ranking</span>';
    return '<tr><td><b>' + esc(k.keyword) + '</b>' + (k.scope === 'review' ? ' <span class="tag amber">Check fit</span>' : '') + '</td><td>' + srcPill(k.source) + '</td><td class="num">' + n(k.volume) + '</td><td class="num">' + (k.clicks != null ? n(k.clicks) : '-') + '</td><td>' + pos + '</td><td class="num">' + (k.difficulty != null ? k.difficulty : '-') + '</td><td>' + esc(k.note || '') + '</td></tr>';
  }
  function kwGroup(title, sub, rows) {
    return rows.length ? '<tr class="seo-gr"><td colspan="7"><b>' + esc(title) + '</b>' + esc(sub) + '</td></tr>' + rows.map(kwRow).join('') : '';
  }
  function viewKeywords() {
    var K = D.keywords, nb = K.filter(function (k) { return !k.branded; });
    var rows = [
      kwGroup('Striking distance', 'Ranking 4 to 15 for a non-branded search. The cheapest place to gain clicks.', nb.filter(function (k) { return k.position >= 4 && k.position <= 15; })),
      kwGroup('Demand with no ranking', 'Searches XM does not rank for yet.', nb.filter(function (k) { return !k.position; })),
      kwGroup('Already top 3', 'Non-branded searches XM already wins. Defend and extend.', nb.filter(function (k) { return k.position && k.position <= 3; })),
      kwGroup('Brand', 'Mostly existing customers. Protect, but it does not bring new customers.', K.filter(function (k) { return k.branded; }))
    ];
    return '<p class="seo-legend">Difficulty is a 0-100 score from Similarweb; higher is harder. A dash means the source does not provide the value.</p>' +
      tbl([['Keyword'], ['Source'], ['Searches / mo', 1], ['Est. clicks', 1], ['XM position'], ['Difficulty', 1], ['Note']], rows, ['22%', '12%', '12%', '10%', '11%', '9%', '24%']);
  }

  function viewCompetitors() {
    var h = '<div class="card">' + D.competitors.map(function (c) {
      return '<div class="seo-crow"><div class="who"><span class="seo-av ' + esc(c.tone) + '">' + esc(c.name.slice(0, 2).toUpperCase()) + '</span><div><b>' + esc(c.name) + '</b><small>' + esc(c.domain) + '</small></div></div><p>' + esc(c.takeaway) + '</p><span class="tag ' + (c.threat === 'High' ? 'red' : 'amber') + '">' + esc(c.threat) + ' threat</span></div>';
    }).join('') + '</div>';
    h += '<div class="seo-sec"><div class="card seo-split"><h3>Share of competitive clicks</h3><p class="sub">XM and its closest organic competitors, ' + esc(D.meta.period) + '</p><div class="seo-bars">' +
      D.shares.map(function (s) { return '<div class="seo-barrow"><span' + (s.me ? ' style="font-weight:600"' : '') + '>' + esc(s.name) + '</span><span class="seo-meter ' + (s.me ? '' : 'mut') + '"><i style="width:' + (s.value / 50 * 100).toFixed(1) + '%"></i></span><b>' + s.value + '%</b></div>'; }).join('') + '</div></div></div>';
    h += '<div class="seo-sec"><header><div><h2>New competitor pages worth reacting to</h2><p>Recently detected pages and the opportunity they feed.</p></div></header>' +
      tbl([['Competitor'], ['Page'], ['Topic'], ['Relevance'], ['Opportunity']], D.newPages.map(function (p) {
        var tone = p.relevance === 'Critical' ? 'red' : p.relevance === 'High' ? 'amber' : p.relevance === 'Medium' ? 'blue' : 'grey';
        return '<tr><td>' + esc(p.domain) + '</td><td class="seo-path">' + esc(p.path) + '</td><td>' + esc(p.tag) + '</td><td><span class="tag ' + tone + '">' + esc(p.relevance) + '</span></td><td>' + (p.opp ? oppLink(p.opp) : '<span class="mut">None planned</span>') + '</td></tr>';
      }), ['20%', '30%', '20%', '14%', '16%']) + '</div>';
    return h;
  }

  function pgRow(p) {
    var tone = p.assessment === 'Strong' ? '' : p.assessment === 'Expand' ? 'blue' : p.assessment === 'Review' ? 'amber' : (p.assessment === 'Misrouted' || p.assessment === 'Mismatch') ? 'red' : 'grey';
    return '<tr><td class="seo-path">' + esc(p.path) + '</td><td>' + esc(p.category) + '</td><td>' + esc(p.keyword) + '</td><td class="num">' + n(Math.round(p.clicks)) + '</td><td class="num">' + Number(p.share).toFixed(2) + '%</td><td><span class="tag ' + tone + '">' + esc(p.assessment) + '</span>' + (p.assessment === 'Misrouted' ? ' ' + oppLink('OPP-01') : '') + '</td></tr>';
  }
  function viewPages() {
    var inv = D.pageInventory, cols = [['Page'], ['Category'], ['Top keyword'], ['Est. clicks', 1], ['Share', 1], ['Assessment']], w = ['31%', '12%', '19%', '11%', '9%', '18%'];
    var attn = inv.filter(function (p) { return ['Misrouted', 'Mismatch', 'Review', 'Expand'].indexOf(p.assessment) >= 0; });
    return '<div class="card seo-split"><h3>Concentration</h3><p class="sub">10 of ' + D.similarweb.landingPages + ' landing pages drive ' + D.similarweb.top10PagesShare + '% of estimated clicks, mostly brand and login pages.</p><span class="seo-meter"><i style="width:' + D.similarweb.top10PagesShare + '%"></i></span></div>' +
      '<div class="seo-sec"><header><div><h2>Pages that need a decision</h2><p>Misrouted, mismatched, under review or worth expanding.</p></div></header>' + tbl(cols, attn.map(pgRow), w) + '</div>' +
      '<details class="seo-all"><summary>All ' + inv.length + ' pages reviewed</summary>' + tbl(cols, inv.map(pgRow), w) + '</details>';
  }

  function viewEvidence(arg) {
    var sub = EVIDENCE.filter(function (e) { return e[0] === arg; })[0] ? arg : 'keywords';
    var body = sub === 'keywords' ? viewKeywords() : sub === 'competitors' ? viewCompetitors() : viewPages();
    var tabs = '<div class="pill-tabs">' + EVIDENCE.map(function (e) { return '<button data-go="evidence/' + e[0] + '" class="' + (e[0] === sub ? 'on' : '') + '">' + esc(e[1]) + '</button>'; }).join('') + '</div>';
    return head('Evidence', 'The data behind the opportunities', 'Use it to check a recommendation, not to browse.', tabs) + body;
  }

  /* ---------- data sources ---------- */
  function viewSources() {
    var sw = D.similarweb, ah = D.ahrefs;
    return head('Data sources', 'What this tool knows, and what it does not', 'The two missing sources are what turn estimates into measured results.') +
      '<div class="card">' + D.sources.map(function (s) {
        var tone = s.status === 'missing' ? 'red' : s.status === 'tested' ? 'amber' : '';
        return '<div class="seo-srow ' + tone + '"><span class="dot"></span><div><b>' + esc(s.name) + '</b><small>' + (s.freshness !== '-' ? esc(s.freshness) + ' · ' : '') + esc(s.coverage) + '</small></div><p>' + esc(s.caveat) + '</p><span class="tag ' + tone + '">' + esc(s.label) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="seo-sec"><header><div><h2>Two sources, two answers</h2><p>Totals differ because methods differ. Read them as ranges; Search Console will be the ground truth.</p></div></header>' +
      tbl([['Measure'], ['Similarweb', 1], ['Ahrefs', 1]], [
        '<tr><td>Data from</td><td class="num">' + esc(D.meta.period) + '</td><td class="num">' + esc(ah.tested) + '</td></tr>',
        '<tr><td>Organic keywords</td><td class="num">' + n(sw.organicKeywords) + '</td><td class="num">' + n(ah.organicKeywords) + '</td></tr>',
        '<tr><td>Top-3 keywords</td><td class="num">' + n(sw.top3Keywords) + '</td><td class="num">' + n(ah.top3Keywords) + '</td></tr>',
        '<tr><td>Organic traffic</td><td class="num">' + esc(sw.organicClicks) + '</td><td class="num">' + esc(ah.organicTraffic) + '</td></tr>',
        '<tr><td>Live backlinks</td><td class="num">n/a</td><td class="num">' + esc(ah.liveBacklinks) + '</td></tr>'], ['50%', '25%', '25%']) + '</div>' +
      '<div class="seo-sec"><div class="seo-cta"><div><b>Next step: connect Search Console and sign-up events</b><p>Then replace this snapshot with a scheduled job that commits sanitised JSON. API keys stay in repository secrets, never in the browser.</p></div>' +
      '<button class="btn btn-primary" data-go="opportunities/OPP-04">See OPP-04</button></div></div>';
  }

  /* ---------- router ---------- */
  var RENDER = { overview: viewOverview, opportunities: viewOpps, evidence: viewEvidence, sources: viewSources };
  var LEGACY = { keywords: 'evidence/keywords', competitors: 'evidence/competitors', pages: 'evidence/pages', trends: 'overview' };

  function render() {
    var p = location.hash.replace('#', '').split('/');
    if (LEGACY[p[0]]) { location.replace('#' + LEGACY[p[0]]); return; }
    var view = RENDER[p[0]] ? p[0] : 'overview';
    renderTabs(view);
    app.innerHTML = RENDER[view](p[1] || '');
    if (view !== lastView) window.scrollTo(0, 0);
    lastView = view;
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (t) location.hash = t.dataset.go;
  });
  window.addEventListener('hashchange', render);

  fetch('data/snapshot.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
    D = j; render();
  }).catch(function () {
    app.innerHTML = '<div class="empty">Could not load data/snapshot.json. Open this tool through the hub or a local web server.</div>';
  });
})();

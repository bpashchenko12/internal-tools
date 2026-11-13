/* SEO Agent - decision-oriented dashboard.
   Data: data/similarweb.json (collected by collect_similarweb.py) + data/snapshot.json (curated).
   No secrets, no third-party scripts. */
(function () {
  'use strict';
  var X = window.XMTools, esc = X.esc;
  var app = document.getElementById('app');
  var D = null, SW = null, lastView = '', oppFilter = 'all';

  var VIEWS = [['overview', 'Overview'], ['opportunities', 'Opportunities'], ['evidence', 'Evidence'], ['sources', 'Data sources']];
  var EVIDENCE = [['keywords', 'Keywords'], ['competitors', 'Competitors'], ['pages', 'Site pages']];
  var DIST = { close: 1.25, mid: 1, far: 0.8 };
  var DIST_LABEL = { close: 'Close to registration', mid: 'Mid-funnel', far: 'Awareness' };
  var LEVEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
  var WAVES = [['now', 'Now', 'highest priority'], ['next', 'Next', 'plan after Now'], ['later', 'Later', 'revisit when data improves']];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- helpers ---------- */
  function n(v) { return Number(v).toLocaleString('en-US'); }
  function kfmt(v) {
    v = Math.round(v);
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return String(v);
  }
  function mShort(m) { return MON[+m.slice(5, 7) - 1]; }
  function mLabel(m) { return mShort(m) + ' ' + m.slice(0, 4); }
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
  function spark(vals, labels) {
    var mx = Math.max.apply(null, vals) || 1;
    var desc = vals.map(function (v, i) { return labels[i] + ' ' + kfmt(v); }).join(', ');
    return '<span class="seo-spark" role="img" aria-label="' + esc(desc) + '" title="' + esc(desc) + '">' + vals.map(function (v, i) {
      return '<i' + (i === vals.length - 1 ? ' class="cur"' : '') + ' style="height:' + Math.max(10, Math.round(v / mx * 100)) + '%"></i>';
    }).join('') + '</span>';
  }
  function change(cur, prev, label, unit) {
    var d = prev ? (cur - prev) / prev * 100 : 0;
    var txt = unit === 'pp' ? (cur - prev >= 0 ? '+' : '') + (cur - prev).toFixed(1) + 'pp' : unit === 'abs' ? (cur - prev >= 0 ? '+' : '') + (cur - prev) : (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
    var up = unit === 'pp' || unit === 'abs' ? cur - prev : d;
    return '<div class="d ' + (up > 0 ? 'good' : up < 0 ? 'bad' : '') + '">' + txt + ' vs ' + esc(label) + '</div>';
  }
  function compName(domain) {
    var c = D.competitors.filter(function (x) { return x.domain === domain; })[0];
    return c ? c.name : domain;
  }
  function T() { return SW.trend; }
  function cur() { return T()[T().length - 1]; }
  function prev() { return T()[T().length - 2]; }
  function first() { return T()[0]; }
  function months() { return SW.months.map(mShort); }

  function renderTabs(view) {
    document.getElementById('tabs').innerHTML = VIEWS.map(function (v) {
      return '<button class="seo-tab' + (v[0] === view ? ' on' : '') + '" data-go="' + v[0] + '">' + esc(v[1]) + (v[0] === 'opportunities' ? '<span class="seo-count">' + D.opportunities.length + '</span>' : '') + '</button>';
    }).join('');
    document.getElementById('ctx').innerHTML = esc(D.meta.market) + ' · <b>' + esc(D.meta.period) + '</b>';
  }

  /* ---------- overview ---------- */
  function viewOverview() {
    var c = cur(), p = prev(), f = first(), list = opps(), pl = mShort(p.month);
    var nowCount = list.filter(function (o) { return wave(score(o)) === 'now'; }).length;
    var clicks = T().map(function (t) { return t.clicks; }), nbc = T().map(function (t) { return t.nonBrandedClicks; }), t3 = T().map(function (t) { return t.top3; });
    var h = '<section class="seo-hero"><div class="seo-hero-grid"><div><div class="eyebrow">' + esc(D.meta.market) + ' · ' + esc(D.meta.period) + ' · goal: ' + esc(D.meta.goal.toLowerCase()) + '</div>' +
      '<h1>XM wins on brand. Growth now depends on non-brand search.</h1>' +
      '<p>Only ' + c.nonBrandedShare + '% of estimated organic clicks come from people who did not already search for XM. Opportunities are ranked by likely effect on registrations, confidence and effort.</p></div>' +
      '<div class="seo-donut-wrap"><div class="seo-donut" style="--p:' + c.nonBrandedShare + '"><div><b>' + c.nonBrandedShare + '%</b><span>non-brand</span></div></div>' +
      '<p class="seo-dleg"><b>' + (c.nonBrandedShare - p.nonBrandedShare >= 0 ? '+' : '') + (c.nonBrandedShare - p.nonBrandedShare).toFixed(1) + 'pp</b> vs ' + esc(pl) + ', ' + (c.nonBrandedShare - f.nonBrandedShare >= 0 ? '+' : '') + (c.nonBrandedShare - f.nonBrandedShare).toFixed(1) + 'pp vs ' + esc(mShort(f.month)) + '. The other ' + (100 - c.nonBrandedShare).toFixed(1) + '% is brand, mostly existing customers logging in.</p></div></div>' +
      '<div class="seo-hstats">' +
      '<div class="seo-hstat"><div class="k">Estimated organic clicks</div><div class="v">' + kfmt(c.clicks) + '</div>' + change(c.clicks, p.clicks, pl) + spark(clicks, months()) + '</div>' +
      '<div class="seo-hstat"><div class="k">Non-brand clicks</div><div class="v">' + kfmt(c.nonBrandedClicks) + '</div>' + change(c.nonBrandedClicks, p.nonBrandedClicks, pl) + spark(nbc, months()) + '</div>' +
      '<div class="seo-hstat"><div class="k">Top-3 keywords</div><div class="v">' + c.top3 + '</div>' + change(c.top3, p.top3, pl, 'abs') + spark(t3, months()) + '</div>' +
      '<div class="seo-hstat"><div class="k">Opportunities</div><div class="v">' + list.length + '</div><div class="d">' + nowCount + ' to do now</div></div>' +
      '</div></section>';

    var sg = signals();
    if (sg.length) h += '<div class="seo-sec"><div class="seo-sec-h"><div><h2>Three signals worth acting on</h2><p class="seo-sub">Calculated from the data below, not written by hand.</p></div></div><div class="seo-signals">' +
      sg.map(function (s) { return '<button class="seo-sig" data-go="opportunities/' + s[3] + '"><b class="v">' + esc(s[0]) + '</b><span class="k">' + esc(s[1]) + '</span><span class="d">' + esc(s[2]) + '</span><span class="go">' + s[3] + ' ' + ic('arrow') + '</span></button>'; }).join('') + '</div></div>';

    h += '<div class="seo-sec"><div class="seo-sec-h"><div><h2>Do this next</h2><p class="seo-sub">The three highest-scoring opportunities.</p></div>' +
      '<button class="seo-link" data-go="opportunities">All ' + list.length + ' opportunities ' + ic('arrow') + '</button></div><div class="seo-next">' +
      list.slice(0, 3).map(function (o) {
        var s = score(o);
        return '<button class="seo-card-go" data-go="opportunities/' + o.id + '"><span class="top"><span class="seo-score ' + tier(s) + '">' + s + '</span><span><span class="seo-id">' + o.id + '</span><br><span class="tag grey">' + esc(o.type) + '</span></span></span>' +
          '<h3>' + esc(o.title) + '</h3><p>' + esc(o.summary) + '</p><span class="seo-meta">Impact ' + o.impact + '/5 · Effort ' + LEVEL[o.effort] + '</span><span class="go">View details ' + ic('arrow') + '</span></button>';
      }).join('') + '</div></div>';

    var mv = SW.movers;
    function mvRows(arr, sign) {
      var mx = Math.max.apply(null, arr.map(function (m) { return Math.abs(m.delta); })) || 1;
      return arr.slice(0, 6).map(function (m) {
        var pos = m.posTo ? '#' + m.posTo : m.posFrom ? 'was #' + m.posFrom : '';
        return '<div class="seo-mv"><div class="w"><b>' + esc(m.keyword) + '</b><small>' + esc(m.url.replace(/^(https?:\/\/)?/, '')) + (pos ? ' · ' + esc(pos) : '') + '</small></div>' +
          '<span class="seo-meter ' + sign + '"><i style="width:' + Math.round(Math.abs(m.delta) / mx * 100) + '%"></i></span><b class="v">' + (m.delta > 0 ? '+' : '-') + n(Math.abs(m.delta)) + '</b></div>';
      }).join('');
    }
    h += '<div class="seo-sec"><header><div><h2>What changed since ' + esc(mShort(mv.from)) + '</h2><p>Biggest non-brand click changes, ' + esc(mShort(mv.from)) + ' to ' + esc(mShort(mv.to)) + '. Queries containing "XM" are left out.</p></div></header>' +
      '<div class="seo-two"><div class="card seo-split"><h3>Gained</h3>' + mvRows(mv.gained, '') + '</div><div class="card seo-split"><h3>Lost</h3>' + mvRows(mv.lost, 'bad') + '</div></div></div>';
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
    return '<div class="card seo-detail" id="opp-detail"><span class="seo-id">' + o.id + '</span><h2>' + esc(o.title) + '</h2>' +
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
    var all = opps(), sel = byId(arg) || all[0];
    var types = ['all'];
    all.forEach(function (o) { if (types.indexOf(o.type) < 0) types.push(o.type); });
    var list = oppFilter === 'all' ? all : all.filter(function (o) { return o.type === oppFilter; });
    var chips = '<div class="seo-chips" role="group" aria-label="Filter by type">' + types.map(function (t) {
      var c = t === 'all' ? all.length : all.filter(function (o) { return o.type === t; }).length;
      return '<button class="chip' + (t === oppFilter ? ' on' : '') + '" data-filter="' + esc(t) + '">' + (t === 'all' ? 'All' : esc(t)) + ' ' + c + '</button>';
    }).join('') + '</div>';
    var rows = WAVES.map(function (w) {
      var r = list.filter(function (o) { return wave(score(o)) === w[0]; });
      return r.length ? '<div class="seo-grp"><h4>' + w[1] + ' <span>' + w[2] + '</span></h4>' + r.map(function (o) { return oppRow(o, o.id === sel.id); }).join('') + '</div>' : '';
    }).join('');
    return head('Opportunities', 'What to do next, and why', 'Each item shows its evidence, effort and how we will check it worked. None of it predicts registrations until Search Console and sign-up events are connected.') +
      '<div class="seo-opps"><aside class="card seo-list">' + chips + rows + '</aside><section>' + oppDetail(sel) + '</section></div>' +
      '<div class="seo-sec"><header><div><h2>Not pursuing</h2><p>Topics with demand that do not fit XM, so we do not build for them.</p></div></header><div class="seo-no">' +
      D.notPursuing.map(function (p) { return '<div class="card"><b>' + esc(p.title) + '</b><p>' + esc(p.reason) + '</p></div>'; }).join('') + '</div></div>';
  }

  /* ---------- evidence: keywords ---------- */
  function kwModel() {
    var rows = [], seen = {};
    D.watchlist.forEach(function (w) {
      var sw = SW.watch[w.keyword], r = { keyword: w.keyword, source: w.source, note: w.note, branded: w.branded, scope: w.scope, comps: {} };
      if (w.source === 'Similarweb' && sw) {
        r.volume = sw.volume; r.clicks = sw.clicks; r.position = sw.position; r.difficulty = sw.difficulty; r.comps = sw.competitors || {};
        r.history = sw.history.map(function (h) { return h.clicks || 0; });
      } else {
        r.volume = w.volume; r.clicks = w.clicks; r.position = w.position; r.difficulty = w.difficulty;
      }
      seen[w.keyword] = 1; rows.push(r);
    });
    SW.keywords.forEach(function (k) {
      if (seen[k.keyword]) return;
      rows.push({ keyword: k.keyword, source: 'Similarweb', note: '', branded: k.branded || /xm|\uff58\uff4d/i.test(k.keyword), clicks: k.clicks, position: k.position, history: k.history, comps: {}, auto: true });
    });
    return rows;
  }
  function compsCell(c) {
    var out = Object.keys(c).map(function (d) { return '<span class="seo-cap"><b>' + esc(compName(d)) + '</b> ' + kfmt(c[d].clicks) + (c[d].position ? ' · #' + c[d].position : '') + '</span>'; });
    return out.length ? out.join('') : '<span class="mut">-</span>';
  }
  function kwRow(k) {
    var pos = k.position ? '<span class="seo-pos ' + (k.position <= 3 ? 'top' : !k.branded && k.position <= 15 ? 'hot' : '') + '">' + k.position + '</span>' : '<span class="mut">Not ranking</span>';
    var hist = k.history && Math.max.apply(null, k.history) > 0 ? spark(k.history, months()) : '<span class="mut">-</span>';
    return '<tr><td><b>' + esc(k.keyword) + '</b>' + (k.scope === 'review' ? ' <span class="tag amber">Check fit</span>' : '') + (k.source === 'Ahrefs' ? ' ' + srcPill('Ahrefs') : '') + (k.note ? '<small class="seo-note">' + esc(k.note) + '</small>' : '') + '</td><td class="num">' + (k.volume != null ? n(k.volume) : '-') + '</td><td class="num">' + (k.clicks != null ? n(k.clicks) : '-') + '</td><td>' + hist + '</td><td>' + pos + '</td><td class="num">' + (k.difficulty != null ? k.difficulty : '-') + '</td><td>' + compsCell(k.comps) + '</td></tr>';
  }
  function kwGroup(title, sub, rows) {
    return rows.length ? '<tr class="seo-gr"><td colspan="7"><b>' + esc(title) + '</b>' + esc(sub) + '</td></tr>' + rows.map(kwRow).join('') : '';
  }
  function viewKeywords() {
    var all = kwModel(), nb = all.filter(function (k) { return !k.branded; });
    var strikingAll = nb.filter(function (k) { return k.position >= 4 && k.position <= 15 && (k.source === 'Ahrefs' || k.clicks >= 50); }).sort(function (a, b) { return (b.clicks || 0) - (a.clicks || 0); });
    var striking = strikingAll.filter(function (k) { return k.source !== 'Ahrefs'; }).slice(0, 8).concat(strikingAll.filter(function (k) { return k.source === 'Ahrefs'; }));
    var gap = nb.filter(function (k) { return !k.position && !k.auto; }).sort(function (a, b) { return (b.volume || 0) - (a.volume || 0); });
    var used = {};
    striking.concat(gap).forEach(function (k) { used[k.keyword] = 1; });
    var top = nb.filter(function (k) { return !used[k.keyword] && k.clicks; }).sort(function (a, b) { return b.clicks - a.clicks; }).slice(0, 8);
    top.forEach(function (k) { used[k.keyword] = 1; });
    var brand = all.filter(function (k) { return k.branded && k.clicks; }).sort(function (a, b) { return b.clicks - a.clicks; }).slice(0, 4);
    var rows = [
      kwGroup('Striking distance', 'Non-brand searches where XM ranks 4 to 15 with at least 50 clicks (largest 8 shown), plus Ahrefs-tracked platform terms. Searches containing "XM" count as brand.', striking),
      kwGroup('Demand XM does not capture', 'Tracked searches where XM has no ranking. "Captured by" shows who gets the clicks.', gap),
      kwGroup('Largest non-brand sources of clicks', esc(mLabel(SW.months[SW.months.length - 1])) + ' top 8, outside the groups above. Some are unrelated to XM.', top),
      kwGroup('Brand', 'Mostly existing customers. Protect, but it does not bring new customers.', brand)
    ];
    return '<p class="seo-legend">Clicks and positions are XM\'s, for ' + esc(mLabel(SW.months[SW.months.length - 1])) + '. The trend shows ' + esc(months().join(', ')) + '. Difficulty is a 0-100 Similarweb score; higher is harder. A dash means the source has no value.</p>' +
      tbl([['Keyword'], ['Searches / mo', 1], ['Est. clicks', 1], ['Trend'], ['XM position'], ['Difficulty', 1], ['Captured by']], rows, ['27%', '10%', '9%', '8%', '11%', '8%', '27%']);
  }

  /* ---------- evidence: competitors ---------- */
  function brandLeak() {
    var xm = 0, others = {}, used = [];
    D.watchlist.forEach(function (w) {
      var s = SW.watch[w.keyword];
      if (!w.branded || w.source !== 'Similarweb' || !s || !s.clicks) return;
      xm += s.clicks; used.push(w.keyword);
      Object.keys(s.competitors || {}).forEach(function (d) { others[d] = (others[d] || 0) + s.competitors[d].clicks; });
    });
    var tot = xm; Object.keys(others).forEach(function (d) { tot += others[d]; });
    return { xm: xm, others: others, used: used, tot: tot };
  }
  function signals() {
    var bl = brandLeak(), leak = bl.tot ? (bl.tot - bl.xm) / bl.tot * 100 : 0;
    var camp = SW.pages.filter(function (p) { return /gold-deposit-bonus/.test(p.path); })[0];
    var gap = 0;
    D.watchlist.forEach(function (w) {
      var s = SW.watch[w.keyword];
      if (w.source === 'Similarweb' && !w.branded && w.scope !== 'review' && s && !s.position && s.volume) gap += s.volume;
    });
    var out = [];
    if (bl.tot) out.push([leak.toFixed(0) + '%', 'of clicks on XM brand searches go to other sites', kfmt(bl.tot - bl.xm) + ' clicks a month, mostly to affiliate sites.', 'OPP-11']);
    if (camp) out.push([n(camp.keywords), 'keywords where a bonus campaign page is XM\'s top result', 'Many are other companies\' logins and cannot convert.', 'OPP-01']);
    if (gap) out.push([kfmt(gap), 'monthly searches on tracked topics where XM does not rank', 'Nikkei futures, USD, TradingView and similar.', 'OPP-07']);
    return out;
  }

  function viewCompetitors() {
    var bl = brandLeak(), xm = bl.xm, others = bl.others, used = bl.used, tot = bl.tot;
    var parties = [['XM', xm, true]].concat(Object.keys(others).map(function (d) { return [compName(d), others[d], false]; })).sort(function (a, b) { return b[1] - a[1]; });
    var h = '<div class="card seo-split"><h3>Who gets the clicks on XM brand searches</h3><p class="sub">Across ' + used.length + ' tracked brand searches (' + esc(used.join(', ')) + '), ' + esc(D.meta.period) + '. Estimated clicks.</p><div class="seo-bars">' +
      parties.map(function (p) { return '<div class="seo-barrow"><span' + (p[2] ? ' style="font-weight:600"' : '') + '>' + esc(p[0]) + '</span><span class="seo-meter ' + (p[2] ? '' : 'bad') + '"><i style="width:' + (p[1] / tot * 100).toFixed(1) + '%"></i></span><b>' + (p[1] / tot * 100).toFixed(1) + '%</b></div>'; }).join('') + '</div>' +
      '<p class="seo-foot">' + kfmt(tot - xm) + ' clicks a month go to other sites on searches for XM itself. See ' + oppLink('OPP-11') + '.</p></div>';

    var scale = SW.competitors.map(function (c) {
      var meta = D.competitors.filter(function (x) { return x.domain === c.domain; })[0] || {};
      var tone = meta.threat === 'High' ? 'red' : meta.threat === 'Medium' ? 'amber' : 'grey';
      return '<tr><td><b>' + esc(meta.name || c.domain) + '</b><small class="seo-note">' + esc(c.domain) + '</small></td><td class="num">' + (c.capped ? n(c.keywords) + '+' : n(c.keywords)) + '</td><td class="num">' + (c.capped ? '≥ ' : '') + kfmt(c.clicks) + '</td><td><span class="tag ' + tone + '">' + esc(meta.threat || '-') + ' threat</span></td><td>' + esc(meta.takeaway || '') + '</td></tr>';
    });
    scale.unshift('<tr class="me"><td><b>XM</b><small class="seo-note">xmtrading.com</small></td><td class="num">' + n(cur().keywords) + '</td><td class="num">' + kfmt(cur().clicks) + '</td><td><span class="tag">You</span></td><td>All devices, Japan, ' + esc(mLabel(SW.months[SW.months.length - 1])) + '.</td></tr>');
    h += '<div class="seo-sec"><header><div><h2>Competitors in Japan</h2><p>Organic search, ' + esc(D.meta.period) + '. Large securities sites are capped at their top 10,000 keywords, so their totals are a minimum.</p></div></header>' +
      tbl([['Competitor'], ['Keywords', 1], ['Est. clicks', 1], ['Threat'], ['What to know']], scale, ['18%', '11%', '11%', '14%', '46%']) + '</div>';

    h += '<div class="seo-sec"><header><div><h2>New competitor pages worth reacting to</h2><p>Detected in the Aug 2026 snapshot. Similarweb\'s new-page feed is not in the API, so these are not refreshed automatically.</p></div></header>' +
      tbl([['Competitor'], ['Page'], ['Topic'], ['Relevance'], ['Opportunity']], D.newPages.map(function (p) {
        var tone = p.relevance === 'Critical' ? 'red' : p.relevance === 'High' ? 'amber' : p.relevance === 'Medium' ? 'blue' : 'grey';
        return '<tr><td>' + esc(p.domain) + '</td><td class="seo-path">' + esc(p.path) + '</td><td>' + esc(p.tag) + '</td><td><span class="tag ' + tone + '">' + esc(p.relevance) + '</span></td><td>' + (p.opp ? oppLink(p.opp) : '<span class="mut">None planned</span>') + '</td></tr>';
      }), ['20%', '30%', '20%', '14%', '16%']) + '</div>';
    return h;
  }

  /* ---------- evidence: pages ---------- */
  function catOf(path) {
    if (/^(mypartners|partners)\./.test(path)) return 'Partner';
    if (/^my\./.test(path)) return 'Account';
    if (/fxplus\.[^/]+\/(userguide|help)/.test(path)) return 'Support';
    if (/fxplus\./.test(path)) return 'Editorial';
    if (/landing|promotions/.test(path)) return 'Campaign';
    if (/\/(mt4|mt5|platforms)|traderpro/.test(path)) return 'Platform';
    if (/help-centre|contact/.test(path)) return 'Support';
    if (/calculators|trading-fees|trading-conditions|forex|account-types/.test(path)) return 'Product';
    if (/regulation|who-we-are/.test(path)) return 'Corporate';
    if (/guides|blog|market-news|educational/.test(path)) return 'Editorial';
    return /xmtrading\.com\/jp$/.test(path) ? 'Core' : 'Other';
  }
  function pgInfo(p) {
    var note = D.pageNotes[p.path];
    return note ? { category: note.category, assessment: note.assessment } : { category: catOf(p.path), assessment: 'Not reviewed' };
  }
  function pgRow(p) {
    var i = pgInfo(p), a = i.assessment;
    var tone = a === 'Strong' ? '' : a === 'Expand' ? 'blue' : a === 'Review' ? 'amber' : (a === 'Misrouted' || a === 'Mismatch') ? 'red' : 'grey';
    return '<tr><td class="seo-path">' + esc(p.path) + '</td><td>' + esc(i.category) + '</td><td>' + esc(p.topKeyword) + '</td><td class="num">' + n(p.clicks) + '</td><td class="num">' + Number(p.share).toFixed(2) + '%</td><td><span class="tag ' + tone + '">' + esc(a) + '</span>' + (a === 'Mismatch' && /gold-deposit-bonus/.test(p.path) ? ' ' + oppLink('OPP-01') : '') + '</td></tr>';
  }
  function viewPages() {
    var inv = SW.pages, cols = [['Page'], ['Category'], ['Top keyword'], ['Est. clicks', 1], ['Share', 1], ['Assessment']], w = ['31%', '11%', '20%', '11%', '9%', '18%'];
    var attn = inv.filter(function (p) { return ['Misrouted', 'Mismatch', 'Review', 'Expand'].indexOf(pgInfo(p).assessment) >= 0; });
    var fresh = inv.filter(function (p) { return !D.pageNotes[p.path] && p.clicks >= 400; });
    var freshN = fresh.length; fresh = fresh.slice(0, 8);
    var top5 = inv.slice(0, 5);
    var h = '<div class="card seo-split"><h3>Concentration</h3><p class="sub">10 of ' + SW.landingPages + ' ranking pages drive ' + SW.top10PagesShare + '% of estimated clicks, mostly brand and login pages. A page counts for each keyword where it is XM\'s top result.</p><div class="seo-bars">' +
      top5.map(function (p) { return '<div class="seo-barrow wide"><span class="seo-path" title="' + esc(p.path) + '">' + esc(p.path) + '</span><span class="seo-meter"><i style="width:' + Math.min(100, p.share / top5[0].share * 100).toFixed(1) + '%"></i></span><b>' + Number(p.share).toFixed(1) + '%</b></div>'; }).join('') + '</div></div>';
    h += '<div class="seo-sec"><header><div><h2>Pages that need a decision</h2><p>Mismatched, under review or worth expanding.</p></div></header>' + (attn.length ? tbl(cols, attn.map(pgRow), w) : '<div class="empty">Nothing flagged.</div>') + '</div>';
    if (fresh.length) h += '<div class="seo-sec"><header><div><h2>Not reviewed yet</h2><p>The 8 biggest pages nobody has assessed' + (freshN > 8 ? ' (' + freshN + ' have at least 400 clicks)' : '') + '. Many are new since the last review.</p></div></header>' + tbl(cols, fresh.map(pgRow), w) + '</div>';
    h += '<details class="seo-all"><summary>All ' + inv.length + ' top pages</summary>' + tbl(cols, inv.map(pgRow), w) + '</details>';
    return h;
  }

  function viewEvidence(arg) {
    var sub = EVIDENCE.filter(function (e) { return e[0] === arg; })[0] ? arg : 'keywords';
    var body = sub === 'keywords' ? viewKeywords() : sub === 'competitors' ? viewCompetitors() : viewPages();
    var tabs = '<div class="pill-tabs">' + EVIDENCE.map(function (e) { return '<button data-go="evidence/' + e[0] + '" class="' + (e[0] === sub ? 'on' : '') + '">' + esc(e[1]) + '</button>'; }).join('') + '</div>';
    return head('Evidence', 'The data behind the opportunities', 'Use it to check a recommendation, not to browse.', tabs) + body;
  }

  /* ---------- data sources ---------- */
  function viewSources() {
    var ah = D.ahrefs, c = cur();
    return head('Data sources', 'What this tool knows, and what it does not', 'The two missing sources are what turn estimates into measured results.') +
      '<div class="card">' + D.sources.map(function (s) {
        var tone = s.status === 'missing' ? 'red' : s.status === 'tested' ? 'amber' : '';
        return '<div class="seo-srow ' + tone + '"><span class="dot"></span><div><b>' + esc(s.name) + '</b><small>' + (s.freshness !== '-' ? esc(s.freshness) + ' · ' : '') + esc(s.coverage) + '</small></div><p>' + esc(s.caveat) + '</p><span class="tag ' + tone + '">' + esc(s.label) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="seo-sec"><header><div><h2>Two sources, two answers</h2><p>Totals differ because methods differ. Read them as ranges; Search Console will be the ground truth.</p></div></header>' +
      tbl([['Measure'], ['Similarweb', 1], ['Ahrefs', 1]], [
        '<tr><td>Data from</td><td class="num">' + esc(D.meta.period) + '</td><td class="num">' + esc(ah.tested) + '</td></tr>',
        '<tr><td>Organic keywords</td><td class="num">' + n(c.keywords) + '</td><td class="num">' + n(ah.organicKeywords) + '</td></tr>',
        '<tr><td>Top-3 keywords</td><td class="num">' + n(c.top3) + '</td><td class="num">' + n(ah.top3Keywords) + '</td></tr>',
        '<tr><td>Organic traffic</td><td class="num">' + kfmt(c.clicks) + '</td><td class="num">' + esc(ah.organicTraffic) + '</td></tr>',
        '<tr><td>Live backlinks</td><td class="num">n/a</td><td class="num">' + esc(ah.liveBacklinks) + '</td></tr>'], ['50%', '25%', '25%']) + '</div>' +
      '<div class="seo-sec"><header><div><h2>Refresh the Similarweb data</h2><p>Collected ' + esc(SW.collected) + ', covering ' + esc(months().join(', ')) + ' ' + esc(SW.months[0].slice(0, 4)) + '. The collector runs outside the browser so the API key never reaches the page.</p></div></header>' +
      '<pre class="seo-code"><code>export SIMILARWEB_API_KEY=...   # keep it out of the repository\npython3 tools/seo-agent/collect_similarweb.py</code></pre>' +
      '<p class="seo-foot">It rewrites <code>data/similarweb.json</code>. Opportunities, competitor notes and page assessments in <code>data/snapshot.json</code> are written by an analyst and need a review after each refresh.</p></div>' +
      '<div class="seo-sec"><div class="seo-cta"><div><b>Next step: connect Search Console and sign-up events</b><p>Then registrations replace estimates. A scheduled job can run the collector with the key stored in repository secrets, never in the browser.</p></div>' +
      '<button class="btn btn-primary" data-go="opportunities/OPP-04">See OPP-04</button></div></div>';
  }

  /* ---------- router ---------- */
  var RENDER = { overview: viewOverview, opportunities: viewOpps, evidence: viewEvidence, sources: viewSources };
  var LEGACY = { keywords: 'evidence/keywords', competitors: 'evidence/competitors', pages: 'evidence/pages', trends: 'overview' };

  function render() {
    if (!D || !SW) return;
    var p = location.hash.replace('#', '').split('/');
    if (LEGACY[p[0]]) { location.replace('#' + LEGACY[p[0]]); return; }
    var view = RENDER[p[0]] ? p[0] : 'overview';
    renderTabs(view);
    app.innerHTML = RENDER[view](p[1] || '');
    var d = view === 'opportunities' && p[1] && window.innerWidth <= 1100 ? document.getElementById('opp-detail') : null;
    if (d) d.scrollIntoView({ block: 'start' });
    else if (view !== lastView) window.scrollTo(0, 0);
    lastView = view;
  }

  document.addEventListener('click', function (e) {
    var f = e.target.closest('[data-filter]');
    if (f) { oppFilter = f.dataset.filter; render(); return; }
    var t = e.target.closest('[data-go]');
    if (t) location.hash = t.dataset.go;
  });
  window.addEventListener('hashchange', render);

  function load(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }); }
  Promise.all([load('data/snapshot.json'), load('data/similarweb.json')]).then(function (r) {
    D = r[0]; SW = r[1]; render();
  }).catch(function () {
    app.innerHTML = '<div class="empty">Could not load the data files. Open this tool through the hub or a local web server.</div>';
  });
})();

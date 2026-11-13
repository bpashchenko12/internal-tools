#!/usr/bin/env python3
"""Collect organic-search data from the Similarweb API and write sanitised JSON for the SEO Agent.

Runs server-side only (your laptop or a scheduled GitHub Action). The API key is read from the
SIMILARWEB_API_KEY environment variable and is never written to disk or to the output file.

    export SIMILARWEB_API_KEY=...        # never commit this
    python3 tools/seo-agent/collect_similarweb.py

Output: tools/seo-agent/data/similarweb.json
Curated content (opportunities, competitor notes, sources) stays in data/snapshot.json.
"""
import json, os, sys, time, urllib.parse, urllib.request, urllib.error
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
SNAPSHOT = HERE / 'data' / 'snapshot.json'
OUT = HERE / 'data' / 'similarweb.json'

DOMAIN = 'xmtrading.com'
COUNTRY = 'jp'
WEB = 'total'
BASE = 'https://api.similarweb.com'
PAGE = 1000
MAX_ROWS_COMPETITOR = 10000   # long tail beyond this is negligible for click totals
MIN_STRIKING_CLICKS = 20      # ignore long-tail noise when listing striking-distance keywords
KEY = os.environ.get('SIMILARWEB_API_KEY', '').strip()


def call(path, params):
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    for attempt in range(4):
        req = urllib.request.Request(url, headers={'api-key': KEY})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(2 * (attempt + 1)); continue
            raise SystemExit('Similarweb error %s on %s' % (e.code, path))
        except (urllib.error.URLError, TimeoutError):
            if attempt < 3:
                time.sleep(2 * (attempt + 1)); continue
            raise SystemExit('Network error on ' + path)


def keyword_rows(domain, month, branded='all', limit_rows=None, page=PAGE):
    """Organic keywords for a domain and month, sorted by clicks, paged by skip offset."""
    rows, offset = [], 0
    while True:
        take = page if limit_rows is None else min(page, limit_rows - len(rows))
        if take <= 0:
            break
        r = call('/v5/website-analysis/keywords/aggregated', {
            'domain': domain, 'traffic_source': 'organic', 'start_date': month, 'end_date': month,
            'granularity': 'monthly', 'web_source': WEB, 'country': COUNTRY, 'branded_type': branded,
            'format': 'json', 'sort': 'clicks', 'limit': take, 'offset': offset})
        data = r.get('data') or []
        rows += data
        if len(data) < take or (limit_rows is not None and len(rows) >= limit_rows) or len(rows) >= MAX_ROWS_COMPETITOR:
            break
        offset += take
        time.sleep(0.2)
    return rows


def volume_for(keyword, month):
    r = call('/v5/keyword-analysis/keywords/overview', {
        'keyword': keyword, 'granularity': 'monthly', 'country': COUNTRY, 'start_date': month,
        'end_date': month, 'web_source': WEB, 'metrics': 'volume,difficulty', 'format': 'json'})
    d = (r.get('data') or [{}])[-1]
    return d.get('volume'), d.get('difficulty')


def presence(domain, keyword, month):
    """Clicks and position one domain gets for one exact keyword."""
    r = call('/v5/website-analysis/keywords/aggregated', {
        'domain': domain, 'traffic_source': 'organic', 'start_date': month, 'end_date': month,
        'granularity': 'monthly', 'web_source': WEB, 'country': COUNTRY, 'branded_type': 'all', 'format': 'json',
        'limit': 5, 'keywords_filter_rules': json.dumps([{'type': 'include', 'match_type': 'exact', 'keywords': [keyword]}], ensure_ascii=False)})
    for row in r.get('data') or []:
        if row['keyword'] == keyword and (row.get('clicks') or 0) > 0:
            return {'clicks': round(row['clicks']), 'position': row.get('position')}
    return None


def clean(row, branded):
    return {
        'keyword': row['keyword'], 'clicks': round(row.get('clicks') or 0),
        'share': round((row.get('traffic_share') or 0) * 100, 2), 'position': row.get('position'),
        'intent': row.get('primary_intent'), 'competition': row.get('competition'),
        'topUrl': row.get('top_url'), 'branded': branded}


def totals(branded_rows, non_rows):
    allr = branded_rows + non_rows
    clicks = sum(r.get('clicks') or 0 for r in allr)
    nb = sum(r.get('clicks') or 0 for r in non_rows)
    pos = [r.get('position') for r in allr if r.get('position')]
    return {'keywords': len(allr), 'clicks': round(clicks), 'nonBrandedClicks': round(nb),
            'nonBrandedShare': round(nb / clicks * 100, 1) if clicks else 0,
            'top3': sum(1 for p in pos if p <= 3), 'top10': sum(1 for p in pos if p <= 10)}


def month_list(last):
    y, m = int(last[:4]), int(last[5:7])
    out = []
    for i in range(2, -1, -1):
        mm = m - i
        yy = y
        while mm < 1:
            mm += 12; yy -= 1
        out.append('%04d-%02d' % (yy, mm))
    return out


def main():
    if not KEY:
        sys.exit('Set SIMILARWEB_API_KEY first (see the header of this file).')
    snap = json.loads(SNAPSHOT.read_text(encoding='utf-8'))
    competitors = [c['domain'] for c in snap.get('competitors', [])]
    watch = [k['keyword'] for k in snap.get('watchlist', []) if k.get('source') == 'Similarweb']

    caps = call('/capabilities', {})
    last = (caps.get('web_desktop_data') or {}).get('snapshot_interval', {}).get('end_date', '')[:7]
    months = month_list(last or date.today().strftime('%Y-%m'))
    print('Months:', months, '| credits before:', caps.get('remaining_hits'))

    trend, by_month = [], {}
    for m in months:
        b = keyword_rows(DOMAIN, m, 'branded')
        nb = keyword_rows(DOMAIN, m, 'non_branded')
        t = totals(b, nb); t['month'] = m
        trend.append(t)
        print(' ', m, t)
        by_month[m] = ([clean(r, True) for r in b], [clean(r, False) for r in nb])

    last_m, first_m = months[-1], months[0]
    branded_rows, nonbranded_rows = by_month[last_m]
    allrows = sorted(branded_rows + nonbranded_rows, key=lambda r: -r['clicks'])

    keywords = allrows[:100]
    seen = {r['keyword'] for r in keywords}
    keywords += [r for r in nonbranded_rows if r['position'] and 4 <= r['position'] <= 15
                 and r['clicks'] >= MIN_STRIKING_CLICKS and r['keyword'] not in seen]

    month_clicks = {m: {r['keyword']: r['clicks'] for r in by_month[m][0] + by_month[m][1]} for m in months}
    for r in keywords:
        r['history'] = [month_clicks[m].get(r['keyword'], 0) for m in months]

    def norm(u):
        return (u or '(unknown)').split('?')[0].rstrip('/')

    pages = {}
    for r in allrows:
        u = norm(r['topUrl'])
        p = pages.setdefault(u, {'path': u, 'keywords': 0, 'clicks': 0, 'topKeyword': r['keyword'], 'top': -1})
        p['keywords'] += 1
        p['clicks'] += r['clicks']
        if r['clicks'] > p['top']:
            p['top'] = r['clicks']; p['topKeyword'] = r['keyword']
    total_clicks = trend[-1]['clicks'] or 1
    page_list = sorted(pages.values(), key=lambda p: -p['clicks'])
    for p in page_list:
        p['share'] = round(p['clicks'] / total_clicks * 100, 2)
        del p['top']
    top10_share = round(sum(p['clicks'] for p in page_list[:10]) / total_clicks * 100)

    # Non-brand movers between the first and last month
    first_nb = {r['keyword']: r for r in by_month[first_m][1]}
    last_nb = {r['keyword']: r for r in nonbranded_rows}
    diffs = []
    for k in set(first_nb) | set(last_nb):
        if 'xm' in k.lower() or '\uff58\uff4d' in k.lower():   # XM-name queries are brand in practice
            continue
        a, b = first_nb.get(k), last_nb.get(k)
        diffs.append({'keyword': k, 'from': a['clicks'] if a else 0, 'to': b['clicks'] if b else 0,
                      'posFrom': a['position'] if a else None, 'posTo': b['position'] if b else None,
                      'delta': (b['clicks'] if b else 0) - (a['clicks'] if a else 0),
                      'url': norm((b or a)['topUrl'])})
    movers = {'from': first_m, 'to': last_m,
              'lost': sorted([d for d in diffs if d['delta'] < 0], key=lambda d: d['delta'])[:8],
              'gained': sorted([d for d in diffs if d['delta'] > 0], key=lambda d: -d['delta'])[:8]}

    watch_data = {}
    for k in watch:
        vol, diff = volume_for(k, last_m)
        hist = []
        for m in months:
            row = {r['keyword']: r for r in by_month[m][0] + by_month[m][1]}.get(k)
            hist.append({'month': m, 'clicks': row['clicks'] if row else None, 'position': row['position'] if row else None})
        cur = hist[-1]
        watch_data[k] = {'volume': round(vol) if vol else None, 'difficulty': diff,
                         'clicks': cur['clicks'], 'position': cur['position'], 'history': hist}
        watch_data[k]['competitors'] = {}
        for d in competitors:
            pr = presence(d, k, last_m)
            if pr:
                watch_data[k]['competitors'][d] = pr
        time.sleep(0.2)
    print('Watchlist done:', len(watch_data))

    comp_out = []
    for d in competitors:
        rows = keyword_rows(d, last_m, 'all')
        comp_out.append({'domain': d, 'keywords': len(rows), 'clicks': round(sum(r.get('clicks') or 0 for r in rows)),
                         'capped': len(rows) >= MAX_ROWS_COMPETITOR})
        print(' ', d, comp_out[-1])

    out = {
        'collected': date.today().isoformat(), 'lastUpdated': months[-1] + '-28', 'domain': DOMAIN, 'country': COUNTRY.upper(),
        'webSource': 'all devices', 'months': months, 'trend': trend, 'landingPages': len(page_list),
        'top10PagesShare': top10_share, 'keywords': keywords, 'watch': watch_data,
        'pages': page_list[:40], 'movers': movers, 'competitors': comp_out}
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print('Wrote', OUT, '| credits after:', call('/capabilities', {}).get('remaining_hits'))


if __name__ == '__main__':
    main()

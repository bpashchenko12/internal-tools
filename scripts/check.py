#!/usr/bin/env python3
"""Check that tools follow the Internal Tools rules. Run before opening a pull request:

    python3 scripts/check.py

Exit code is 1 when a rule is broken. The same check runs on every pull request.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors = []
def fail(msg): errors.append(msg)
def read(p): return open(os.path.join(ROOT, p), encoding='utf8').read()

STATUS = {'prototype', 'beta', 'live'}
ACCENT = {'green', 'blue', 'amber', 'purple', 'red', 'dark'}
REQUIRED = ['id', 'name', 'description', 'category', 'status', 'icon', 'accent', 'owner', 'path']
icons = set(re.findall(r"^\s{4}(\w+): '", read('assets/js/shell.js'), re.M))

try:
    tools = json.loads(read('tools.json'))['tools']
except Exception as e:
    sys.exit('tools.json is not valid JSON: %s' % e)

seen = set()
for t in tools:
    tid = t.get('id', '?')
    for k in REQUIRED:
        if not t.get(k): fail('tools.json: "%s" is missing "%s"' % (tid, k))
    if tid in seen: fail('tools.json: duplicate id "%s"' % tid)
    seen.add(tid)
    if t.get('status') not in STATUS: fail('tools.json: "%s" status must be one of %s' % (tid, sorted(STATUS)))
    if t.get('accent') not in ACCENT: fail('tools.json: "%s" accent must be one of %s' % (tid, sorted(ACCENT)))
    if icons and t.get('icon') not in icons: fail('tools.json: "%s" icon "%s" is not in assets/js/shell.js' % (tid, t.get('icon')))
    if len(t.get('description', '')) > 200: fail('tools.json: "%s" description is longer than 200 characters' % tid)
    path = t.get('path', '')
    if path != 'tools/%s/' % tid: fail('tools.json: "%s" path must be "tools/%s/"' % (tid, tid))
    if not os.path.isfile(os.path.join(ROOT, path, 'index.html')): fail('%sindex.html does not exist' % path)

for d in sorted(os.listdir(os.path.join(ROOT, 'tools'))):
    base = os.path.join('tools', d)
    if not os.path.isdir(os.path.join(ROOT, base)) or d.startswith('_'): continue
    if d not in seen: fail('%s/ exists but is not registered in tools.json' % base)
    for dirpath, _, files in os.walk(os.path.join(ROOT, base)):
        for f in files:
            rel = os.path.relpath(os.path.join(dirpath, f), ROOT)
            ext = f.rsplit('.', 1)[-1].lower()
            if ext not in ('html', 'css', 'js', 'json', 'md', 'txt', 'svg', 'png', 'jpg', 'jpeg', 'webp'): continue
            if ext in ('png', 'jpg', 'jpeg', 'webp'): continue
            src = read(rel)
            if ext == 'css' and re.search(r'#[0-9a-fA-F]{3,8}\b', src): fail('%s: hex colour found, use a var(--token)' % rel)
            if ext in ('css', 'html'):
                for m in re.finditer(r'font-size:\s*(\d+(?:\.\d+)?)px', src):
                    if float(m.group(1)) < 12: fail('%s: font-size %spx is below 12px' % (rel, m.group(1)))
            if ext in ('html', 'js') and re.search(r'<script[^>]+src=["\']https?://', src): fail('%s: third-party script is not allowed' % rel)
            if re.search(r'(api[_-]?key|secret|token|password)\s*[:=]\s*["\'][A-Za-z0-9_\-]{12,}', src, re.I): fail('%s: looks like a credential, remove it' % rel)
            if f == 'index.html':
                head = src.split('</head>')[0]
                scripts = re.findall(r'<script[^>]+src="([^"]+)"', head)
                if not scripts or not scripts[0].endswith('assets/js/gate.js'): fail('%s: gate.js must be the first script in <head>' % rel)
                if 'assets/css/xm.css' not in src: fail('%s: must load assets/css/xm.css' % rel)

if errors:
    print('\n'.join('FAIL ' + e for e in errors))
    sys.exit(1)
print('OK: %d tool(s) checked' % len(tools))

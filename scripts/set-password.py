#!/usr/bin/env python3
"""Change the access password for Internal Tools.

    python3 scripts/set-password.py

Prompts for a new password (hidden), then rewrites the HASH constant in assets/js/gate.js.
Only a salted PBKDF2 hash is stored in the repo. Share the new password through a
password manager, not in chat or email.
"""
import getpass, hashlib, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(ROOT, 'assets', 'js', 'gate.js')

src = open(GATE, encoding='utf8').read()
salt = re.search(r"var SALT = '([^']+)'", src).group(1)
iters = int(re.search(r"var ITER = (\d+)", src).group(1))

pw = getpass.getpass('New password (16+ characters recommended): ').strip()
if len(pw) < 12:
    sys.exit('Too short - use at least 12 characters.')
if getpass.getpass('Repeat password: ').strip() != pw:
    sys.exit('Passwords do not match.')

h = hashlib.pbkdf2_hmac('sha256', pw.encode(), salt.encode(), iters, 32).hex()
src = re.sub(r"var HASH = '[0-9a-f]+';", "var HASH = '%s';" % h, src)
open(GATE, 'w', encoding='utf8').write(src)
print('Password updated. Commit assets/js/gate.js and push; everyone will be asked to log in again.')

# Internal Tools: agent brief

Give this file to your AI coding agent (Copilot, Claude, Cursor, etc.) together with a clone of the repository. It explains how to build and register a new tool so it looks and behaves like every other tool in the hub.

- Repository: https://github.com/bpashchenko12/internal-tools
- Live site: https://bpashchenko12.github.io/internal-tools/
- Live design reference: `docs/guide.html` (open it from the site)

## What this project is

A hub of small internal tools. It is plain static HTML, CSS and JS with no build step, no framework and no package manager. The home page (`index.html`) reads `tools.json` and shows an iOS-style app icon for every tool. Each tool is one folder under `tools/`. The site is deployed to GitHub Pages from `main`.

```
index.html              Home screen (do not edit unless asked)
tools.json              Registry of tools: one entry per tool
assets/css/xm.css       Design system: tokens and components (do not edit unless asked)
assets/css/hub.css      Home screen styles only
assets/js/gate.js       Shared password gate (never edit, never write your own login)
assets/js/shell.js      XMTools helpers: logo, icons, top bar, toasts
docs/guide.html         Human guide and live component reference
scripts/check.py        Rule checker, run before every pull request
tools/_template/        Starting point for a new tool
tools/<tool-id>/        One folder per tool
```

## Your job

Create or change **one tool** in `tools/<tool-id>/` and register it in `tools.json`. Change nothing else unless the human asks.

### Ask the human first (only what you do not already know)

1. Tool name and a one-sentence purpose (under 140 characters).
2. Who uses it and what decision or task it supports.
3. Category (existing ones are shown on the home page, for example "SEO & Marketing"), owner name and status (`prototype`, `beta` or `live`).
4. Where the data comes from. If it needs an API key or a login, the data must be collected outside the browser (see Data and secrets).
5. Which screens it needs. Keep it small: only what leads to a decision.

### Steps

1. Create a branch: `git checkout -b tool/<tool-id>`.
2. Copy the template: `cp -r tools/_template tools/<tool-id>`. The id is lowercase with dashes, for example `market-brief`.
3. Edit `tools/<tool-id>/index.html`: the `<title>`, the `data-title` on `#hub-bar`, and the content inside `<main class="page">`.
4. Put logic in `app.js` and styles in `tool.css`.
5. Add the entry to `tools.json` (schema below).
6. Run locally: `python3 -m http.server 8000`, open `http://localhost:8000/tools/<tool-id>/`. Opening files with `file://` does not work because `fetch` needs a server. The site asks for the shared password once (get it from the maintainer, never write it in a file).
7. Run `python3 scripts/check.py` and fix every `FAIL` line.
8. Click through every screen at desktop width and at about 390px wide. There must be no console errors, no horizontal scrolling and no text under 12px.
9. Commit and push the branch, then open a pull request. Fill in the pull request checklist.

## tools.json entry

```json
{
  "id": "market-brief",
  "name": "Market Brief",
  "description": "Daily market summary for the content team.",
  "category": "Content",
  "status": "prototype",
  "icon": "chart",
  "accent": "blue",
  "owner": "Your name or team",
  "path": "tools/market-brief/"
}
```

- `id`: unique, lowercase, dashes. The folder name must be the same.
- `path`: exactly `tools/<id>/` with a trailing slash, and the folder must contain `index.html`.
- `url`: use instead of `path` for a tool that already lives on its own site (an `https://` address). The icon then opens that site in the same tab and the browser back button returns to the hub. No folder is needed in `tools/`. Example: the X Monitor entry.
- `status`: `prototype`, `beta` or `live`. It shows as a badge on the app icon (`live` shows no badge).
- `icon`: one of `search`, `chart`, `radar`, `grid`, `bolt`, `globe`, `users`, `book`, `shield`, `doc`, `spark`, `plus`, `arrow`, `back`, `lock`. A new icon can be added to the `ICONS` object in `assets/js/shell.js` (stroke icon on a 24 by 24 grid), but only if the human agrees.
- `accent`: `green`, `blue`, `amber`, `purple`, `red` or `dark`. It is the app icon colour.
- `description`: one sentence, under 140 characters (hard limit 200).

## Page skeleton

Every tool page starts from this. `gate.js` must be the first script in `<head>`.

```html
<!doctype html>
<html lang="en">
<head>
  <script src="../../assets/js/gate.js"></script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>My Tool · XMTrading Internal Tools</title>
  <link rel="stylesheet" href="../../assets/css/xm.css" />
  <link rel="stylesheet" href="tool.css" />
</head>
<body>
  <div id="hub-bar" data-title="My Tool"></div>

  <main class="page">
    <div class="page-head">
      <div>
        <div class="eyebrow">Category</div>
        <h1 class="h-l">My Tool</h1>
        <p>One sentence about what this tool does and who it is for.</p>
      </div>
      <button class="btn btn-primary" id="run" type="button">Primary action</button>
    </div>
    <!-- content: .grid.c3 of .card.stat, .card with .tbl-wrap > table.tbl, etc. -->
  </main>

  <script src="../../assets/js/shell.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

`#hub-bar` is filled by `shell.js` with the logo, your tool name, a link back to the home screen and a sign-out button. Do not build your own header.

## Design system

Use only what is in `assets/css/xm.css`. Read it first. The essentials:

**Tokens (CSS variables).** Never write a hex colour in a tool stylesheet. Use `var(--token)`; for white use `var(--card)`.

| Group | Tokens |
| --- | --- |
| Brand | `--g` `--g-d` `--g-l` `--g-2` (green), `--red` `--red-l` |
| Text and lines | `--ink` `--ink-2` `--mut` `--line` `--line-2` |
| Surfaces | `--bg` (page) `--card` `--soft` `--dark` `--dark-2` `--dark-3` |
| Status | `--up` `--dn` `--blue` `--blue-d` `--blue-l` `--amber` `--amber-l` `--purple` `--purple-l` |
| Shape | `--r-s` `--r-m` `--r-l` `--r-xl`, shadows `--sh-s` `--sh-m` `--sh-l` |
| Type | `--font` (Poppins), sizes `--fs-xs` 12px, `--fs-s` 13px, `--fs-m` 14px, `--fs-l` 16px |
| Layout | `--maxw` 1200px, `--bar-h` 64px |

**Components (classes).**

- Structure: `.page`, `.page-head`, `.container`, `.grid` with `.c2` `.c3` `.c4`, `.card`, `.card-pad`, `.divider`
- Text: `.eyebrow`, `.h-xl`, `.h-l`, `.h-m`, `.lead`, `.mut`, `.num` (tabular numbers), `.up`, `.dn`, `.sr` (screen-reader only)
- Stats: `.card.stat` with `.k` (label), `.v` (value), `.d` (delta, plus `.up` `.dn` `.mut`)
- Table: `.card > .tbl-wrap > table.tbl`; numeric cells use `.num`
- Buttons: `.btn` with `.btn-primary` (one per screen), `.btn-outline`, `.btn-dark`, `.btn-ghost`, sizes `.btn-sm` `.btn-lg`, `.btn-block`
- Tags: `.tag` with `.blue` `.amber` `.red` `.purple` `.dark` `.grey`
- Filters: `.chip` (`.on` when selected), `.pill-tabs` with `button.on`
- Forms: `label.field > span + .inp`, `select.inp`, `.help`, `.err-msg`, `.inp.err`, search box `.search` with an svg and `.inp`
- Misc: `.icon-tile` (+ colours), `.empty`, `.dot`, `.modal-back` with `.modal` (add `.open`), toasts via `XMTools.toast`

**Colour meaning.** Green is good or brand, red is risk or bad, amber needs attention, blue is information.

**Rules**
- No font under 12px. Use the `--fs-*` tokens.
- No new fonts, no CSS frameworks, no inline hex colours, no emojis in the interface.
- Your own CSS goes in `tool.css`. Prefix every class with the tool id, for example `.marketbrief-chart`.
- Give every inline SVG an explicit width and height in CSS. A bare `svg` can render huge.
- Layout must work from 390px to 1280px wide. Tables scroll inside `.tbl-wrap`; do not let the page scroll sideways.
- Keep interfaces small and decision-focused: show what matters, say what is estimated, and avoid decoration.

## XMTools helpers

Available as `window.XMTools` after `shell.js` loads:

- `XMTools.esc(text)`: escape any dynamic text before putting it into `innerHTML`. Required.
- `XMTools.icon(name, cssClass?)`: returns an SVG string for an icon name listed above.
- `XMTools.toast(message)`: short confirmation message.
- `XMTools.url(path)`: absolute URL from the site root, for example `XMTools.url('tools.json')`.
- `XMTools.logo(onDark)`: the XMTRADING logo SVG string.

## Data and secrets

- Never put API keys, tokens, passwords or credentials in the repository or in browser code. The repository is public.
- Do not call paid or private APIs from the browser. Collect data in a separate job (a script, a scheduled GitHub Action with repository secrets, or a notebook), sanitise it, and commit only the resulting JSON under `tools/<tool-id>/data/`.
- Load data with a relative path: `fetch('data/snapshot.json')`. Example of a collector kept next to its data: `tools/seo-agent/collect_similarweb.py` (reads the API key from an environment variable and writes `data/similarweb.json`).
- Do not commit raw exports, personal data or customer data. Treat everything committed as public, because the password gate only hides the page, not the files.
- Say clearly in the interface when numbers are estimates or when a source is not connected. Never invent numbers.
- Do not load third-party scripts. The checker rejects them.

## Pull request checklist

- Started from `tools/_template/` and kept `gate.js` first in `<head>`
- Registered in `tools.json`
- Tokens only: no hex colours, no text under 12px
- No keys, tokens or raw sensitive data
- `python3 scripts/check.py` passes
- Clicked through every screen on desktop and at about 390px

## Do not

- Edit `assets/js/gate.js`, `assets/css/xm.css`, `assets/js/shell.js`, `index.html` or other tools unless the human asks.
- Change or print the shared password.
- Push to `main` directly. Always use a branch and a pull request.
- Add dependencies, build steps or a package manager.

---
applyTo: "**"
---
# Internal Tools - rules for AI assistants

This repo is a hub of small static tools (plain HTML/CSS/JS, no build step). Follow these rules when creating or editing a tool.

- Start from `tools/_template/`. Each tool lives in `tools/<tool-id>/` and is registered in `tools.json`.
- Load `gate.js` first in `<head>` and `assets/css/xm.css` for styling. Never write your own login.
- Use only the design tokens and components in `assets/css/xm.css` (see `docs/guide.html`). No hex colours, no font under 12px, no new fonts, no CSS frameworks.
- Tool-specific CSS goes in `tools/<tool-id>/tool.css`, with class names prefixed by the tool id.
- Use `XMTools` from `assets/js/shell.js` for the logo, icons, top bar and toasts.
- Never put API keys, tokens or passwords in the repo or in browser code. Collect data server-side and commit only sanitized JSON under `tools/<tool-id>/data/`.
- Do not load third-party scripts. Escape any dynamic text with `XMTools.esc`.
- Full details for building a tool are in `docs/agent-brief.md`. Run `python3 scripts/check.py` before finishing.

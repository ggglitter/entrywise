---
status: draft
---
# Technical specification

## Architecture and map
Static HTML/CSS, ES modules and no third-party runtime packages.
- docs/index.html and styles.css: interface.
- docs/core.mjs: independent rule engine and receipt validation.
- docs/app.mjs: events, rendering and localStorage.
- docs/opportunities.json: dated public facts and source links.
- tests/core.test.mjs: eligibility boundaries and receipt transitions.

## Data flow
Public facts plus local profile become individual checks and a decision.
Local plans and receipts persist to browser storage, reload and JSON export.
Participant names, contact information and credentials are absent from assets.

## Receipt contract
ID, registration/submission type, HTTP(S) URL, recorded time and user_recorded
source. Demo mode is isolated. No organizer verification is claimed.

## Verification and run
Node built-in tests cover unknown age, students, region, deadlines, AI bans and
receipt counts. Browser checks must prove save/reload/readback and inspect
desktop, narrow, empty and validation states.
Run: python3 -m http.server 8317 --directory docs
Open: http://127.0.0.1:8317/
Append ?demo=1 for a labelled example workspace.

## Sharing
Target competition needs a public repo and a 1–3 minute demonstration video.
These do not replace participant review or personal submission answers.

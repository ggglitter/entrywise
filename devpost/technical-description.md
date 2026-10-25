# Technical submission material

Working title: Entrywise

Tagline: Source-linked competition checks with separate plans, registrations and submissions.

## Functionality
Entrywise helps independent creators inspect recorded competition requirements
before making a work. A deterministic engine checks residence, student status,
age uncertainty, AI or camera requirements, membership and exact cutoffs. Each
decision shows its failed or unknown conditions and links to official rules.

A creator can save an opportunity, record a typed receipt after a platform action,
reload and export the local data. Saving a plan does not increase the registration
or submission totals. The app does not claim to verify organizer receipts.

## Implementation and validation
New HTML, CSS and JavaScript implementation created on 25 October 2026 with an
AI coding assistant. No framework, paid API, telemetry or server account is
required. Organizer pages collected earlier that day are attributed per record.
The Devpost Learn Skill Pack informed scope, PRD, specification and build order.

Forty-five core/workspace tests passed. Actual browser checks covered student exclusion,
different registration and delivery cutoffs, plan counts, receipt confirmation,
save and reload, separate submission counts, empty search and narrow layout.
The demo uses an isolated workspace and visibly labelled example.org receipts.
Version 0.2 adds export/restore with preview, cancel and undo; local-receipt
correction; and cross-tab refresh. The two-tab stale-overwrite defect was
reproduced before repair and the saved plan and receipt were retained afterward.

## Testing instructions
Run python3 -m http.server 8317 --directory docs from the repository root.
Open http://127.0.0.1:8317/?demo=1. Use Reset demo to clear example data.
Search LaunchPad with Student set to Not a student to inspect a failed rule.
Search ARC and save ARC-AGI-2; verify that only the plan count increases.
Record a labelled example receipt, reload and search ARC again to read it back.
Use My data to export, then restore a JSON backup. Inspect the preview, cancel
once and confirm once. Read the same receipt after reload. Remove a local
receipt and use Undo. Open a second tab and verify that updates refresh there.

## Remaining entry requirements
This file describes technical facts. Applicant personal reflection and exit
survey are not fabricated. A public YouTube or Vimeo video URL and an actual
Devpost submission receipt are still required before calling the entry complete.

# Entrywise

A local-first opportunity desk that pairs competition requirements with an
explicit rule trace, then keeps saved plans, registration receipts and submission
receipts separate.

Working title proposed by an AI assistant. New implementation started on
25 October 2026; no existing application code reused. Public research collected
earlier that day is attributed to organizer URLs in the data.

## Run
From project root: python3 -m http.server 8317 --directory docs
Open http://127.0.0.1:8317/
Append ?demo=1 for an isolated, labelled demonstration workspace.

## Test
node --test tests/*.test.mjs

## What it does
- Checks residence, age uncertainty, school, membership, creation method,
  exact deadlines and separate registration cutoffs.
- Explains every recorded failed or unknown condition.
- Saves plans and separately typed receipts locally, with reload and export.
- Restores reviewed backups, rejects malformed or mixed demo/personal records,
  and lets the user undo a replacement or a mistaken local receipt.
- Refreshes records across open tabs, so an older tab does not overwrite a newer
  saved workspace through an ordinary profile change.
- Keeps registered entries usable after a separate join cutoff, until delivery
  closes, and displays both UTC and the browser's local time.
- Links directly to public rules and preserves the review date.

## Boundaries
The app does not register anyone, accept terms, verify receipts with a platform
or guarantee eligibility. Sources may change. Can prepare means no failed or
unknown recorded condition; it is not an organizer's decision.

## Development and authorship
Implementation and technical documentation are AI-assisted. The official
Devpost Learn Skill Pack was read and used for technical planning and build
structure. Learner interviews, approval, reflection and exit survey are not
claimed complete. Private participant details are excluded from publication.
Source: https://github.com/challengepost/learn-ai-basics

Version 0.2 includes a new 86-second edited live browser demonstration at
docs/media/entrywise-demo.mp4; docs/demo.html provides a video player.
The capture contains 326 actual browser frames and shows clicks, typing, reload,
export, reset, backup preview/recovery and narrow-screen navigation. It is edited,
with a capture cadence of about four frames per second and English captions.
No invented personal reflection, music or cloned voice is used.

All 45 core/workspace tests passed. Current actual browser evidence, source
hashes and limitations are in devpost/qa-results.json; the prior QA record is
preserved under devpost/demo/history/.

Devpost requires a public YouTube or Vimeo video link, which has not yet been
uploaded. Participant review and personal submission fields remain outstanding.
A repository or hosted preview is not a completed contest entry.

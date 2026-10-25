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

A technical screenshot walkthrough is available at
devpost/demo/entrywise-demo.mp4 (82 seconds). It shows actual captured UI states;
it is not a continuous screen recording. Browser QA evidence and limitations are
in devpost/qa-results.json. Devpost requires a public YouTube or Vimeo video link,
which has not yet been uploaded. Participant review and personal submission
fields remain outstanding. A repository is not a completed contest entry.

---
name: qa-master-tester
description: Use this skill any time the user asks to test, QA, audit, verify, or check a piece of software, app, API, or codebase — including phrases like "test this app," "is this ready for production," "find bugs," "run QA," "check if this works," "make sure nothing is broken," or "can we ship this." Also trigger it proactively after a large batch of code changes, before a release, or when the user asks "what's left to fix." This skill turns the agent into a senior QA engineer with real software-development experience — not a checklist-reader. It performs black-box testing, module-level (unit-equivalent) testing, and integration testing using industry-standard techniques, keeps a persistent test-state so repeat runs are incremental instead of starting from zero, produces a single combined TESTING_RESULTS.md report classifying every area as working / broken / untested with concrete fixes or alternatives for anything broken, and ends with an explicit GO / NO-GO production verdict addressed to whoever asked for the test. Always prefer this skill over ad-hoc manual testing whenever the request is about software quality, correctness, or release-readiness.
---

# QA Master Tester

## Who you are when this skill is active

You are not a form-filler running a script. You think like a senior QA engineer who has
also shipped production code — someone who knows *why* a race condition in a form
submit handler causes duplicate orders, not just that "the button was clicked twice."
Every finding you produce should read like it came from someone who has debugged this
exact class of bug before: specific, causal, and paired with a real fix or a real
workaround. Never write a finding you couldn't defend in a bug-triage meeting.

## The core loop

```
BOOTSTRAP → DISCOVER → PLAN → EXECUTE → LOG DEFECTS → FIX (if able) →
REGRESSION SMOKE → REPORT → VERDICT → NOTIFY
```

---

### Step 0 — Bootstrap (incremental state, don't retest blindly)

Before testing anything, look for a state file: `.qa/test-state.json` in the project
root (create the `.qa/` folder if this is the first run). This file is your memory
across runs — it's what makes you fast on the second and third pass instead of
re-testing the entire app every single time.

State file shape:

```json
{
  "last_run": "2026-08-07T10:00:00Z",
  "codebase_fingerprint": "<git rev or hash of tracked files>",
  "modules": {
    "auth/login": { "status": "pass", "last_tested": "...", "technique": ["boundary","negative"], "notes": "" },
    "checkout/payment": { "status": "fail", "issue_ids": ["QA-014"], "last_tested": "..." },
    "profile/avatar-upload": { "status": "untested", "reason": "no test hooks found" }
  },
  "open_issues": ["QA-014", "QA-022"],
  "resolved_issues": ["QA-001", "QA-002"]
}
```

Rules for using it:
- If the state file exists, diff the current codebase fingerprint against the stored
  one (`git diff --stat` against the last tested commit, or file mtimes/hashes if
  there's no git). Only modules touched by the diff — plus anything already marked
  `fail` or `untested` — go back into full testing. Everything marked `pass` and
  untouched gets a **fast smoke check only** (does it still load / respond / return
  the expected shape), not a full re-run of every technique.
- If no state file exists, this is a first run: everything is in scope, and you build
  the state file as you go.
- Never silently skip a module because it's not in the state file — that's exactly the
  "completely neglected" gap the user cares about most. Untracked = untested = flagged.

---

### Step 1 — Discover

Map the system before touching it:
- Enumerate entry points: pages/routes, API endpoints, CLI commands, background jobs,
  webhooks, scheduled tasks.
- Enumerate modules/components and how they call each other — build a mental (or
  written) dependency map. This is what lets you reason about integration testing
  instead of only testing things in isolation.
- Identify external dependencies (DB, third-party APIs, auth providers, payment
  gateways, file storage) and note which ones you can hit for real vs. must mock or
  stub.
- Note what test infrastructure already exists (test suites, fixtures, seed data,
  staging environment) — use it, don't reinvent it.

Read code where useful, but don't assume the code is the truth — behavior is the
truth. Prefer running the thing over reading the thing wherever both are possible.

---

### Step 2 — Plan: pick techniques per module, on purpose

Don't apply every technique everywhere — that's how you get a bloated report nobody
reads. Match the technique to what the module actually does:

| Technique | Use it when | What it catches |
|---|---|---|
| **Equivalence partitioning** | Any input field or param | Whole classes of bad input, without testing every value |
| **Boundary value analysis** | Numeric/length limits, pagination, quotas | Off-by-one errors, overflow, empty/max edge cases |
| **Negative / error-path testing** | Anything a user can misuse | Missing validation, unhandled exceptions, bad error messages |
| **Decision table testing** | Business logic with multiple conditions (discounts, permissions, pricing) | Wrong combinations producing wrong outcomes |
| **State transition testing** | Anything with a lifecycle (order status, auth session, workflow steps) | Illegal state jumps, stuck states, missing transitions |
| **Black-box / exploratory** | Whole user flows, first pass on unfamiliar areas | Real-world usage bugs that unit tests miss |
| **Module / component testing** | Each module in isolation with mocked dependencies | Logic bugs local to one unit |
| **Integration testing** | Two or more modules talking to each other, contracts between services | Interface mismatches, broken assumptions between teams' code |
| **Regression / smoke testing** | After any fix, before final sign-off | New change broke something that used to work |
| **Security-adjacent sanity checks** | Auth, input handling, file uploads, admin actions | Obvious injection/auth-bypass/IDOR-shaped issues (flag for deeper security review, don't try to be a full pentest) |
| **Performance sanity** | Loops over data, list endpoints, file processing | N+1 queries, unbounded loops, obviously missing pagination |

For integration testing specifically, pick a strategy that matches the architecture:
bottom-up (test leaf modules first, then their callers), top-down (test the
entry-point flow first, stubbing what's underneath), or a mixed/sandwich approach —
say which one you used and why in the report.

---

### Step 3 — Execute

For every module in scope this run:
1. State what you're about to test and with which technique(s) — one line, before you
   do it. This is what "in detail, with tracing" means: a reader should be able to
   follow your reasoning, not just see a pass/fail at the end.
2. Actually exercise it — run the app/API/CLI, don't simulate results from reading
   code. If you truly cannot execute (no environment access), say so explicitly in the
   report instead of guessing at a result.
3. Record the outcome immediately against that module in the state file, before moving
   on — this is what makes step 0 fast next time.

Do this module by module, then do at least one full-flow black-box pass that crosses
module boundaries the way a real user would (signup → onboarding → core action →
payment → logout, or whatever the app's actual critical path is).

---

### Step 4 — Log every defect the same way

Every issue gets an ID (`QA-###`, incrementing) and this shape:

```
### QA-014 — [Severity] Short title
Module: checkout/payment
Technique that found it: boundary value analysis
Steps to reproduce:
1. ...
2. ...
Expected: ...
Actual: ...
Root cause (best hypothesis): ...
Suggested fix: <concrete, specific — a line of code, a validation rule, a config change>
If fix isn't feasible right now, alternative/workaround: ...
```

Severity scale — use it consistently:
- **Critical (P0):** breaks a core flow, data loss/corruption, security exposure, blocks release.
- **High (P1):** major feature broken but there's a workaround, or it's an edge case in a core flow.
- **Medium (P2):** minor feature broken, cosmetic-but-confusing, inconsistent behavior.
- **Low (P3):** polish, nice-to-have, non-blocking.

Also explicitly log **neglected areas** — modules or flows that exist in the codebase
but have no tests, no coverage, and weren't exercised this run (and why: no test hooks,
no staging data, out of scope, etc). This is the "what's completely neglected" the user
explicitly wants surfaced — don't let it hide as a silent omission.

---

### Step 5 — Fix, if you're able to

If you have code-editing tools available and the fix is low-risk and well-understood
(the kind of fix you'd approve in a one-line PR review), apply it. Then:
- Re-test *only the affected module and its direct integration points* — not the
  whole app. This is the "don't retest what's already tested" rule in practice.
- Update the state file: move the issue to `resolved_issues`, mark the module `pass`.
- If the fix is risky, architecturally significant, or you're not confident, don't
  apply it — log it with your suggested fix and let a human decide.

---

### Step 6 — Regression smoke pass

Once fixes are in, do one fast full-app smoke pass: does every previously-passing
module still behave as expected (not a full re-test, just "still alive and correct on
the happy path"). This is what catches a fix in module A quietly breaking module B.

---

### Step 7 — Report: one combined file

Write everything to a single `TESTING_RESULTS.md` (or update it if it already exists
from a prior run — keep history, don't erase past runs; append a new dated section).
Structure:

```markdown
# Testing Results — <app/project name>
Run date: <date> · Run #<n> · Scope: <full / incremental — modules X, Y, Z>

## Summary
<2-4 sentences: overall health, what changed since last run, headline risk if any>

## Verdict: GO / NO-GO for production
<one paragraph justifying it — see Step 8 for the rule>

## What's working
- <module>: <what was verified, techniques used>
...

## What's broken
- QA-### ... (full defect entries from Step 4, sorted by severity)

## What's untested / neglected
- <module/flow>: <why, and what's needed to close the gap>

## Fixed this run
- QA-### — <what was changed, re-test result>

## Recommendation if NO-GO
<what specifically has to happen before this can ship — ordered by priority>
```

---

### Step 8 — Verdict and notify

The GO/NO-GO rule: **NO-GO if any open Critical or High issue exists in a core flow.**
Everything else (Medium/Low open issues, non-critical neglected coverage) can ship
with a documented follow-up — say so explicitly rather than blocking on it.

Close your reply to the user (the person who asked for the run — "who ordered the
plan to use that screen") with a short, direct status, not a re-dump of the whole
report:

> **GO** — no blocking issues. 3 minor items logged for later. Full report in
> `TESTING_RESULTS.md`.

or

> **NO-GO** — 2 critical issues in checkout (QA-014, QA-016) need fixing before this
> can ship. Everything else is clean. Full report in `TESTING_RESULTS.md`.

Don't ask the user to go read the file to find out if they can ship — tell them
directly, then point to the file for detail.

---

## Ground rules

- Never mark something "pass" without actually exercising it. A guess dressed as a
  result is worse than an honest "untested."
- Never re-run full-technique testing on a module the state file shows as passing and
  unchanged — smoke-check it and move on. Full re-tests only for: changed code, prior
  failures, or explicit user request ("test everything from scratch").
- Every "broken" finding needs either a fix or a workaround — "it's broken" alone is
  not a complete finding.
- If you can't execute the software at all (no environment, no access), say that
  plainly up front rather than producing a report that looks executed but wasn't.
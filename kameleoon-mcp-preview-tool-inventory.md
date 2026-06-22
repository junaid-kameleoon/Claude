# Kameleoon Preview MCP — Tool Inventory & Test Report (public summary)

> Sanitized summary for external sharing. Internal endpoints, environment identifiers, and object IDs removed; the full report is held internally.

- **Date:** 2026-06-22
- **Environment:** Kameleoon MCP, preview.
- **Tool count:** **37** (up from 34 at first QA — added `experiment_create`, `experiment_duplicate`, `experiment_lifecycle_update`).
- **This round:** verified the new experiment write tools and re-checked the fixed issues. All disposable test objects were removed (no leftovers — the new lifecycle `deleted` status closed the earlier experiment-cleanup gap).

## Full tool list (37)

### Experiments (7)
| Tool | Type | Status |
|---|---|---|
| `experiment_list` | read | ✅ |
| `experiment_get` | read | ✅ (open: structured-output validation on null `baseURL`) |
| `experiment_code_get` | read | ✅ |
| `experiment_results_get` | read | ✅ (results pipeline fixed) |
| `experiment_create` | write | ✅ |
| `experiment_duplicate` | write | ✅ **new — verified** |
| `experiment_lifecycle_update` | write | ✅ **new — verified** (started/resumed/paused/stopped/deleted) |

### Feature flags — core (9)
`feature_flag_list` · `get` · `create` · `duplicate` · `delete` · `enable` · `disable` — ✅
`feature_flag_activity_logs_get` — ✅ (open: `createdAt` sort key rejected)
`feature_flag_experiment_results_get` — ✅ (fixed; `default_prompt` pending core release)

### Feature flags — rules / variations / variables (6)
`feature_flag_rule_targeted_create` · `experimentation_create` — ✅
`feature_flag_rule_progressive_create` — ✅ (open: timezone inconsistency)
`feature_flag_variation_create` · `variable_create` · `variation_variable_set` — ✅

### Goals (7)
`goal_list` · `get` · `search` · `update` · `delete` — ✅
`goal_create` — ✅ (fixed: CLICK-without-url & RATIO_METRICS no longer crash; RATIO_METRICS now returns a clean validation error but still isn't creatable — no ratio-metrics param)
`goal_update_type` — ✅ (fixed: no longer wipes tags)

### Segments (4)
`segment_list` · `get` — ✅
`segment_create` — ✅ (open: invalid-enum error message)
`segment_delete` — ✅ (fixed: in-use guard now blocks, with `force=true` opt-in)

### Sites (1)
`site_list` — ✅

### Targeting rules (3)
`targeting_rule_list` · `get` · `create` — ✅
*(no `targeting_rule_delete` — pending design; upstream has no DELETE)*

## This round's detail

**New tools**
- `experiment_duplicate` — clones an experiment into a fresh **draft** with config/variations/goal/targeting copied. ✅
- `experiment_lifecycle_update` — full lifecycle verified on one experiment: `started → paused → resumed → stopped → deleted`. Guards work (`confirm=true` required for stop/delete; delete blocked while running) and every transition returns a human-readable confirmation. ✅ This consolidated lifecycle tool also removes the need for a standalone experiment-delete.

**Fix re-verification**
- `goal_create` NPE (CLICK-without-url / RATIO_METRICS) — **fixed**.
- `segment_delete` in-use guard, `goal_update_type` tag preservation, results-endpoint crash, and results readiness timeout — all remain **fixed**.

## Notes for the dev (implementation observations)

Details from the lifecycle/duplicate responses that may be useful:

- **Delete only works from `DRAFT` or `STOPPED` — not `PAUSED`.** Calling `experiment_lifecycle_update status=deleted` on a *paused* experiment returns a downstream `400: "You can delete experiments only with statuses [DRAFT, STOPPED]"`. This contradicts the tool's own description ("running experiments are blocked until paused **or stopped**"). Suggest aligning the doc/guard (require `STOPPED`/`DRAFT`) and having the MCP return a clean validation error for the paused→delete case instead of passing the raw 400 through. Workaround: stop before deleting.
- **Idempotency works.** Re-issuing the current status (e.g. `started` on an already-active experiment) returns `alreadyInTargetState: true`, `upstreamAction: null`, no upstream write, with a clear message ("…is already running; no upstream change was made").
- **`currentStatus` casing is inconsistent.** `started`/`paused`/`stopped` return lowercase (`active`, `paused`, `stopped`), but `deleted` returns uppercase `DELETED`. Minor — may want to normalize.
- **`upstreamAction` mapping** (per transition): `started→ACTIVATE`, `paused→PAUSE`, `resumed→RESUME`, `stopped→STOP`, `deleted→null` (also `null` on idempotent no-ops).
- **`experiment_duplicate` copy naming.** The clone is named `"Test (copy of <original name>)"` — the leading `"Test "` looks unintended; worth checking the upstream copy-naming convention.

## Re-test — invalid-enum & `experiment_get` schema (2026-06-22)

Both were reported fixed but flagged as possibly still reproducible. Re-ran the exact repros:

- **`experiment_get` null `baseURL` — now PASSES.** `experiment_get` on a draft experiment with `baseURL: null` now returns `status: SUCCESS` with `baseURL: null` in the payload; the earlier `structuredContent does not match tool outputSchema [/experiment/baseURL: null found, string expected]` no longer occurs. Looks fixed on current preview — if it still reproduces, likely a stale deploy or a different nullable field.
- **Invalid-enum messages — now FIXED (re-verified later on 2026-06-22, after a follow-up deploy):**
  - `segment_create` ✅ — unrecognized `DEVICE_TYPE` (`device:"MOBILE"`) returns `…device: invalid value 'MOBILE'. Accepted values: DESKTOP, TABLET, PHONE`.
  - `goal_create` ✅ — after the deploy, invalid `matchType` (`BANANA`) → `matchType: invalid value 'BANANA'. Accepted values: CONTAINS, CORRESPONDS_EXACTLY, REGULAR_EXPRESSION`, and invalid `scrollType` (`INVALID_SCROLL`) → clean message with accepted values. The raw 500/Jackson exception is gone; the fix is general across goal-param enums.

## Not yet tested
- **Winning-variant-to-code prompt** (`kameleoon_implement_winning_variation` / the docs' "end-to-end automation" system prompt). QA so far has driven the MCP **tools**; this is a prompt-driven, code-generating workflow (get results → get variation code → re-implement as React → gate behind a new flag), so it needs an *interactive* run in a real repo with human review — not agent tool-assertions. **Open QA item.**
  - **No "declare winner" API exists.** Per the Automation API docs, the winner is *computed* statistically (reliability >95% + positive improvement rate vs the reference on the primary goal); there is no endpoint to set one. So Mode A (`strict_winner_only`, requires `winner.status == "clear_winner"`) can't be staged on preview without real seeded traffic. Closest manual actions are diverting 100% traffic to a variation or stopping the experiment — neither sets a `clear_winner` status.
  - **Testable via Mode B (`manual_variation_conversion`)** — pass a fallback variation id, which skips the winner requirement. Needs an experiment that actually has variation code / a PBX prompt to transpose (most preview experiments inspected have empty variation code), so we'd seed/find one or test against a demo experiment with real code.

## Still open
- Progressive-rule timezone inconsistency
- `feature_flag_activity_logs_get` `createdAt` sort key
- `experiment_lifecycle_update` delete-from-paused returns a raw 400 / contradicts the doc (see dev notes)
- `default_prompt` on the flag results tool (pending core release)
- `targeting_rule_delete` (pending design — upstream has no DELETE)
- Minor: `goal_create` cannot create `RATIO_METRICS` goals (tool lacks the ratio-metrics param) — now fails gracefully

*Resolved since first report: `experiment_get` null-`baseURL` schema validation; invalid-enum validation messages (`segment_create` + `goal_create`).*

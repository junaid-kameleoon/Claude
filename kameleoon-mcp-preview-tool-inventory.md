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

## Still open
- Progressive-rule timezone inconsistency
- `experiment_get` structured-output validation (null `baseURL`)
- `feature_flag_activity_logs_get` `createdAt` sort key
- Invalid-enum validation messages
- `default_prompt` on the flag results tool (pending core release)
- `targeting_rule_delete` (pending design — upstream has no DELETE)
- Minor: `goal_create` cannot create `RATIO_METRICS` goals (tool lacks the ratio-metrics param) — now fails gracefully

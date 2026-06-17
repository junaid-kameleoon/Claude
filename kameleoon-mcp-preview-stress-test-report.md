# Kameleoon Preview MCP — Stress Test Report (public summary)

> Sanitized summary for external sharing. Internal endpoints, environment identifiers, object IDs, and raw stack traces have been removed; the full report with those details is held internally.

- **Tester:** Codex
- **Date:** 2026-06-17
- **Target:** Kameleoon MCP server, preview environment (production-like test site).

## Summary

The preview MCP server connected and authenticated successfully and exposed 34 tools. A stress pass was run across every discovered tool — positive read calls, negative validation calls, and controlled write operations against disposable feature-flag, goal, and segment objects.

Overall result:

- Tools discovered: 34
- Main stress test cases: 63
- Passing cases: 59
- Failing cases: 4
- Suspicious invalid-input acceptances: 0
- Cleanup status: successful

Feature flag, variation, variable, rule creation, goal CRUD, segment CRUD, and most list/get/search paths behaved well. The main problems are concentrated in **experiment retrieval/results** and one documented **activity-log sort field**.

## Issues Found

### P1 — `experiment_results_get` returns a downstream 500 for a known experiment

Calling `experiment_results_get` with a valid experiment ID returns a downstream `500` (`DOWNSTREAM_5XX`): the downstream results/data service fails to initialize due to a **logging-library version conflict** (initialization error). 

**Impact:** experiment result retrieval can fail completely for valid experiment IDs, blocking a key MCP use case (asking an agent to summarize experiment performance). Reproduced in a follow-up probe; it is a backend dependency/runtime mismatch, not a user-input validation problem.

*(This corroborates the same root cause found in the Claude QA report — see P0 there.)*

### P1 — `feature_flag_experiment_results_get` blocks ~56s, then returns `NOT_READY`

For a valid flag + active experiment in the production environment, the tool waited ~56 seconds and then returned `DOWNSTREAM_ERROR` / results status `NOT_READY` ("results not ready after 60 seconds; please retry later").

**Impact:** effectively unreliable for agent workflows — it can block for nearly a minute and still return no usable result, which is painful in interactive clients and likely to cause timeouts in stricter MCP clients. The backend appears to start an async report-generation flow (it returns a data handle) but doesn't finish in time.

**Recommended fix:** return a structured async/pending response earlier, or expose a follow-up polling tool using the returned handle.

### P2 — `experiment_get` fails structured-output validation for valid experiments

A successful `experiment_get` response fails MCP structured-output schema validation:

```text
Validation failed: structuredContent does not match tool outputSchema.
[/experiment/baseURL: null found, string expected, /status: must be the constant value 'ERROR']
```

**Impact:** clients that enforce MCP structured-output validation can treat *successful* `experiment_get` responses as tool failures, making the tool fragile across agent clients even when the underlying lookup succeeds.

**Likely cause / fix:** the output schema is too strict for nullable fields such as `experiment.baseURL`, and the success/error schema union appears misconfigured (the success branch should accept `status: "SUCCESS"`). Allow nullable fields; fix the union.

### P2 — `feature_flag_activity_logs_get` advertises a `createdAt` sort key the backend rejects

The schema advertises `sortKey: ["createdAt", "timestamp"]`, but sorting by `createdAt` returns `DOWNSTREAM_4XX` ("Cannot filter or sort by given field: createdAt"). No sort key works; `timestamp` works; `createdAt` fails.

**Impact:** the schema invites clients to send a value the downstream API rejects — and agents will likely pick `createdAt` since it's the first advertised enum value and sounds natural.

**Recommended fix:** remove `createdAt` from the enum, or map it to the supported field before calling the backend.

## Tooling Gap

### P3 — `targeting_rule_create` has no matching delete tool

The surface exposes `targeting_rule_create`, `targeting_rule_get`, and `targeting_rule_list`, but no delete/update. A valid create test would leave a persistent targeting rule attached to an experiment with no MCP cleanup path (so it was only tested with invalid inputs).

**Impact:** makes safe automated testing and agent rollback harder; a create-only targeting-rule surface is risky for customer-facing agentic workflows.

**Recommended fix:** add `targeting_rule_delete`, or clearly mark `targeting_rule_create` as requiring manual cleanup outside MCP. *(Matches the gap noted in the Claude QA report.)*

## Passing Areas

Behaved well in the stress test:

- MCP server initialization and tool discovery
- `site_list`, `feature_flag_list`, `feature_flag_get`
- `feature_flag_create` / `delete` / `enable` / `disable` / `duplicate`
- `feature_flag_variation_create`, `feature_flag_variable_create`, `feature_flag_variation_variable_set`
- `feature_flag_rule_targeted_create` / `progressive_create` / `experimentation_create`
- `goal_list` / `get` / `search` / `create` / `update` / `update_type` / `delete`
- `segment_list` / `get` / `create` / `delete`
- `targeting_rule_list`, `targeting_rule_get`

Negative validation also behaved well across the cases tested, including: bad site code, missing required fields, nonexistent flag/goal, invalid activity-log enum, invalid experiment/variation ID, duplicate flag/variation key, invalid variable type, missing variable assignment, invalid environment key, invalid rollout exposition/frequency, invalid experiment traffic split, nonexistent duplicate source, empty goal search, invalid goal type, invalid segment JSON, invalid targeting-rule config, and invalid sort order.

## Cleanup

All disposable objects (feature flags, goal, segment) were deleted successfully, and follow-up searches confirmed the disposable names no longer return results.

## Non-Blocking Observation

Although the proxy is invoked as `mcp-remote@0.1.37`, the client info logged by the proxy reports `via mcp-remote 0.1.36`. This didn't block testing, but could confuse debugging/support when confirming the exact proxy version in logs.

# Kameleoon MCP — Preview QA Report (public summary)

> Sanitized summary for external sharing. Internal endpoints, environment identifiers, backend service names, and raw stack traces have been removed; the full report with those details is held internally.

- **Target:** Kameleoon MCP server, preview environment.
- **Date:** 2026-06-15
- **Sites tested (2):**
  - **Site A** — an empty project, used to build a test fixture from scratch.
  - **Site B** — a rich, production-like project (8 flags, 7 experiments, 14 goals, 13 segments, 18 targeting rules, 8 environments) — used to test reads against real data and to re-confirm findings.
- **Scope:** All 34 tools exercised end-to-end on each site (reads against existing data; writes via a disposable fixture — flag + variations + variables + all 3 rule types + goal + segment + targeting rule — then torn down).
- **Result:** **32 / 34 tools PASS**, **2 FAIL** (both statistical-results endpoints — same root cause, confirmed infrastructural).
- **Cross-site consistency:** every behavior below — including all issues — reproduced **identically on both sites**.

---

## Fix verification log (updated 2026-06-19)

Retests after the team's fixes. Most of the original findings are now resolved.

| Finding | Status |
|---|---|
| Results endpoints crash (logging-library conflict) | ✅ **Fixed & verified** — no crash; results return successfully |
| Results readiness timeout (`NOT_READY` after ~60s) | ✅ **Fixed & verified** — now returns results promptly |
| `segment_delete` silently broadened in-use rules | ✅ **Fixed & verified** — now blocks with a clear error and lists the affected experiments; `force=true` opt-in retained |
| `goal_update_type` wiped tags | ✅ **Fixed & verified** — tags now preserved across a type change |
| `goal_create` 500 on CLICK-without-url / RATIO_METRICS | 🟡 **Fix prepared, not yet deployed** — still reproduces as of 2026-06-19 |
| Invalid-enum / structured-output / sort-key items | ⏳ Open — pending |

**New in this round:** an `experiment_create` tool was added and **works** (creates a draft experiment of a chosen type, attaches a goal, auto-adds a default variation). Two gaps noted: there is still no `experiment_delete` (no way to remove a created experiment via MCP), and `experiment_create` auto-creates a default targeting rule, which blocks attaching a custom segment rule afterward.

---

## Suggested next tasks / fixes (ticket backlog)

Prioritized; each maps to a finding below.

### P0 — blocker
- [ ] **Fix the logging-library version conflict that breaks all results endpoints.** The downstream results/data service fails to initialize because a newer call site invokes a logging-library method signature that the version on the classpath does not provide. Affects both `experiment_results_get` and `feature_flag_experiment_results_get` on all sites. *(Issue #1)*
- [ ] **Add regression coverage for results retrieval** once fixed — assert a real flag with a primary goal + traffic returns stats, not a 500.

### P1 — data-integrity / safety
- [ ] **Guard `segment_delete` against in-use segments.** Either block deletion when the segment is referenced by experiments/personalizations/feature flags, or require a `force` flag. Today it silently rewrites dependent rules from a targeted audience to "all visitors." *(Issue #2)*
- [ ] **Surface affected rules on delete** — return the list of rules/experiments that referenced the segment so the caller knows what changed.
- [ ] **Stop `goal_update_type` from wiping tags.** Preserve `tags` (and other non-type properties) across a type change; only replace type-specific config. *(Issue #3)*

### P2 — correctness / consistency
- [ ] **Normalize progressive-rule timezone handling.** Make the `releaseDateTime` input timezone explicit and return a single consistent stored value; today two fields in the same response disagree by the server offset, and the reported timezone differs across rule types. *(Issue #4)*

### P3 — API surface / DX
- [ ] **Add a `targeting_rule_delete` tool.** Create exists but there is no delete — which left test residue that needed manual cleanup. *(Issue #6)*
- [ ] **Improve enum validation messages.** For an invalid leaf enum value, report `invalid value '<x>'` and list accepted values, instead of `must not be null`. *(Issue #5)*
- [ ] **Confirm `default_prompt` on `feature_flag_experiment_results_get`** lands with the upcoming core release (not present yet — expected).

---

## Summary

| Area | Tools | Pass | Fail |
|---|---|---|---|
| Sites | 1 | 1 | 0 |
| Experiments | 4 | 3 | 1 |
| Feature flags (core) | 9 | 8 | 1 |
| Feature flags (rules/variations/variables) | 6 | 6 | 0 |
| Goals | 7 | 7 | 0 |
| Segments | 4 | 4 | 0 |
| Targeting rules | 3 | 3 | 0 |
| **Total** | **34** | **32** | **2** |

The MCP server layer itself is solid — clean structured errors, correct pagination, accurate per-environment semantics. All failures/anomalies are in **downstream services or business logic**, not the MCP transport.

---

## Issues to action

### 1. CRITICAL — Statistical results endpoints are broken (backend logging-library conflict)
`experiment_results_get` and `feature_flag_experiment_results_get` both fail with a downstream `500`.

- **Confirmed infrastructural, not data-related.** A first run on an empty site (no goal/traffic) could have been a prerequisite failure — but a re-test on the production-like site hit a flag **with a primary goal, an ACTIVE experimentation rule, and real traffic** and returned the **exact same** initialization error.
- Root cause is a **logging-library version/classpath conflict** in the downstream results/data service — it throws an initialization error, so **no statistical results can be retrieved at all** (legacy experiments *or* feature-flag experiments, any site).
- The MCP layer behaves correctly (surfaces a clean typed error, no hang).

### 2. MEDIUM — Deleting an in-use segment silently broadens the targeting rule to "all visitors"
`segment_delete` succeeds on a segment referenced by a targeting rule, with **no block and no warning**, and the dependent rule is **silently rewritten** from its segment to "all visitors." Reproduced on both sites. The tool description implies a protection, but there is no guard. Silently flipping a rule from a targeted audience to everyone is dangerous in a real account. **Ask:** block deletion while in use (or at minimum return a warning listing affected rules).

### 3. LOW–MEDIUM — `goal_update_type` wipes tags as a side effect
Changing a goal's type clears all its tags. Reproduced on both sites (2→0 and 3→0). Tags are not type configuration and should survive a type change.

### 4. LOW — Progressive-rule release time: inconsistent timezone handling
A timezone-less `releaseDateTime` input is represented two different ways in the same response (differing by the server offset), and the reported timezone differs by rule type. Reproduced on both sites; pre-existing real flags also store rules under more than one timezone. **Ask:** make the input timezone explicit and report a single consistent stored value.

### 5. LOW — Misleading validation message for an invalid enum value
`segment_create` with an unrecognized device-type enum returned a "must not be null" error rather than "invalid value" — the validator maps the unknown enum to null and then reports nullness, hiding the real cause. Valid values work fine; not a blocker.

### 6. INFO — No `targeting_rule_delete` tool
Only list / get / create exist. There is no way to remove a targeting rule via MCP. If create is in scope, delete probably should be too. (This also caused leftover test residue that had to be cleaned up manually.)

---

## Confirmed-good behaviors (both sites)
- **Reads scale to real data:** full multi-environment flag configs with typed variables (boolean/number/string), per-variation overrides, multi-armed-bandit rules, and rollback conditions; complex segment condition trees plus a human-readable formatted string; list endpoints paginate and report counts.
- **Error handling:** clean `404` for bogus get-by-id; clean validation errors for bad input; results failures surfaced as typed errors rather than hangs.
- **Per-environment master switch:** enable/disable flip only the targeted environment (verified across an 8-environment flag); idempotent.
- **Variable model:** `variable_create` propagates the default to all variations; `variation_variable_set` overrides on one variation only (default preserved).
- **Duplicate:** copies variations/variables/rules and **starts disabled in every environment** regardless of source.
- **Activity log:** accurate, correctly ordered, type filter works, captures contributor + timestamps for every mutation.
- **All three rule types** (targeted / progressive / experimentation) create correctly, on both an empty project and a production-like project.

---

## Per-tool results (identical on both sites unless noted)

### Sites
| Tool | Status | Notes |
|---|---|---|
| `site_list` | ✅ | Project list returned. |

### Experiments
| Tool | Status | Notes |
|---|---|---|
| `experiment_list` | ✅ | Paginated summaries. |
| `experiment_get` | ✅ | Full config incl. embedded targeting rule; heavy code stripped as documented. |
| `experiment_code_get` | ✅ | Per-variation code payload. |
| `experiment_results_get` | ❌ | **Downstream 500 — logging-library init error (issue #1).** |

### Feature flags — core
| Tool | Status | Notes |
|---|---|---|
| `feature_flag_list` | ✅ | Filter + pagination verified. |
| `feature_flag_get` | ✅ | "All environments" mode returns every env. |
| `feature_flag_create` | ✅ | Default on/off variations; inherits all site environments. |
| `feature_flag_duplicate` | ✅ | Auto-generated key; starts disabled everywhere. |
| `feature_flag_enable` | ✅ | Per-env only. |
| `feature_flag_disable` | ✅ | Per-env only; transition verified. |
| `feature_flag_delete` | ✅ | Confirmation message; all test flags removed. |
| `feature_flag_activity_logs_get` | ✅ | Accurate; type/sort filters work. |
| `feature_flag_experiment_results_get` | ❌ | **Downstream 500 — logging-library init error (issue #1), confirmed with real goal+traffic.** `default_prompt` param not yet present (pending core release) — matches expectation. |

### Feature flags — rules / variations / variables
| Tool | Status | Notes |
|---|---|---|
| `feature_flag_variation_create` | ✅ | Custom variation added. |
| `feature_flag_variable_create` | ✅ | String & number tested; default propagates to all variations. |
| `feature_flag_variation_variable_set` | ✅ | Per-variation override; default preserved. |
| `feature_flag_rule_targeted_create` | ✅ | Active. |
| `feature_flag_rule_progressive_create` | ✅ | Planned w/ ramp config. **Timezone inconsistency — issue #4.** |
| `feature_flag_rule_experimentation_create` | ✅ | Split sums to 100; control recorded. |

### Goals
| Tool | Status | Notes |
|---|---|---|
| `goal_list` | ✅ | Usage counts returned. |
| `goal_get` | ✅ | Type-specific params returned. |
| `goal_search` | ✅ | Substring match. |
| `goal_create` | ✅ | URL goal w/ tags. |
| `goal_update` | ✅ | name / tags / multiple-conversions updated; tags preserved here. |
| `goal_update_type` | ✅ (caveat) | Type + params replaced correctly, **but clears tags — issue #3.** |
| `goal_delete` | ✅ | Confirmation. |

### Segments
| Tool | Status | Notes |
|---|---|---|
| `segment_list` | ✅ | Usage counts + types. |
| `segment_get` | ✅ | Condition tree + human-readable format. |
| `segment_create` | ✅ (caveat) | Geolocation & device-type trees accepted. **Misleading error on invalid enum — issue #5.** |
| `segment_delete` | ✅ (caveat) | Deletes **in-use** segments and silently rewrites the rule — **issue #2.** |

### Targeting rules
| Tool | Status | Notes |
|---|---|---|
| `targeting_rule_list` | ✅ | Rules listed incl. trigger configs. |
| `targeting_rule_get` | ✅ | 404 on bogus id; round-trips real rules. |
| `targeting_rule_create` | ✅ | Binds segment → experiment. |
| `targeting_rule_delete` | — | **Not exposed (issue #6).** |

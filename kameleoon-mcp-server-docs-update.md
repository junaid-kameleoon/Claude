# Kameleoon MCP server

Connect AI coding assistants directly to your Kameleoon project to automate experiment and feature-flag workflows.

The Kameleoon Model Context Protocol (MCP) server connects AI coding assistants directly to your Kameleoon project, enabling agentic workflows for experiments and feature flags. Beyond reading configurations and pulling variation code, your AI assistant can now build and manage experiments, goals, segments, and targeting rules, and run the full rollout lifecycle, without leaving the IDE.

## Features

After you connect the server, your AI agent can:

- Discover and inspect experiments, feature flags, goals, segments, and targeting rules.
- Build experiments end to end: create, duplicate, and drive the full lifecycle (start, pause, resume, stop, delete).
- Manage feature flags: create, duplicate, delete, enable/disable per environment, and read the change history.
- Configure flag delivery: add targeted and experimentation rules, custom variations, and typed variables.
- Create and maintain goals and audience segments.
- Analyze experiment and feature-flag-experiment results, and pull raw variation code (JavaScript and CSS).
- Automate the full implementation lifecycle, from winning variation to a gated production rollout.

### The primary workflow: winning experiment to production

The MCP server automates the "last mile" of implementation. Without leaving the IDE, you can instruct your AI assistant to:

1. Retrieve experiment results and identify the winning variation.
2. Extract the variation's raw code (JavaScript and CSS) from Kameleoon.
3. Convert the code into native, production-ready code (such as React components) aligned with the existing codebase.
4. Create a feature flag in Kameleoon.
5. Wrap the new implementation behind the feature flag.
6. Enable and validate the feature in production.

## Available tools

### Experiments

| Tool | Purpose | Example prompt |
|---|---|---|
| `experiment_list` | Find experiments by name or ID. | "List active experiments for site `d1alzzxd7k`." |
| `experiment_get` | Inspect an experiment's full configuration. | "Show the configuration for experiment `149640`." |
| `experiment_code_get` | Extract a variation's JavaScript, CSS, and shared common code. | "Pull the code for variation 1 of experiment `149640`." |
| `experiment_results_get` | Get statistical results and winner data. | "Summarize results for experiment `149640`." |
| `experiment_create` | Create a draft experiment. | "Create a CLASSIC experiment `Homepage hero` on site `d1alzzxd7k`." |
| `experiment_duplicate` | Clone an experiment into a new draft. | "Duplicate experiment `149640`." |
| `experiment_lifecycle_update` | Start, pause, resume, stop, or delete an experiment. | "Start experiment `149640`." |

### Feature flags

| Tool | Purpose | Example prompt |
|---|---|---|
| `feature_flag_list` | Find feature flags by key, name, or ID. | "List all feature flags for site `d1alzzxd7k`." |
| `feature_flag_get` | Get a flag's full configuration in an environment. | "Show the configuration for flag `new_search`." |
| `feature_flag_create` | Create a new flag (default `on`/`off` variations). | "Create a flag `ui_refresh` for site `d1alzzxd7k`." |
| `feature_flag_duplicate` | Clone an existing flag. | "Duplicate the `new_search` flag." |
| `feature_flag_delete` | Permanently delete a flag. | "Delete the flag `ui_refresh`." |
| `feature_flag_enable` | Turn a flag on in an environment. | "Enable `new_search` in production." |
| `feature_flag_disable` | Turn a flag off in an environment. | "Disable `new_search` in staging." |
| `feature_flag_activity_logs_get` | Read the flag change history (audit trail). | "Show recent feature-flag changes." |
| `feature_flag_experiment_results_get` | Get results for a flag's experimentation rule. | "Get results for the experiment rule on `new_search`." |

### Feature-flag delivery, variations, and variables

| Tool | Purpose | Example prompt |
|---|---|---|
| `feature_flag_rule_targeted_create` | Serve one variation to a percentage of traffic. | "Roll `new_search` out to 20% in production." |
| `feature_flag_rule_experimentation_create` | A/B test variations behind a flag. | "A/B test `off` vs `on` 50/50 on `new_search`." |
| `feature_flag_variation_create` | Add a custom variation to a flag. | "Add a `variant_a` variation to `new_search`." |
| `feature_flag_variable_create` | Add a typed variable (with default) to a flag. | "Add a STRING variable `label` defaulting to `Search`." |
| `feature_flag_variation_variable_set` | Override a variable's value for one variation. | "Set `label` to `Find` on `variant_a`." |

### Goals

| Tool | Purpose | Example prompt |
|---|---|---|
| `goal_list` | Browse goals on a site. | "List goals for site `d1alzzxd7k`." |
| `goal_get` | Inspect a goal's configuration. | "Show goal `271552`." |
| `goal_search` | Find a goal by name. | "Search goals for `checkout`." |
| `goal_create` | Create a goal (URL, CLICK, SCROLL, etc.). | "Create a URL goal matching `/thank-you`." |
| `goal_update` | Edit a goal's name, description, or tags. | "Rename goal `271552` to `Signup complete`." |
| `goal_update_type` | Switch a goal's type and type config. | "Change goal `271552` to a CLICK goal." |
| `goal_delete` | Delete a goal. | "Delete goal `271552`." |

### Segments

| Tool | Purpose | Example prompt |
|---|---|---|
| `segment_list` | Browse segments on a site. | "List segments for site `d1alzzxd7k`." |
| `segment_get` | Inspect a segment's condition tree. | "Show segment `200604`." |
| `segment_create` | Create an audience segment. | "Create a segment for desktop visitors." |
| `segment_delete` | Delete a segment (guarded when in use). | "Delete segment `200604`." |

### Sites and targeting rules

| Tool | Purpose | Example prompt |
|---|---|---|
| `site_list` | List the sites (projects) you can access. | "List my Kameleoon sites." |
| `targeting_rule_list` | List targeting rules on a site. | "List targeting rules for site `d1alzzxd7k`." |
| `targeting_rule_get` | Inspect a single targeting rule. | "Show targeting rule `118605`." |
| `targeting_rule_create` | Bind a segment to an experiment. | "Target experiment `149640` to segment `200604`." |

## Prerequisites

- Claude Code installed (`claude --version`)
- Node.js v18 or later (`node --version`)
- A Kameleoon account

## Setup (Claude Code)

### Step 1: Register the server

For your user profile (available in all projects):

```bash
claude mcp add --scope user kameleoon -- npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

For the current project only (adds a `.mcp.json` for team sharing):

```bash
claude mcp add kameleoon -- npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

Verify:

```bash
claude mcp list
```

**Expected:** `kameleoon: ... - ✗ Failed to connect` (normal before authentication).

### Step 2: Complete OAuth authentication

```bash
npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

1. A browser tab opens automatically. If not, open the URL printed in the terminal.
2. Sign in to your Kameleoon account.
3. Click **Authorize**.
4. When the browser shows success, press `Ctrl+C` in your terminal.

Verify:

```bash
claude mcp list
```

**Expected:** `kameleoon: ... - ✓ Connected`

A successful connection prints text similar to:

```
Connected to remote server using StreamableHTTPClientTransport
Local STDIO server running
Proxy established successfully between local STDIO and remote StreamableHTTPClientTransport
```

### Step 3: Start a new Claude Code session

Claude Code only exposes a newly added MCP server in sessions started after you register it. Close the current chat and open a new one.

### Step 4: Verify the connection

In a new conversation, try:

- "List my Kameleoon sites."
- "List my feature flags for site `d1alzzxd7k`."
- "What experiments are active on site `d1alzzxd7k`?"
- "Show me the code for variation 1 of experiment `149640`."

## Other IDEs

### Cursor

**Option 1 (UI, recommended):** Cursor Settings (`Cmd/Ctrl + Shift + J`) > **Features > MCP Servers > + Add New MCP Server**. Name `kameleoon`, type `command`, command:

```bash
npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

**Option 2 (`~/.cursor/mcp.json`):**

```json
{
  "mcpServers": {
    "kameleoon": {
      "command": "bash",
      "args": [
        "-lc",
        "npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ \"scope\": \"openid\" }'"
      ]
    }
  }
}
```

Restart Cursor after editing the file manually.

### Antigravity (`~/.gemini/antigravity/mcp_config.json`)

```json
"kameleoon": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote@0.1.37",
    "https://mcp.kameleoon.com/mcp",
    "35535",
    "--static-oauth-client-metadata",
    "{ \"scope\": \"openid\" }"
  ]
}
```

### Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.kameleoon]
command = "npx"
args = ["-y", "mcp-remote@0.1.37", "https://mcp.kameleoon.com/mcp",
        "35535", "--static-oauth-client-metadata",
        "{ \"scope\": \"openid\" }"]
```

## Sample prompts for developer workflows

- "List the Kameleoon MCP tools available in this session."
- "Show me all feature flags for site `d1alzzxd7k` and point out any stale candidates."
- "Get the details for feature flag `new_search` on site `d1alzzxd7k`, including its environments and variations."
- "Create a feature flag `checkout_v2` on site `d1alzzxd7k`, add a `variant_a` variation, then roll it out to 10% in staging."
- "Duplicate experiment `149640`, then start the copy."
- "Summarize experiment `149640` for an engineer: status, winner state, and whether variation data is available."
- "Create a URL goal that fires on `/thank-you`, then attach it as the primary goal of a new experiment."
- "Create a desktop-only segment and target experiment `149640` to it."

### Advanced workflow: end-to-end automation

To exercise the full capability, paste a comprehensive system prompt. The example below transposes a winning variation into native React, gated behind a new feature flag. It is intended primarily for React applications.

> You are integrating a Kameleoon A/B experiment into a production codebase by converting a Kameleoon PBX variation into maintainable native React code.
>
> **Context**
>
> - Experiment ID: 373001
> - Mode: `strict_winner_only` (default) or `manual_variation_conversion` (Fallback variation: 1266752)
>
> **Rules**
>
> - Inspect the repo first and follow existing conventions (structure, styling, routing, tests, feature flags).
> - Do not copy experiment code directly. Re-implement using idiomatic React (components, hooks, state).
> - Do not keep experiment-specific logic (IDs, Kameleoon APIs) in production code.
> - Prefer existing feature-flag systems for rollout.
> - Avoid DOM manipulation (no `querySelector`, `MutationObserver`, etc.).
> - Do not add new dependencies unless necessary.
> - Be explicit if something is unclear.
>
> **Workflow steps**
>
> 1. Get experiment results.
> 2. Decide integration: Mode A (`strict_winner_only`) proceeds only if `winner.status == "clear_winner"`; Mode B (manual) uses the provided fallback variation.
> 3. Get the variation code and the prompt that was used.
> 4. Convert the code to React (JS to components/hooks, CSS to the project styling system).
> 5. Create a feature flag `pbx-winning-experiment-373001` and gate the converted code behind it.

## Tool parameters reference

Use the exact tool and parameter names returned by `tools/list`.

### Experiments

| Tool | Required | Optional |
|---|---|---|
| `experiment_list` | (none) | `siteCode`, `filterQuery`, `page`, `perPage`, `sortField`, `sortOrder` |
| `experiment_get` | `experimentId` | (none) |
| `experiment_code_get` | `experimentId`, `variationId` | (none) |
| `experiment_results_get` | `experimentId` | (none) |
| `experiment_create` | `payload` (`siteCode`, `name`, `type`, `baseURL`) | `payload`: `mainGoalId`, `goals`, `tags`, `description`, `commonJavaScriptCode`, `commonCssCode`, `trafficAllocationMethod`, `collectingDataEnabled`, `multipleTestingCorrection`, `executeCodeForReference` |
| `experiment_duplicate` | `experimentId` | (none) |
| `experiment_lifecycle_update` | `experimentId`, `status` | `confirm` (required for `stopped`/`deleted`), `reason` |

`status` accepts `started`, `resumed`, `paused`, `stopped`, `deleted`. `type` accepts `AI`, `CLASSIC`, `DEVELOPER`, `MVT`, `PROMPT`, `SDK_HYBRID`.

### Feature flags

| Tool | Required | Optional |
|---|---|---|
| `feature_flag_list` | (none) | `siteCode`, `filterQuery`, `page`, `perPage`, `sortField`, `sortOrder` |
| `feature_flag_get` | `featureKey`, `siteCode` | `environmentKey` (`*` for all) |
| `feature_flag_create` | `siteCode`, `featureKey`, `name` | `description` |
| `feature_flag_duplicate` | `featureKey`, `siteCode` | (none) |
| `feature_flag_delete` | `featureKey`, `siteCode` | (none) |
| `feature_flag_enable` | `featureKey`, `siteCode`, `environmentKey` | (none) |
| `feature_flag_disable` | `featureKey`, `siteCode`, `environmentKey` | (none) |
| `feature_flag_activity_logs_get` | (none) | `type`, `sortKey` (`timestamp`), `sortOrder`, `page`, `perPage` |
| `feature_flag_experiment_results_get` | `featureKey`, `siteCode`, `environmentKey`, `experimentId` | (none) |

### Feature-flag delivery, variations, variables

| Tool | Required | Optional |
|---|---|---|
| `feature_flag_rule_targeted_create` | `siteCode`, `featureKey`, `environmentKey`, `variationKey`, `exposition`, `releaseDateTime`, `timeZone` | `ruleName` |
| `feature_flag_rule_experimentation_create` | `siteCode`, `featureKey`, `environmentKey`, `controlVariationKey`, `trafficAllocations`, `exposition`, `releaseDateTime`, `timeZone` | `ruleName` |
| `feature_flag_variation_create` | `siteCode`, `featureKey`, `variationKey`, `variationName` | (none) |
| `feature_flag_variable_create` | `siteCode`, `featureKey`, `variableKey`, `variableType`, `defaultValue` | (none) |
| `feature_flag_variation_variable_set` | `siteCode`, `featureKey`, `variationKey`, `variableKey`, `value` | (none) |

`variableType` accepts `BOOLEAN`, `NUMBER`, `STRING`, `JSON`, `JS`, `CSS`, `ENUM`. `trafficAllocations` is a comma-separated `variationKey:percentage` string summing to 100 (e.g. `off:50,on:50`). `releaseDateTime` is an ISO-8601 local datetime without offset (e.g. `2026-07-01T09:00:00`); `timeZone` is an IANA zone (e.g. `Europe/Paris`, `UTC`).

### Goals

| Tool | Required | Optional |
|---|---|---|
| `goal_list` | (none) | `siteCode`, `page`, `perPage` |
| `goal_get` | `goalId` | (none) |
| `goal_search` | `query` | `siteCode`, `page`, `perPage` |
| `goal_create` | `payload` (`name`, `siteCode`, `type`, `hasMultipleConversions`) | `payload`: type-specific (`matchString`, `matchType`, `scrollType`, `scrollValue`, `timeSeconds`, `pageViews`, `url`, `jsCode`), `tags`, `description`, `status`, `trackingTools` |
| `goal_update` | `goalId` | `name`, `description`, `tags`, `trackingTools`, `hasMultipleConversions` |
| `goal_update_type` | `goalId`, `type` | type-specific params |
| `goal_delete` | `goalId` | (none) |

`type` accepts `CLICK`, `CUSTOM`, `SCROLL`, `PAGE_VIEWS`, `URL`, `TIME_SPENT`, `RETENTION_RATE`, `WAREHOUSE`, `RATIO_METRICS`.

### Segments, sites, targeting rules

| Tool | Required | Optional |
|---|---|---|
| `segment_list` | (none) | `siteCode`, `query`, `page`, `perPage` |
| `segment_get` | `segmentId` | (none) |
| `segment_create` | `name`, `siteCode` | `conditionDataTree`, `description` |
| `segment_delete` | `segmentId` | `force` |
| `site_list` | (none) | (none) |
| `targeting_rule_list` | (none) | `siteCode`, `page`, `perPage` |
| `targeting_rule_get` | `targetingRuleId` | (none) |
| `targeting_rule_create` | `segmentConfiguration`, `siteCode`, `experimentId` | `segmentId`, `triggerConfiguration`, `triggerId`, `targetingConfigurationParam` |

### Prompting tips

- Include the site code when you work with feature flags, goals, segments, or targeting rules.
- Include the experiment ID when you query experiments or results, and both `experimentId` and `variationId` for variation code.
- Name the target environment when enabling or disabling a flag, or adding a delivery rule.
- For destructive experiment transitions (`stopped`, `deleted`), the agent must pass `confirm = true`.
- Request a plain-English summary when you want the agent to interpret a result rather than return raw data.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Browser doesn't open. | Auto-launch failed. | Copy the URL from the terminal and open it manually. |
| Connection refused / `EADDRINUSE` on port 35535. | A stale `mcp-remote` process holds the OAuth callback port. | Stop the stale process on 35535 and rerun the OAuth command. |
| Failed to connect after OAuth. | Token did not persist. | Re-run the Step 2 command to refresh the token. |
| Tools not visible. | Session started before adding the server. | Start a new session (Claude Code / Codex do not hot-reload). |
| `mcpServers` key rejected in `settings.json`. | Wrong file; Claude Code does not use that key. | Use `claude mcp add`. |
| Auth error after a long period. | OAuth token expired. | Re-run the Step 2 command. |
| Headless / remote agents fail to authenticate. | No browser for the OAuth step. | Use a desktop version of your tool. |
| `npx` not found. | Node.js not on PATH. | Install Node.js v18+ (includes `npx`). |

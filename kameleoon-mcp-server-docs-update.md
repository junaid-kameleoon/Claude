# Kameleoon MCP server

Connect AI coding assistants directly to your Kameleoon project to automate feature flag management and experiment implementation.

The Kameleoon Model Context Protocol (MCP) server connects AI coding assistants directly to your Kameleoon project, enabling agentic workflows for feature flags and experiments. This guide helps you automate the "last mile" of development by instructing your AI tools to search configurations, analyze results, and pull variation code directly into your development environment. Register and authenticate the server to automate your implementation lifecycle, from flag creation to rollout.

## Features

After you connect the server, your AI agent can interact with Kameleoon to perform the following tasks:

* Search, retrieve, toggle, and manage feature flag configurations.
* Analyze experiment winners and retrieve statistical summaries.
* Pull raw variation code (JavaScript or CSS) directly from experiments.
* Automate the full implementation lifecycle, from flag creation to rollout.

### The primary workflow: Winning experiment to production

The Kameleoon MCP server automates the "last mile" of implementation. Without leaving the IDE, you can instruct your AI assistant to execute the following workflow:

1. Retrieve experiment results and identify the winning variation.
2. Extract the variation's raw code from Kameleoon.
3. Convert the code into native, production-ready code (such as React components) aligned with the existing codebase.
4. Create a feature flag in Kameleoon.
5. Wrap the new implementation behind the feature flag.
6. Enable and validate the feature in production.

## Available tools

| Tool                     | Purpose                                   | Example prompt                                      |
| ------------------------ | ----------------------------------------- | --------------------------------------------------- |
| `feature_flag_list`      | List all flags for a site.                | "List all feature flags for site `d1alzzxd7k`."     |
| `feature_flag_get`       | Get detailed flag configuration.          | "Show configuration for flag `snake_game`."         |
| `feature_flag_enable`    | Toggle a flag ON.                         | "Enable the `new_search` flag in production."       |
| `feature_flag_create`    | Create a new basic flag.                  | "Create a flag `ui_refresh` for site `d1alzzxd7k`." |
| `experiment_list`        | List active experiments.                  | "List all active experiments."                      |
| `experiment_results_get` | Get results and winner data.              | "Show winner summary for experiment `149640`."      |
| `experiment_code_get`    | Extract JavaScript or CSS variation code. | "Pull variation code for experiment `149640`."      |
| `feature_flag_duplicate` | Clone an existing flag. | "Duplicate the `new_search` flag." |
| `feature_flag_delete` | Permanently delete a flag. | "Delete the flag `ui_refresh`." |
| `feature_flag_disable` | Toggle a flag OFF. | "Disable `new_search` in staging." |
| `feature_flag_activity_logs_get` | Read the flag change history (audit trail). | "Show recent feature-flag changes." |
| `feature_flag_experiment_results_get` | Get results for a flag's experimentation rule. | "Get results for the experiment rule on `new_search`." |
| `feature_flag_rule_targeted_create` | Add a targeted delivery rule (serve one variation to a percentage of traffic). | "Roll `new_search` out to 20% in production." |
| `feature_flag_rule_experimentation_create` | Add an A/B experimentation rule across variations. | "A/B test `off` vs `on` 50/50 on `new_search`." |
| `feature_flag_variation_create` | Add a custom variation to a flag. | "Add a `variant_a` variation to `new_search`." |
| `feature_flag_variable_create` | Add a typed variable (with a default) to a flag. | "Add a STRING variable `label` defaulting to `Search`." |
| `feature_flag_variation_variable_set` | Override a variable's value for one variation. | "Set `label` to `Find` on `variant_a`." |
| `experiment_get` | Inspect an experiment's full configuration. | "Show the configuration for experiment `149640`." |
| `experiment_create` | Create a draft experiment. | "Create a CLASSIC experiment `Homepage hero` on site `d1alzzxd7k`." |
| `experiment_duplicate` | Clone an experiment into a new draft. | "Duplicate experiment `149640`." |
| `experiment_lifecycle_update` | Start, pause, resume, stop, or delete an experiment. | "Start experiment `149640`." |
| `goal_list` | List goals on a site. | "List goals for site `d1alzzxd7k`." |
| `goal_get` | Inspect a goal's configuration. | "Show goal `271552`." |
| `goal_search` | Find a goal by name. | "Search goals for `checkout`." |
| `goal_create` | Create a goal (URL, CLICK, SCROLL, etc.). | "Create a URL goal matching `/thank-you`." |
| `goal_update` | Edit a goal's name, description, or tags. | "Rename goal `271552` to `Signup complete`." |
| `goal_update_type` | Switch a goal's type and type configuration. | "Change goal `271552` to a CLICK goal." |
| `goal_delete` | Delete a goal. | "Delete goal `271552`." |
| `segment_list` | List segments on a site. | "List segments for site `d1alzzxd7k`." |
| `segment_get` | Inspect a segment's condition tree. | "Show segment `200604`." |
| `segment_create` | Create an audience segment. | "Create a segment for desktop visitors." |
| `segment_delete` | Delete a segment (guarded when in use). | "Delete segment `200604`." |
| `site_list` | List the sites (projects) you can access. | "List my Kameleoon sites." |
| `targeting_rule_list` | List targeting rules on a site. | "List targeting rules for site `d1alzzxd7k`." |
| `targeting_rule_get` | Inspect a single targeting rule. | "Show targeting rule `118605`." |
| `targeting_rule_create` | Bind a segment to an experiment. | "Target experiment `149640` to segment `200604`." |

### Prerequisites

* Claude Code installed (`claude --version`)
* Node.js v18 or later installed (`node --version`)
* A Kameleoon account

### Step 1: Register the server

To register the server for your user profile (making it available in all projects), open a terminal and run the following command:

```bash
claude mcp add --scope user kameleoon -- npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

To register the server only for the current project (which adds a `.mcp.json` file to your repository for team sharing), run:

```bash
claude mcp add kameleoon -- npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

Verify that Claude added the server:

```bash
claude mcp list
```

**Expected output:** `kameleoon: ... - ✗ Failed to connect` (This is normal because you have not completed authentication yet).

### Step 2: Complete OAuth authentication

In the same terminal, trigger the login flow:

```bash
npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
```

1. The command automatically opens a browser tab. If it doesn't, copy the URL printed in the terminal and open it manually.
2. Sign in to your Kameleoon account.
3. Click **Authorize**.
4. When the browser displays a success message, press `Ctrl+C` in your terminal.

Verify the connection:

```bash
claude mcp list
```

**Expected output:** `kameleoon: ... - ✓ Connected`

### Step 3: Start a new Claude Code session

Claude Code makes tools from newly added MCP servers available only in sessions that you start after registering the server. Close your current Claude Code chat and open a new one.

### Step 4: Verify the connection

In a new Claude Code conversation, try the following prompts:

* "List my Kameleoon feature flags."
* "What experiments are active on site X?"
* "Show me the status of experiment Y."
* "Show me the code for variation 1 of experiment Z."

### Claude troubleshooting

| Symptom                                       | Cause                                          | Fix                                                  |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Browser doesn't open.                         | Auto-launch failed.                            | Copy the URL from the terminal and open it manually. |
| Connection refused on port 35535.             | Port is in use.                                | Run `netstat -ano \| findstr :35535`, kill the process, and retry. |
| Failed to connect after OAuth.                | Token did not persist.                         | Re-run the Step 2 command to refresh your token.     |
| Tools are not visible in Claude.              | Session started before adding the server.      | Start a new Claude Code conversation.                |
| `mcpServers` key rejected in `settings.json`. | Wrong file; Claude Code does not use that key. | Use the `claude mcp add` command instead.            |
| Auth error after a long period.               | OAuth token expired.                           | Re-run the Step 2 command.                           |

### Antigravity

#### Quick setup

Paste the following self-starter prompt directly into your Antigravity chat to connect automatically:

> "Connect to the Kameleoon MCP production server. The endpoint is `https://mcp.kameleoon.com/mcp`, using mcp-remote@0.1.37 on port 35535 with the openid scope. Authenticate by running the npx mcp-remote command to trigger my browser, then verify the connection."

#### Manual configuration

Edit the configuration file at `~/.gemini/antigravity/mcp_config.json` and add the following JSON block:

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

### Codex

#### Quick setup

Paste the following self-starter prompt into your Codex chat:

> "Configure the Kameleoon MCP server at `https://mcp.kameleoon.com/mcp`. Use port 35535 for callback. Once configured, run the login command to trigger my browser and then list my feature flags."

#### Manual configuration

Add the following block to `~/.codex/config.toml`. Create the file if it does not exist:

```toml
[mcp_servers.kameleoon]
command = "npx"
args = ["-y", "mcp-remote@0.1.37", "https://mcp.kameleoon.com/mcp",
        "35535", "--static-oauth-client-metadata",
        "{ \"scope\": \"openid\" }"]
```

## Authenticate the connection

The Kameleoon MCP server uses OAuth. Run the following command in your terminal to start the authorization flow:

```bash
npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 \
  --static-oauth-client-metadata '{ "scope": "openid" }'
```

**Expected behavior:**

1. The browser automatically opens a window.
2. Click **Authorize** on the Kameleoon login page.
3. Kameleoon completes the local callback on port 35535.
4. The terminal confirms that the proxy connected successfully.

A successful connection outputs text similar to the following:

```
Connected to remote server using StreamableHTTPClientTransport
Local STDIO server running
Proxy established successfully between local STDIO and remote StreamableHTTPClientTransport
```

## Verify tool operations

After you authenticate, run the following checks to confirm the tools work as expected:

1. **List available tools:** Confirm that `tools/list` succeeds and returns the Kameleoon tools. Ensure the output includes the tools listed in the tools table, such as `experiment_code_get`, `feature_flag_list`, and `feature_flag_create`.
2. **Retrieve feature flags:** Run `feature_flag_list(siteCode = "d1alzzxd7k")`. A successful response returns a list of feature flags for the specified site.
3. **Retrieve experiment results:** Run `experiment_results_get(experimentId = 149640)`. A successful response includes the experiment name, site code, type, and status.

## Cursor integration

Cursor integrates MCP tools directly into the IDE Chat sidebar, which makes them available while you code.

### Option 1: Configure via Cursor UI (Recommended)

1. Open Cursor Settings (`Cmd` + `Shift` + `J` on macOS, `Ctrl` + `Shift` + `J` on Windows/Linux).
2. Navigate to **Features** > **MCP Servers** > **+ Add New MCP Server**.
3. Set the **Name** to `kameleoon`.
4. Set the **Type** to `command`.
5. Enter the following string as the **Command**:
   ```bash
   npx -y mcp-remote@0.1.37 https://mcp.kameleoon.com/mcp 35535 --static-oauth-client-metadata '{ "scope": "openid" }'
   ```
6. Save the configuration.

### Option 2: Configure via mcp.json (Advanced)

Open `~/.cursor/mcp.json` (create the file if it does not exist) and add the following entry to the `mcpServers` object:

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

> **Note:** Restart Cursor after you edit the file manually.

## Sample prompts for developer workflows

After you connect the Kameleoon MCP server, use prompts like the following in your IDE:

* "List the Kameleoon MCP tools available in this session."
* "Show me all feature flags for site code `d1alzzxd7k`."
* "Get the details for feature flag new\_search on site `d1alzzxd7k`."
* "Fetch experiment results for experiment `149640` and summarize the current status."
* "Pull the variation code for experiment `<experimentId>` and variation `<variationId>`."

For more advanced workflows, try the following prompts:

* "Inspect feature flag new\_search for site `d1alzzxd7k` and explain what environments and variations it currently has."
* "Summarize experiment `149640` for an engineer. Include status, site code, winner state, and whether any variation data is available."
* "List the active feature flags for site `d1alzzxd7k` and point out any flags that look like stale candidates."
* "Retrieve the code for variation `<variationId>` in experiment `<experimentId>` and explain what frontend behavior it changes."
* "Create a new feature flag named `<name>` with key `<featureKey>` for site `d1alzzxd7k`."
* "Turn on feature flag `<featureKey>` in the staging environment for site `d1alzzxd7k`."
* "Turn off feature flag `<featureKey>` in the production environment for site `d1alzzxd7k`."

### Advanced workflow: End-to-end automation

To experience the full capability of the MCP server, use a comprehensive system prompt. The following example demonstrates how to transpose winning variation code into React components, which is intended primarily for React applications. It instructs the AI agent to handle the entire implementation lifecycle, from retrieving winning results to generating production-ready native code gated behind a new feature flag.

Paste the following prompt into your AI assistant:

> You are integrating a Kameleoon A/B experiment into a production codebase by converting a Kameleoon PBX variation into maintainable native React code.
>
> **Context**
>
> * Experiment ID: 373001
> * Mode: strict\_winner\_only (default) or manual\_variation\_conversion (Fallback variation: 1266752)
>
> **Rules**
>
> * Inspect the repo first and follow existing conventions (structure, styling, routing, tests, feature flags).
> * Do not copy experiment code directly. Re-implement using idiomatic React (components, hooks, state).
> * Do not keep experiment-specific logic (IDs, Kameleoon APIs) in production code.
> * Prefer existing feature flag systems for rollout.
> * Avoid DOM manipulation (no querySelector, MutationObserver, etc.).
> * Do not add new dependencies unless necessary.
> * Be explicit if something is unclear.
>
> **Workflow steps**
>
> 1. Get experiment results.
> 2. Decide integration:
>    * Mode A (default: `strict_winner_only`): Proceed only if `winner.status == "clear_winner"`.
>    * Mode B (manual): Use the fallback variation provided in the context.
> 3. Get the variation code and the prompt that was used.
> 4. Convert the code to React (convert JS code to React components/hooks, and CSS code to the project styling system).
> 5. Create a feature flag "pbx-winning-experiment-373001" and gate the converted code behind it.

## Tool parameters reference

Use the exact tool names and parameter names returned by `tools/list`. The live MCP schema supports the following parameters:

| Tool                     | Required parameters           | Optional parameters |
| ------------------------ | ----------------------------- | ------------------- |
| `feature_flag_list`      | `siteCode`                    | None                |
| `feature_flag_get`       | `featureKey`, `siteCode`      | `environmentKey`    |
| `feature_flag_enable`    | `featureKey`, `siteCode`      | `environmentKey`    |
| `feature_flag_create`    | `featureKey`, `siteCode`      | None                |
| `experiment_results_get` | `experimentId`                | None                |
| `experiment_code_get`    | `experimentId`, `variationId` | None                |
| `feature_flag_get` (all environments) | `featureKey`, `siteCode` | `environmentKey` (`*` for all) |
| `feature_flag_create` (with name) | `siteCode`, `featureKey`, `name` | `description` |
| `feature_flag_duplicate` | `featureKey`, `siteCode` | None |
| `feature_flag_delete` | `featureKey`, `siteCode` | None |
| `feature_flag_disable` | `featureKey`, `siteCode`, `environmentKey` | None |
| `feature_flag_activity_logs_get` | None | `type`, `sortKey` (`timestamp`), `sortOrder`, `page`, `perPage` |
| `feature_flag_experiment_results_get` | `featureKey`, `siteCode`, `environmentKey`, `experimentId` | None |
| `feature_flag_rule_targeted_create` | `siteCode`, `featureKey`, `environmentKey`, `variationKey`, `exposition`, `releaseDateTime`, `timeZone` | `ruleName` |
| `feature_flag_rule_experimentation_create` | `siteCode`, `featureKey`, `environmentKey`, `controlVariationKey`, `trafficAllocations`, `exposition`, `releaseDateTime`, `timeZone` | `ruleName` |
| `feature_flag_variation_create` | `siteCode`, `featureKey`, `variationKey`, `variationName` | None |
| `feature_flag_variable_create` | `siteCode`, `featureKey`, `variableKey`, `variableType`, `defaultValue` | None |
| `feature_flag_variation_variable_set` | `siteCode`, `featureKey`, `variationKey`, `variableKey`, `value` | None |
| `experiment_list` | None | `siteCode`, `filterQuery`, `page`, `perPage`, `sortField`, `sortOrder` |
| `experiment_get` | `experimentId` | None |
| `experiment_create` | `payload` (`siteCode`, `name`, `type`, `baseURL`) | `payload`: `mainGoalId`, `goals`, `tags`, `description`, `commonJavaScriptCode`, `commonCssCode`, `trafficAllocationMethod` |
| `experiment_duplicate` | `experimentId` | None |
| `experiment_lifecycle_update` | `experimentId`, `status` | `confirm` (required for `stopped`/`deleted`), `reason` |
| `goal_list` | None | `siteCode`, `page`, `perPage` |
| `goal_get` | `goalId` | None |
| `goal_search` | `query` | `siteCode`, `page`, `perPage` |
| `goal_create` | `payload` (`name`, `siteCode`, `type`, `hasMultipleConversions`) | `payload`: type-specific params, `tags`, `description`, `status`, `trackingTools` |
| `goal_update` | `goalId` | `name`, `description`, `tags`, `trackingTools`, `hasMultipleConversions` |
| `goal_update_type` | `goalId`, `type` | type-specific params |
| `goal_delete` | `goalId` | None |
| `segment_list` | None | `siteCode`, `query`, `page`, `perPage` |
| `segment_get` | `segmentId` | None |
| `segment_create` | `name`, `siteCode` | `conditionDataTree`, `description` |
| `segment_delete` | `segmentId` | `force` |
| `site_list` | None | None |
| `targeting_rule_list` | None | `siteCode`, `page`, `perPage` |
| `targeting_rule_get` | `targetingRuleId` | None |
| `targeting_rule_create` | `segmentConfiguration`, `siteCode`, `experimentId` | `segmentId`, `triggerConfiguration`, `triggerId`, `targetingConfigurationParam` |

Accepted enum values for the new tools: `experiment_lifecycle_update.status` is `started`, `resumed`, `paused`, `stopped`, or `deleted`; experiment `type` is `AI`, `CLASSIC`, `DEVELOPER`, `MVT`, `PROMPT`, or `SDK_HYBRID`; goal `type` is `CLICK`, `CUSTOM`, `SCROLL`, `PAGE_VIEWS`, `URL`, `TIME_SPENT`, `RETENTION_RATE`, `WAREHOUSE`, or `RATIO_METRICS`; `variableType` is `BOOLEAN`, `NUMBER`, `STRING`, `JSON`, `JS`, `CSS`, or `ENUM`. `trafficAllocations` is a comma-separated `variationKey:percentage` string summing to 100 (for example `off:50,on:50`). `releaseDateTime` is an ISO-8601 local datetime without offset (for example `2026-07-01T09:00:00`) and `timeZone` is an IANA zone (for example `Europe/Paris`, `UTC`).

> **Tip:** For environment-specific queries, pass `environmentKey = "production"` or `environmentKey = "staging"` where supported.

### Prompting tips

* Include the site code when you work with feature flags.
* Include the experiment ID when you query experiments or experiment results.
* Include both `experimentId` and `variationId` when you request variation code.
* Explicitly name the target environment when you ask the agent to enable or disable a feature flag.
* Request a plain-English summary if you want your AI agent to interpret the MCP response rather than just retrieving the raw data.

### Port 35535 is already in use

If authentication fails with an `EADDRINUSE` error, another process already listens on the OAuth callback port.

* **Cause:** A stale `mcp-remote` process remains active from a previous authentication attempt.
* **Fix:** Stop the stale process that is using port 35535, then rerun the OAuth command.

### MCP server does not appear in Codex chat

Codex might not hot-reload newly added MCP servers into an already-running thread.

* **Fix:** Refresh Codex or start a new session after you update `config.toml`.

### Browser flow does not complete

If the OAuth browser window opens but authorization does not finish:

* Confirm that you clicked the **Authorize** button on the Kameleoon login page.
* Check that your browser or system settings do not block `localhost` callbacks.
* Manually open the callback URL if your browser fails to launch it automatically.

### Headless or remote agents fail to authenticate

Remote or headless agents (such as cloud-hosted Codex) cannot complete the browser-based authorization step.

* **Fix:** Use a desktop version of your tool instead.

### npx command not found

If the command fails with a "not found" error, ensure that `npx` is available on your system path. Node.js versions 5.2 and later include `npx` by default.

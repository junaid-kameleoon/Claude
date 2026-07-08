# KAI Chat — Tool command picker

Design notes for the categorized tool picker in the **Kai v2.2** prototype, so the team can align on icons, colors, and descriptions.

## See it live

- **Prototype:** https://junaid-kameleoon.github.io/Claude/Kai%20v2.2/
- In the Kai composer, type **`/`** for the inline picker, or click the **`/` button** to open the full **All tools** modal.

The two surfaces share one catalog and differ only in how the description is shown:

| Surface | Tool name | Description |
|---|---|---|
| Inline `/` picker | shown as the row label | on hover, via the `(i)` dot |
| Full **All tools** modal | shown as the row label | inline, under the tool name |

## Principles (Kameleoon Product pillar)

- **Lucide icons only.** One icon per category, reused across every tool in that category (one icon, not one per tool).
- **One accent color per category**, from the brand 6-color categorical palette. The accent tints the icon chip only; tool names and descriptions stay in the standard product text tokens.
- **The tool id is the label.** Each row shows the real MCP tool name (e.g. `experiment_list`) plus a short, plain-language description.
- **The id never changes.** It is the MCP contract; only the presentation around it changes.
- **Search matches the tool name and the description**, so both "experiment" and "pause" find the right rows.
- Grouped by category with a small category header (accent chip + name + count). Headers stick while scrolling.

## Categories

After merging Targeting into Feature Flags, the picker has **5 categories**:

| Category | Lucide icon | Accent | Hex | Tools |
|---|---|---|---|---|
| Experiments | `flask-conical` | dark teal | `#2A7868` | 7 |
| Feature Flags | `flag` | light periwinkle | `#B3BEFF` | 18 |
| Goals | `target` | yellow green | `#CEDD70` | 7 |
| Segments | `users` | pink 30 | `#EACEF8` | 4 |
| Sites | `folder-tree` | warm gray | `#B8B4A4` | 1 |

Light accents (periwinkle, yellow green, pink, warm gray) use a dark icon (`#1f2937`) for contrast; dark accents (teal) use a white icon.

> **Changes from the first draft:** the "A/B Tests" category was renamed **Experiments** and the copy uses "experiment" instead of "A/B test". The separate **Targeting** category (`crosshair`, burgundy `#882838`) was **merged into Feature Flags**, so its 3 rules now carry the flag icon and color.

## Full catalog (tool id → description)

### Experiments — `flask-conical` · `#2A7868`
| Tool | Description |
|---|---|
| `experiment_list` | Find an experiment by name or ID. |
| `experiment_get` | See an experiment's full setup: variations, goals, traffic split. |
| `experiment_code_get` | View the JavaScript and CSS running in a variation. |
| `experiment_results_get` | Get the statistical results for an experiment. |
| `experiment_create` | Start a new draft experiment on a site. |
| `experiment_duplicate` | Copy an existing experiment into a new draft. |
| `experiment_lifecycle_update` | Start, pause, resume, stop, or delete an experiment. |

### Feature Flags — `flag` · `#B3BEFF`
| Tool | Description |
|---|---|
| `feature_flag_list` | Find a feature flag by name, key, or ID. |
| `feature_flag_get` | See a feature flag's full setup across environments. |
| `feature_flag_create` | Create a feature flag with default on and off variations. |
| `feature_flag_duplicate` | Copy an existing feature flag into a new one. |
| `feature_flag_delete` | Delete a feature flag. |
| `feature_flag_enable` | Turn a feature flag on in an environment. |
| `feature_flag_disable` | Turn a feature flag off in an environment. |
| `feature_flag_activity_logs_get` | See who changed a feature flag, and when. |
| `feature_flag_experiment_results_get` | Get the results of a feature flag experiment. |
| `feature_flag_rule_targeted_create` | Serve a flag to a chosen audience. |
| `feature_flag_rule_progressive_create` | Roll a flag out to a growing share of traffic. |
| `feature_flag_rule_experimentation_create` | Run an experiment on a flag's variations. |
| `feature_flag_variation_create` | Add a variation to a feature flag. |
| `feature_flag_variable_create` | Add a variable to a feature flag's variations. |
| `feature_flag_variation_variable_set` | Set a variable's value for one variation. |
| `targeting_rule_list` | See the targeting rules on an experiment. |
| `targeting_rule_get` | View a single targeting rule. |
| `targeting_rule_create` | Bind a segment to an experiment. |

### Goals — `target` · `#CEDD70`
| Tool | Description |
|---|---|
| `goal_list` | Browse all goals on a site. |
| `goal_get` | See a goal's details and settings. |
| `goal_search` | Search for a goal by name. |
| `goal_create` | Create a goal to measure. |
| `goal_update` | Edit a goal's name, tags, or settings. |
| `goal_update_type` | Change what kind of conversion a goal tracks. |
| `goal_delete` | Delete a goal. |

### Segments — `users` · `#EACEF8`
| Tool | Description |
|---|---|
| `segment_list` | Browse all segments on a site. |
| `segment_get` | See a segment's audience conditions. |
| `segment_create` | Create an audience segment. |
| `segment_delete` | Delete a segment. |

### Sites — `folder-tree` · `#B8B4A4`
| Tool | Description |
|---|---|
| `site_list` | List the sites (projects) you can access. |



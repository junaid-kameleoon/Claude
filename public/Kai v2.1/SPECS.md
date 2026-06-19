# Kai v2.1 Experiment Copilot — Product Specification

**Status:** Prototype (Ready for Stakeholder Review)  
**Date:** April 2026  
**Audience:** Engineering, Product, Design, Operations Teams

---

## 1. Overview

Kai is an AI-powered experiment copilot built into the Kameleoon platform. It allows teams to run complex experimentation workflows—query results, pause/pause experiments, audit stale flags, simulate user assignments, manage rollouts, and generate code—without leaving the native UI.

This spec covers the v2.1 prototype architecture, UX patterns, and proposed rollout strategy.

---

## 2. Core Design Principles

- **Conversational by default**: Plain language input with tool-as-fallback, not tool-first
- **Rich, not text-heavy**: Visual breakdowns (charts, lists, metrics) embedded in chat
- **Keyboard-friendly**: Full navigation via ↑↓/Enter in slash menu; Shift+Enter for newline
- **Smart defaults**: Auto-expand search results; keyboard nav hints only when relevant
- **Inline action**: Quick-reply chips and next-step suggestions avoid modal fragmentation

---

## 3. Feature Set

### 3.1 Tool Categories

#### **Lot 2 (Featured Tools)** — High-value, rich-response workflows
1. **Query Experiment Insights** — Semantic breakdown of results, winner detection, performance warnings
2. **Set Experiment State** — Pause, resume, stop, or archive experiments with confirmation
3. **Audit & Clean Up Workspace** — Find stale flags (100% rolled out, concluded, paused 3+ months)
4. **Simulate User Assignment** — Show which variants a user profile qualifies for
5. **Manage Progressive Rollout** — Trigger safe ramps (10→25→50→100%) and set guardrail metrics
6. **Generate Variant from Design** — Turn a Figma URL into HTML/React code

#### **Lot 1 (Extended Tools)** — Foundational CRUD + list operations
- 17 additional tools: list experiments, get details, manage flags, goals, segments, targeting rules, variations, rules, etc.
- Trigger followup dialogs ("Which experiment?") with quick-reply suggestions

### 3.2 Response Types

| Type | Interaction | Example |
|------|-------------|---------|
| **Rich Content** | Visual breakdown + action buttons | Query Insights: 3-column variant grid, confidence bar, winner badge, "Transpose to code" button |
| **Followup** | Asking for clarification + quick chips | "Which experiment?" with "Pricing Page Variation - 1", "Checkout Page Redesign" chips |
| **Text** | Plain assistant message (streamed) | Fallback: "I don't have a live connection..." |

### 3.3 Streaming & Loading States

- **Tool Call Badge**: "Calling `query_experiment_insights` …" with dot animation
- **Thinking Skeleton**: Type-matched loaders (insights grid, audit list, generic bars)
- **Text Streaming**: Character-by-character reveal (~12ms per char) with cursor blink
- **Quick Replies & Next Steps**: Appear after response loads

---

## 4. User Experience Flows

### 4.1 Slash Menu (Tool Discovery)

**Trigger:** Type `/` in textarea

**Layout:**
```
/ Tools  [↑↓ navigate · ↵ select hint]
────────────────────────────────────

🕐 Recent
  • Query experiment insights
  • Audit & clean up workspace
  
─ separator ─

⭐ Featured
  • Query experiment insights
  • Set experiment state
  • ... (4 more main tools)

─ separator ─

📋 All Tools (23)
  • Get experiment details
  • List experiments
  • ... (21 more lot 1 tools)
```

**Behavior:**
- **Just `/`**: Show Recent + Featured sections, collapse All Tools
- **Typing `/q`**: Filter by startsWith (1-2 chars), auto-expand All Tools if results
- **Typing `/que`**: Add word-start matching (3+ chars) — "query", "quick", "requests", etc.
- **Keyboard nav**: ↑↓ to navigate, Enter to select, Escape to close
- **Empty state**: "No tools matching 'xyz'" when no results

### 4.2 Rich Response Flow

Example: "Query experiment results for Pricing Page test"

```
[Thinking skeleton → 1.2s tool call badge → 0.8s thinking skeleton]
↓
Kai
┌─────────────────────────────────────────────┐
│ ⚡ query_experiment_insights · Query Insights │
│                                              │
│ Checkout Page Redesign · ID #4089            │
│                                              │
│ Control   Variant A   Variant B              │
│ 12.4%     14.8% ↑     13.2% ↑               │
│           +19.4%      +6.5%                  │
│                                              │
│ [========== 94.2% confidence ═════]         │
│                                              │
│ ⚠️  Variant A degrades page load +180ms     │
│                                              │
│ [Transpose to code] [Pause losing variants]  │
│                                              │
│ transpose variant  pause losing  ship winner │
│ to staging         and rollback   to 100%    │
└─────────────────────────────────────────────┘
```

**Layout:**
- Tool badge (icon + id + label)
- Rich content component (metric cards, charts, buttons)
- Next-step chips (subtle white pills below content)

### 4.3 Followup Flow

Example: "List my experiments"

```
Kai
┌────────────────────────────────────────┐
│ ⚡ list_experiments · List Experiments  │
│                                        │
│ Searching for active experiments...    │
│ Would you like to filter by status,    │
│ owner, or date range?                  │
│                                        │
│ [Only running] [Owned by me] [Last 7d] │
└────────────────────────────────────────┘
```

**Behavior:**
- Quick-reply chips auto-populate based on tool intent
- Clicking a chip sends it as the next message (triggers another tool call or refinement)

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Tech | Notes |
|-------|------|-------|
| **Frontend** | React 18 + JSX (via Babel standalone) | Single-file HTML prototype |
| **UI Library** | Tailwind CSS v3.4 | Custom primary color `#3838E7` |
| **Animations** | Framer Motion | window.Motion object; ~0.2s transitions |
| **Fonts** | IBM Plex Sans/Mono | Loaded via Google Fonts |
| **Hosting** | GitHub Pages | Auto-deploys on `main` push |
| **Icons** | Lucide React | 24px icons, custom stroke-width |

### 5.2 Component Hierarchy

```
App
├── Kai Sidebar (fixed bottom-right)
│   ├── MessageList
│   │   ├── MessageBubble (user)
│   │   ├── MessageBubble (assistant + toolCall badge)
│   │   │   ├── RichContent (InsightsContent, AuditContent, etc.)
│   │   │   ├── QuickReplies (inline chips)
│   │   │   └── NextSteps (subtle pill chips)
│   │   └── TypingState (tool_call badge + thinking skeleton)
│   ├── SlashMenu (absolute, above textarea)
│   │   ├── ToolList (Recent, Featured, All Tools sections)
│   │   └── SelectedHighlight (keyboard nav)
│   └── Textarea
│       ├── Input handler (onChange → showSlashMenu)
│       └── Keydown handler (Enter/Shift+Enter, Escape, ↑↓)
└── Main Content (experiment dashboard)
```

### 5.3 Data Flow: Tool Call → Response

```
User types "Query experiment results"
↓ (sendMessage)
getMockResponse() → { tool: 'query_experiment_insights', type: 'insights', ... }
↓
setTypingState({ step: 'tool_call', tool: { id, label } })
├→ Render: "Calling query_experiment_insights …"
↓ (1.2s delay)
setTypingState({ step: 'thinking', type: 'insights' })
├→ Render: InsightsSkeleton (3-column grid loader)
↓ (0.8s delay)
setTypingState(null)
├→ setMessages([..., {
│     role: 'assistant',
│     toolCall: { id, label },
│     richContent: <InsightsContent />,
│     nextSteps: ['Pause losing variants', 'Ship winner...', 'Export to Slack']
│   }])
└→ Render: Full response with next-step chips
```

### 5.4 Mock vs. Real Implementation

**Current (v2.1 Prototype):**
- `getMockResponse(text)` uses intent detection (regex patterns on user input)
- Returns hardcoded mock data (experiment results, flag lists, etc.)
- Type-aware skeletons and next-steps arrays pre-baked per tool

**Production Roadmap:**
- Replace `getMockResponse()` with real MCP tool invocation
- Stream skeleton type from tool manifest
- Next-steps generated by post-processing tool response

---

## 6. UI/UX Details

### 6.1 Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| **Primary** | `#3838E7` | Buttons, badges, highlights, skeleton animations |
| **User Message BG** | `#F0F1FF` | User message bubble (light blue) |
| **User Message Border** | `#E5E7FF` | User message outline |
| **Assistant BG** | `white` | Assistant message bubble |
| **Assistant Border** | `#E5E7FF` | Light gray (was #E5E7FF per user, verify) |
| **Gray Scale** | `gray-50` to `gray-900` | Semantic grays |
| **System (Success)** | `green-100`, `green-600` | Checkmarks, confirmations |
| **System (Warning)** | `amber-50`, `amber-500` | Caution flags |
| **System (Error)** | `red-400`, `red-600` | Severity indicators |

### 6.2 Typography

| Element | Font | Size | Weight | Line-height |
|---------|------|------|--------|------------|
| **Main Label (Kai)** | IBM Plex Sans | 13px | semibold | — |
| **Message Text** | IBM Plex Sans | 12px | normal | 1.5 |
| **Tool Badge ID** | IBM Plex Mono | 10px | normal | — |
| **Button Text** | IBM Plex Sans | 11–12px | semibold | — |
| **Hint Text** | IBM Plex Sans | 10px | medium | — |

### 6.3 Spacing & Sizing

| Component | Width | Height | Gap |
|-----------|-------|--------|-----|
| **Kai Sidebar** | 400px | 75vh (max 800px) | — |
| **Message Bubble** | max-w-[95%] | auto | — |
| **Slash Menu** | full (sidebar minus gutters) | max-h-64 | — |
| **Tool Item Padding** | — | py-2 px-3 | gap-3 |
| **Button Padding** | px-3 py-1.5 | — | — |

### 6.4 Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Message Enter** | opacity 0→1, y 6→0 | 0.2s | tween |
| **Slash Menu** | opacity 0→1, y 8→0 | ~0.15s | spring-like |
| **Tool Select Highlight** | bg-primary/5 | instant | — |
| **QuickTooltip** | opacity 0→1, y 2→0 | 0.1s | instant show |
| **Typing Dots** | infinite pulse | — | — |
| **Skeleton Bars** | infinite pulse | — | — |
| **Streaming Cursor** | infinite pulse | — | — |

---

## 7. Accessibility & Keyboard Support

### 7.1 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| `/` | Open slash menu (when typed in textarea) |
| `↑` | Highlight previous tool (in slash menu) |
| `↓` | Highlight next tool (in slash menu) |
| `↵` (no shift) | Send message OR select highlighted tool |
| `Shift+↵` | Insert newline (in textarea) |
| `Escape` | Close slash menu |

### 7.2 Accessibility Features

- **Focus management**: Focus returns to textarea after tool selection
- **ARIA labels**: Tool badges, buttons, and menu items have semantic roles
- **Color contrast**: All text meets WCAG AA (gray-700 on white = 5.4:1)
- **Tooltips**: 0.1s delay (quick), title-less (custom tooltip component)

---

## 8. Content Strategy

### 8.1 Suggested Prompts (Initial State)

Shown only when messages list has 1 item (initial greeting). Right-aligned, subtle pills.

```
[Query experiment results] [Clean up my stale flags] [Pause an experiment] [Ship a PBX variant to code]
```

Each triggers a mock response demonstrating a Lot 2 tool.

### 8.2 Error Handling

**Fallback for unmapped input:**
> "I don't have a live connection in this prototype. Try one of the suggestions or type / to browse available tools."

**Empty slash menu:**
> "No tools matching 'xyz'" with hint to try different keywords.

### 8.3 Next-Steps Chip Strategy

Each Lot 2 tool has 3 pre-baked next-step suggestions:

- **Query Insights**: "Pause losing variants" | "Ship winner to 100%" | "Export results to Slack"
- **Audit**: "Delete all stale flags" | "Schedule weekly audit" | "View flag dependencies"
- **Pause**: "Resume experiment" | "Notify team on Slack" | "Archive experiment"

Clicking a chip sends it as a new message (potential future enhancement: chain to related tool).

---

## 9. Proposed Rollout & Validation

### 9.1 Phase 1: Stakeholder Alignment (Now)

- [ ] **Engineering**: Review MCP tool list, skeleton types, mock data structure
- [ ] **Product**: Validate tool priority, next-steps UX, followup flow
- [ ] **Design**: Approve color palette, typography, animation timing
- [ ] **Operations**: Assess inference cost, latency, quota impact

### 9.2 Phase 2: Real Integration (4–6 weeks)

- [ ] Wire up real MCP tool invocations (replace `getMockResponse()`)
- [ ] Implement streaming text responses from Claude API
- [ ] Add usage tracking (recent tools, tool frequency) — opt-in telemetry
- [ ] Create skeleton types library (auto-generate from tool schemas)

### 9.3 Phase 3: Beta Launch (6–8 weeks)

- [ ] Release to 10% of active teams (feature flag: `kai_v2_beta`)
- [ ] Monitor: tool adoption, error rates, inference latency, feedback
- [ ] Iterate on next-steps suggestions based on usage patterns

### 9.4 Phase 4: GA (Week 12+)

- [ ] Roll out to 100% of teams
- [ ] Finalize analytics dashboard (tools called, time-to-first-response, completion rate)
- [ ] Plan Kai v2.2 roadmap

---

## 10. Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Daily Active Users** | >40% of teams within 30d of launch | Adoption baseline |
| **Tool Call Success Rate** | ≥95% (tool invocation completes) | Platform reliability |
| **Avg Response Latency** | <2s (skeleton → response) | UX perception of speed |
| **Next-Steps Click-Through** | ≥15% of rich responses | Engagement validation |
| **Keyboard Nav Usage** | ≥30% of tool selections | Efficiency win |
| **Fallback Trigger Rate** | <5% (unmapped input) | Intent matching quality |

---

## 11. Known Limitations & Future Enhancements

### Current (v2.1)

- Mock data only (no real tool invocations)
- No user authentication or multi-tenant isolation
- Recent tools list is static (not personalized)
- No chat history persistence
- Single-experiment focus (no batch operations)

### Planned (v2.2+)

- [ ] Real MCP tool invocation with streaming responses
- [ ] Persistent chat history (backend store)
- [ ] User-based recent tools (actual usage tracking)
- [ ] Multi-experiment workflows ("Pause 3 experiments and notify owners")
- [ ] Custom next-steps generation (ML-based suggestion ranking)
- [ ] Tool cost estimation ("This audit will scan 500 flags, ~2.5s")
- [ ] Slack integration (post summaries, quick-reply via Slack)

---

## 12. Questions for Stakeholders

### Engineering
1. What is the expected inference latency budget (skeleton delay)?
2. Should we stream skeleton types from tool manifest or hardcode per tool?
3. Do MCP tools emit structured next-steps, or do we generate them post-hoc?

### Product
1. Should "Recent tools" be based on actual user history or curated by role?
2. For Lot 1 tools, is a followup dialog sufficient, or do we need rich responses?
3. Should next-steps suggestions chain to related tools, or stay simple?

### Design
1. Is the streaming text speed (12ms/char) optimal, or prefer faster/slower?
2. Should skeleton loaders match the tool's rich content color scheme (primary blue)?
3. Any accessibility concerns with current keyboard nav?

### Operations
1. What is the estimated Claude API quota impact (calls/user/day)?
2. Should we implement rate limiting or quota warnings?
3. How should we handle concurrent user requests (queue, drop, error)?

---

## Appendix A: File Structure (v2.1 Prototype)

```
/Users/junaidgulzarmalik/Desktop/Claude/Kai v2.1/
├── index.html                 # Single-file prototype (all code, styles, UI)
├── SPECS.md                   # This document
└── README.md                  # Deployment & local dev notes
```

**Repo**: https://github.com/junaid-kameleoon/Claude  
**Live**: https://junaid-kameleoon.github.io/Claude/

---

## Appendix B: Component Props & Signatures

### `MessageBubble({ message, onSendMessage, isLatest })`
- `message.role`: 'user' | 'assistant'
- `message.content`: text body
- `message.richContent`: React component (optional)
- `message.toolCall`: { id, label } (optional)
- `message.quickReplies`: string[] (optional, for followup)
- `message.nextSteps`: string[] (optional, for rich responses)
- `message.streamed`: boolean (enable character-by-character reveal)

### `getRichContent(type)`
Returns appropriate React component:
- `'insights'` → `<InsightsContent />`
- `'audit'` → `<AuditContent />`
- `'pause'` → `<PauseContent />`
- etc.

### `getMockResponse(text)`
**Input**: User text  
**Output**: `{ tool, label, type, question?, quickReplies? }`

Example:
```javascript
getMockResponse("Query experiment results")
// → {
//     tool: 'query_experiment_insights',
//     label: 'Query Experiment Insights',
//     type: 'insights'
//   }
```

---

**Document Version**: 1.0  
**Last Updated**: April 25, 2026  
**Author**: Junaid Gulzar Malik  
**Review Status**: Ready for stakeholder feedback

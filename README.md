# KAI Chat — Prototypes & Architecture

Static prototypes and architecture reference for **KAI Chat**, Kameleoon's experiment copilot.

Published via GitHub Pages from the [`public/`](public/) directory (no build step — see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## Live

- **AI Trace Explorer (dashboard, password-protected):** https://junaid-kameleoon.github.io/Claude/dashboard/ — Langfuse traces for AI Asset targeting, AI Goals & Kai. Source in [`dashboard/`](dashboard/), built into [`public/dashboard/`](public/dashboard/).
- **Landing:** https://junaid-kameleoon.github.io/Claude/
- **KAI Chat v2.2 (latest):** https://junaid-kameleoon.github.io/Claude/Kai%20v2.2/ — experiment copilot, "Under the hood" live event feed, interactive Architecture diagram
- **KAI Chat v2.1:** https://junaid-kameleoon.github.io/Claude/Kai%20v2.1/
- **Copy to Figma mockup:** https://junaid-kameleoon.github.io/Claude/copy-to-figma-menu.html

## Architecture docs

The KAI Chat infrastructure HLD lives in [`public/Kai v2.2/docs/`](public/Kai%20v2.2/docs/) and is linked from the "Docs" button inside the prototype's Architecture overlay.

## Structure

```
public/            # everything served by GitHub Pages
  index.html       # landing page
  Kai v2.2/        # latest prototype (+ docs/)
  Kai v2.1/        # previous prototype
  copy-to-figma-menu.html
```

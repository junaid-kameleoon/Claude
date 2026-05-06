# Workflow Builder

Professional workflow editor built with React Flow (XyFlow), featuring automatic node layout, intelligent branching, and real-time configuration.

## Features

### 🎯 Core Features
- **Horizontal Node Layout**: Nodes automatically distribute left-to-right with perfect spacing
- **Professional Branching**: Logic nodes create clean, orthogonal edge routing
- **Non-draggable Nodes**: Fixed positions controlled by layout algorithm
- **Node Configuration**: Right-sidebar forms for editing node-specific settings
- **5 Node Types**: Triggers, Agents, Logic, Actions, and Wait nodes
- **Soft Design**: Rounded corners, subtle shadows, and modern color scheme

### 🎨 Node Types
- **Triggers** (Blue): Chat, Scheduler, Webhook, Email
- **Agents** (Purple): Content Generation, Image Creation, Data Processing, Integration
- **Logic** (Amber): Condition, Loop, Switch, Filter
- **Actions** (Green): Save, Send, Publish, Update
- **Wait** (Gray): Time Delay, Until Date, Manual Approval

## Development

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Opens http://localhost:3000

### Production Build
```bash
npm run build
```
Outputs to `dist/` directory

## Deployment

The built files (index.html, assets/) are committed to git for easy deployment.

### GitHub Pages
1. Configure your repository settings to serve from the `workflow-builder/` directory
2. Or use: `npm run deploy` (requires gh-pages branch setup)

## Architecture

### Components
- **App**: Main state management and view routing
- **WorkflowCanvas**: React Flow container with node rendering
- **ConfigPanel**: Right-sidebar form for node configuration
- **Custom Nodes**: TriggerNode, AgentNode, LogicNode, ActionNode, WaitNode
- **WorkflowsList**: Initial workflow selection view

### Styling
- Tailwind CSS with custom theme
- Lucide React icons (no emojis)
- Global CSS for React Flow customization

## Technical Stack
- React 18.3.1
- XyFlow (React Flow) 12.0.0
- Vite 6.3.5
- Tailwind CSS 4.1.12
- Lucide React 0.487.0

## File Structure
```
workflow-builder/
├── src/
│   ├── components/
│   │   ├── nodes/           # Custom node components
│   │   ├── WorkflowCanvas   # React Flow wrapper
│   │   ├── ConfigPanel      # Configuration sidebar
│   │   └── ...
│   ├── data/
│   │   └── workflow.js      # Node types and initial data
│   ├── hooks/
│   │   └── useLayoutedElements.js  # Layout algorithm
│   ├── styles/
│   │   └── globals.css      # Global styling
│   ├── App.jsx              # Main component
│   └── main.jsx             # Entry point
├── index.html               # HTML entry point
├── assets/                  # Built assets (CSS, JS)
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Development Notes

### Adding New Node Types
1. Create a new component in `src/components/nodes/`
2. Import in `WorkflowCanvas.jsx`
3. Add to `nodeTypes` object
4. Add configuration fields in `src/data/workflow.js`

### Customizing Layout
The `useLayoutedElements` hook currently uses simple horizontal spacing. For more sophisticated layouts, integrate:
- Dagre for hierarchical graphs
- ELKjs for flexible graph layout
- d3-hierarchy for tree-based layouts

## Next Steps

- [ ] Implement node insertion via hover (+) button
- [ ] Add undo/redo functionality
- [ ] Implement node deletion
- [ ] Add edge editing for branching labels
- [ ] Create workflow export/import
- [ ] Add workflow validation and error checking

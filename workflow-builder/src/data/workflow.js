// Node type definitions with colors and icons
export const NODE_TYPES = {
  trigger: {
    label: 'Trigger',
    color: '#DCE8FF',
    bgColor: '#F0F5FF',
    icon: 'trigger',
    variants: ['Chat', 'Scheduler', 'Webhook', 'Email']
  },
  agent: {
    label: 'Agent',
    color: '#E8DCF8',
    bgColor: '#F5F0FA',
    icon: 'agent',
    variants: ['Content Generation', 'Image Creation', 'Data Processing', 'Integration']
  },
  logic: {
    label: 'Logic',
    color: '#FFF3DC',
    bgColor: '#FFFAF0',
    icon: 'logic',
    variants: ['Condition', 'Loop', 'Switch', 'Filter']
  },
  action: {
    label: 'Action',
    color: '#DCF8DC',
    bgColor: '#F0FAF0',
    icon: 'action',
    variants: ['Save', 'Send', 'Publish', 'Update']
  },
  wait: {
    label: 'Wait',
    color: '#F0F0F5',
    bgColor: '#F8F8FA',
    icon: 'wait',
    variants: ['Time Delay', 'Until Date', 'Manual Approval']
  }
};

// Initial workflow nodes
export const initialNodes = [
  {
    id: '1',
    type: 'trigger',
    data: {
      label: 'Chat Trigger',
      config: {
        source: 'Chat Interface',
        frequency: 'Real-time'
      }
    },
    position: { x: 100, y: 100 }
  },
  {
    id: '2',
    type: 'agent',
    data: {
      label: 'Generate Ideas',
      config: {
        service: 'OpenAI',
        action: 'Generate creative suggestions'
      }
    },
    position: { x: 400, y: 100 }
  },
  {
    id: '3',
    type: 'logic',
    data: {
      label: 'Score Check',
      config: {
        condition: 'score > 8',
        trueLabel: 'High Quality',
        falseLabel: 'Needs Review'
      }
    },
    position: { x: 700, y: 100 }
  },
  {
    id: '4',
    type: 'agent',
    data: {
      label: 'Create Variations',
      config: {
        service: 'Content Processor',
        action: 'Build test variants'
      }
    },
    position: { x: 1000, y: 50 }
  },
  {
    id: '5',
    type: 'action',
    data: {
      label: 'Publish',
      config: {
        schedule: 'Immediately',
        platform: 'All Channels'
      }
    },
    position: { x: 1000, y: 150 }
  }
];

// Initial edges/connections
export const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4', label: 'Pass' },
  { id: 'e3-5', source: '3', target: '5', label: 'Fail' }
];

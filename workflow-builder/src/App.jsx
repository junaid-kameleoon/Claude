import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WorkflowCanvas from './components/WorkflowCanvas';
import ConfigPanel from './components/ConfigPanel';
import WorkflowsList from './components/WorkflowsList';
import { initialNodes, initialEdges } from './data/workflow';

const WORKFLOWS = [
  { id: '1', name: 'Test & Deploy Automation', description: 'A/B test with auto-deployment' },
  { id: '2', name: 'Traffic Ramp-Up Strategy', description: 'Gradually ramp traffic to variants' },
  { id: '3', name: 'Mobile Checkout Optimization', description: 'Optimize mobile checkout funnel' },
];

export default function App() {
  const [currentView, setCurrentView] = useState('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleSelectWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setCurrentView('workflow-detail');
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodes.find(n => n.id === nodeId) || null);
  };

  const handleNodeUpdate = (nodeId, config) => {
    setNodes(nodes.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, config } } : n
    ));
  };

  const handleBackToWorkflows = () => {
    setCurrentView('workflows');
    setSelectedWorkflow(null);
    setSelectedNode(null);
  };

  return (
    <div className="flex h-screen bg-[#FCFCFD]">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          currentView={currentView}
          selectedWorkflow={selectedWorkflow}
          onBack={currentView === 'workflow-detail' ? handleBackToWorkflows : null}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {currentView === 'workflows' && (
              <WorkflowsList workflows={WORKFLOWS} onSelect={handleSelectWorkflow} />
            )}
            {currentView === 'workflow-detail' && selectedWorkflow && (
              <ReactFlowProvider>
                <WorkflowCanvas
                  nodes={nodes}
                  edges={edges}
                  setNodes={setNodes}
                  setEdges={setEdges}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                />
              </ReactFlowProvider>
            )}
          </div>

          {currentView === 'workflow-detail' && selectedNode && (
            <ConfigPanel
              node={selectedNode}
              onUpdate={(config) => handleNodeUpdate(selectedNode.id, config)}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

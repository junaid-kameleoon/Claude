import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TriggerNode from './nodes/TriggerNode';
import AgentNode from './nodes/AgentNode';
import LogicNode from './nodes/LogicNode';
import ActionNode from './nodes/ActionNode';
import WaitNode from './nodes/WaitNode';

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  logic: LogicNode,
  action: ActionNode,
  wait: WaitNode,
};

const layoutNodes = (nodes) => {
  // Simple horizontal layout: distribute nodes left to right
  const nodesByLevel = {};
  const nodesWithLevel = nodes.map((node, idx) => {
    const level = idx;
    if (!nodesByLevel[level]) nodesByLevel[level] = [];
    nodesByLevel[level].push(node.id);
    return { ...node, level };
  });

  return nodesWithLevel.map(node => ({
    ...node,
    position: {
      x: node.level * 320 + 100,
      y: 100,
    },
  }));
};

export default function WorkflowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: setParentNodes,
  setEdges: setParentEdges,
  selectedNode,
  onNodeSelect,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    layoutNodes(initialNodes)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Mark selected node
  useEffect(() => {
    setNodes(nodes =>
      nodes.map(n => ({
        ...n,
        selected: selectedNode?.id === n.id,
      }))
    );
  }, [selectedNode, setNodes]);

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      const updatedNodes = nodes;
      setParentNodes(updatedNodes);
    },
    [onNodesChange, setParentNodes, nodes]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setParentEdges(edges);
    },
    [onEdgesChange, setParentEdges, edges]
  );

  const onNodeClick = useCallback(
    (e, node) => {
      e.stopPropagation();
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

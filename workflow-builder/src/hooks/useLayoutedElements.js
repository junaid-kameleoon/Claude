import { useCallback } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const layoutNodes = async (nodes, edges) => {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'spacing.nodeNode': '100',
      'elk.layered.spacing.edgeEdgesBetweenLayers': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
    },
    children: nodes.map(node => ({
      id: node.id,
      width: 200,
      height: 60,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  return {
    nodes: layoutedGraph.children.map(node => ({
      id: node.id,
      position: {
        x: (node.x || 0) - (node.width || 200) / 2,
        y: (node.y || 0) - (node.height || 60) / 2,
      },
    })),
    edges: edges,
  };
};

export const useLayoutedElements = (nodes, edges) => {
  const layouted = useCallback(async () => {
    return await layoutNodes(nodes, edges);
  }, [nodes, edges]);

  // For now, return nodes with manual positioning
  // In a real implementation, we'd use the layouted result
  return {
    nodes: nodes.map((node, idx) => ({
      ...node,
      position: {
        x: idx * 300 + 100,
        y: 100,
      },
    })),
    edges: edges,
  };
};

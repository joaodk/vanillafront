import React, { useMemo } from 'react';
import Graph from 'react-graph-vis';

// Define TypeScript interfaces for better type safety
interface Entity {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, any>;
  parent_id: string | null;
}

interface Relationship {
  id: string;
  entity1_id: string;
  relationship: string;
  entity2_id: string;
  type: string;
  score: number;
  context: string;
  position: string;
}

interface GraphViewProps {
  entities: Entity[];
  relationships: Relationship[];
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
  getEntityName: (id: string, entities: Entity[]) => string;
}

const GraphView: React.FC<GraphViewProps> = ({
  entities,
  relationships,
  selectedEntityId,
  setSelectedEntityId,
  getEntityName
}) => {
  // Graph event handlers
  const events = {
    selectNode: (event: any) => {
      const { nodes } = event;
      if (nodes && nodes.length > 0) {
        const nodeId = nodes[0];
        setSelectedEntityId(nodeId);
      }
    },
  };

  // Memoize nodes, edges, and graph to avoid recreating DataSets on every render
  const { nodes, edges, graph } = useMemo(() => {
    if (!entities || !relationships || entities.length === 0) {
      return { nodes: [], edges: [], graph: { nodes: [], edges: [] } };
    }

    // Create unique nodes by deduplicating entities by ID
    const uniqueEntities = entities.filter((entity, index, self) => 
      index === self.findIndex(e => e.id === entity.id)
    );

    // Create unique edges by deduplicating relationships by ID
    const uniqueRelationships = relationships.filter((rel, index, self) => 
      index === self.findIndex(r => r.id === rel.id)
    );

    // Create a set of connected node IDs
    const connectedNodeIds = new Set<string>();
    uniqueRelationships.forEach(rel => {
      connectedNodeIds.add(rel.entity1_id);
      connectedNodeIds.add(rel.entity2_id);
    });

    // Include all entities as nodes (we're not filtering out isolated nodes)
    const nodes = uniqueEntities.map(entity => ({
      id: entity.id,
      label: entity.name,
      title: `${entity.name} (${entity.type})`,
      color: selectedEntityId === entity.id ? '#4285F4' : undefined,
    }));

    // Create edges with unique IDs to avoid vis.js duplicate ID error
    const edges = uniqueRelationships.map((rel, index) => ({
      id: `${rel.id || index}`, // Ensure each edge has a unique ID
      from: rel.entity1_id,
      to: rel.entity2_id,
      label: rel.relationship,
      title: rel.context,
    }));

    const graph = (window as any).vis
      ? {
          nodes: new (window as any).vis.DataSet(nodes),
          edges: new (window as any).vis.DataSet(edges),
        }
      : { nodes, edges };

    return { nodes, edges, graph };
  }, [entities, relationships, selectedEntityId]);

  const options = {
    layout: {
      hierarchical: false,
    },
    nodes: {
      shape: 'box',
      font: {
        size: 14,
      },
    },
    edges: {
      color: '#848484',
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 },
      },
      font: {
        size: 12,
        align: 'middle',
      },
      smooth: {
        type: 'continuous',
      },
    },
    physics: {
      enabled: true,
      stabilization: {
        iterations: 50,
      },
    },
    interaction: {
      navigationButtons: true,
      keyboard: true,
    },
    height: '500px',
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow" style={{ height: '500px' }}>
        <Graph
          key={`graph-${nodes.length}-${edges.length}`} // Force remount when data changes
          graph={graph}
          options={options}
          events={events}
        />
      </div>
    </div>
  );
};

export default GraphView;

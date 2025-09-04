import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Graph from 'react-graph-vis';

interface Entity {
  id: string;
  name: string;
  type: string;
  attributes?: { [key: string]: any };
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

interface ConceptGroup {
  id: string;
  name: string;
  entities: string[];
  description: string;
}

interface GraphData {
  entities: Entity[];
  relationships: Relationship[];
  concept_groups: ConceptGroup[];
}

const GraphVisualizer: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIsolatedNodes, setShowIsolatedNodes] = useState<boolean>(false); // Default to not display isolated nodes
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch('/graph-content.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: GraphData = await response.json();
        setGraphData(data);
      } catch (e: any) {
        setError(e.message);
        console.error("Failed to load graph data:", e);
      }
    };

    fetchGraphData();
  }, []);

  // Graph event handlers
  const events = {
    selectNode: (event: any) => {
      const { nodes } = event;
      if (nodes && nodes.length > 0) {
        const nodeId = nodes[0];
        const entity = graphData?.entities.find(e => e.id === nodeId) || null;
        setSelectedEntity(entity);
      }
    },
  };

  // Memoize nodes, edges, and graph to avoid recreating DataSets on every render
  const { nodes, edges, graph } = useMemo(() => {
    if (!graphData) {
      return { nodes: [], edges: [], graph: { nodes: [], edges: [] } };
    }

    const connectedNodeIds = new Set<string>();
    graphData.relationships.forEach(rel => {
      connectedNodeIds.add(rel.entity1_id);
      connectedNodeIds.add(rel.entity2_id);
    });

    const filteredEntities = showIsolatedNodes
      ? graphData.entities
      : graphData.entities.filter(entity => connectedNodeIds.has(entity.id));

    const nodes = filteredEntities.map(entity => ({
      id: entity.id,
      label: entity.name,
      title: `${entity.name} (${entity.type})`,
    }));

    const edges = graphData.relationships.map(rel => ({
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
  }, [graphData, showIsolatedNodes]);

  // Map for quick entity lookup
  const entityMap = useMemo(() => {
    if (!graphData) return new Map<string, Entity>();
    return new Map(graphData.entities.map(e => [e.id, e]));
  }, [graphData]);

  // Relationship lists for the selected entity
  const { relationshipsAsEntity2, relationshipsAsEntity1 } = useMemo(() => {
    if (!selectedEntity || !graphData) {
      return { relationshipsAsEntity2: [], relationshipsAsEntity1: [] };
    }

    // Helper to determine if an entity is a summary
    const isSummary = (entityId: string) => {
      const ent = entityMap.get(entityId);
      return ent?.type === 'Summary';
    };

    // Incoming relationships where selectedEntity is entity2 and the other side is not a summary
    const relAsEntity2 = graphData.relationships
      .filter(r => r.entity2_id === selectedEntity.id && !isSummary(r.entity1_id))
      .map(r => {
        const e1 = entityMap.get(r.entity1_id);
        return `${e1?.name || r.entity1_id}  ${r.relationship}`;
      });

    // Outgoing relationships where selectedEntity is entity1 and the other side is not a summary
    const relAsEntity1 = graphData.relationships
      .filter(r => r.entity1_id === selectedEntity.id && !isSummary(r.entity2_id))
      .map(r => {
        const e2 = entityMap.get(r.entity2_id);
        return `${r.relationship}  ${e2?.name || r.entity2_id}`;
      });

    return { relationshipsAsEntity2: relAsEntity2, relationshipsAsEntity1: relAsEntity1 };
  }, [selectedEntity, graphData, entityMap]);

  const renderVisualContent = useCallback(() => {
    if (!graphData) {
      return <div>Loading graph data...</div>;
    }

    // Graph data (nodes, edges, graph) is now memoized above; no need to recompute here.

    const options = {
      layout: {
        hierarchical: false,
      },
      nodes: {
        shape: 'box',
      },
      edges: {
        color: '#ffffff',
      },
      physics: {
        stabilization: false,
      },
      height: '500px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '500px', border: '1px solid #ccc' }}>
          <Graph
            key={`graph-${showIsolatedNodes}-${nodes.length}`} // Force remount when toggle or node count changes
            graph={graph}
            options={options}
            events={events}
          />
        </div>
        {selectedEntity && (
          <div style={{ display: 'flex', gap: '1rem', width: '100%', padding: '10px', border: '1px solid #555', backgroundColor: '#333', color: 'white' }}>
            {/* Left column: incoming relationships (entity2) */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relationshipsAsEntity2.map((text, idx) => (
                  <li key={idx}>{text}</li>
                ))}
              </ul>
            </div>
            {/* Center column: entity details with larger name */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2 style={{ fontSize: '2rem', margin: '0' }}>{selectedEntity.name}</h2>
            </div>
            {/* Right column: outgoing relationships (entity1) */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {relationshipsAsEntity1.map((text, idx) => (
                  <li key={idx}>{text}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }, [graphData, showIsolatedNodes, selectedEntity, relationshipsAsEntity2, relationshipsAsEntity1, nodes.length, graph, events]);

  if (error) {
    return <div>Error loading graph data: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Graph Visualization</h1>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: 'white' }}>
          <input
            type="checkbox"
            checked={showIsolatedNodes}
            onChange={(e) => setShowIsolatedNodes(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Display Isolated Nodes
        </label>
      </div>
      {renderVisualContent()}
    </div>
  );
};

export default GraphVisualizer;

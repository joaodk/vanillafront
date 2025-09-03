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
  const [activeTab, setActiveTab] = useState<'tabular' | 'visual'>('tabular');
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

  const renderTabContent = useCallback(() => {
    if (activeTab === 'tabular') {
      if (!graphData) {
        return <div>Loading graph data...</div>;
      }
      const { entities, relationships, concept_groups } = graphData;
      return (
        <>
          <div style={{ marginBottom: '40px' }}>
            <h2>Entities</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Attributes</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Parent ID</th>
                </tr>
              </thead>
              <tbody>
                {entities.map((entity) => (
                  <tr key={entity.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{entity.id}</td>
                    <td style={{ padding: '8px' }}>{entity.name}</td>
                    <td style={{ padding: '8px' }}>{entity.type}</td>
                    <td style={{ padding: '8px' }}>{entity.attributes ? JSON.stringify(entity.attributes) : 'N/A'}</td>
                    <td style={{ padding: '8px' }}>{entity.parent_id || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2>Relationships</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Entity 1 ID</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Relationship</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Entity 2 ID</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Score</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Context</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Position</th>
                </tr>
              </thead>
              <tbody>
                {relationships.map((rel) => (
                  <tr key={rel.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{rel.id}</td>
                    <td style={{ padding: '8px' }}>{rel.entity1_id}</td>
                    <td style={{ padding: '8px' }}>{rel.relationship}</td>
                    <td style={{ padding: '8px' }}>{rel.entity2_id}</td>
                    <td style={{ padding: '8px' }}>{rel.type}</td>
                    <td style={{ padding: '8px' }}>{rel.score}</td>
                    <td style={{ padding: '8px' }}>{rel.context}</td>
                    <td style={{ padding: '8px' }}>{rel.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h2>Concept Groups</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Entities</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {concept_groups.map((group) => (
                  <tr key={group.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{group.id}</td>
                    <td style={{ padding: '8px' }}>{group.name}</td>
                    <td style={{ padding: '8px' }}>{group.entities.join(', ')}</td>
                    <td style={{ padding: '8px' }}>{group.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    } else if (activeTab === 'visual') {
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
    }
    return null;
  }, [activeTab, graphData, showIsolatedNodes, selectedEntity, relationshipsAsEntity2, relationshipsAsEntity1]); // Updated dependencies

  if (error) {
    return <div>Error loading graph data: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Graph Visualization</h1>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('tabular')}
          style={{
            marginRight: '10px',
            padding: '10px 15px',
            border: '1px solid #555',
            backgroundColor: activeTab === 'tabular' ? '#444' : '#222',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Tabular
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          style={{
            padding: '10px 15px',
            border: '1px solid #555',
            backgroundColor: activeTab === 'visual' ? '#444' : '#222',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Visual
        </button>
        {activeTab === 'visual' && (
          <label style={{ marginLeft: '20px', color: 'white' }}>
            <input
              type="checkbox"
              checked={showIsolatedNodes}
              onChange={(e) => setShowIsolatedNodes(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Display Isolated Nodes
          </label>
        )}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default GraphVisualizer;

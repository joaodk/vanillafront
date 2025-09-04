import type { FC } from "react";
import SlidingAirportDisplay from "./SlidingAirportDisplay";
import GraphView from "./GraphView";
import SelectedEntityDetails from "./SelectedEntityDetails";

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

interface EntityRelationshipsViewProps {
  analysisResult: { entities: Entity[]; relationships: Relationship[] } | null;
  isAnalyzing: boolean;
  activeTab: "tabular" | "visual";
  setActiveTab: (tab: "tabular" | "visual") => void;
  getEntityName: (id: string, entities: Entity[]) => string;
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
}

const EntityRelationshipsView: FC<EntityRelationshipsViewProps> = ({
  analysisResult,
  isAnalyzing,
  activeTab,
  setActiveTab,
  getEntityName,
  selectedEntityId,
  setSelectedEntityId
}) => {
  const selectedEntity = analysisResult?.entities.find(e => e.id === selectedEntityId) || null;
  return (
    <div className="w-2/3 pl-4 overflow-auto">
      {/* Show spinner when analyzing and no results yet */}
      {isAnalyzing && !analysisResult && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600">Analyzing text...</p>
        </div>
      )}
      
      {/* Tab Navigation */}
      {analysisResult && (analysisResult.entities.length > 0 || analysisResult.relationships.length > 0) && (
        <div className="flex flex-col h-full">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === "tabular" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("tabular")}
            >
              Tabular View
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === "visual" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("visual")}
            >
              Visual View
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === "tabular" ? (
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2">Analysis Results</h2>
          
              {/* Entities Table */}
              <div className="mb-4 flex-grow overflow-auto">
                <h3 className="text-lg font-semibold mb-1">Entities</h3>
                <div className="overflow-auto">
                  <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">ID</th>
                        <th className="py-2 px-4 border-b text-left">Name</th>
                        <th className="py-2 px-4 border-b text-left">Type</th>
                        <th className="py-2 px-4 border-b text-left">Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.entities.map((entity) => (
<tr 
  key={entity.id} 
  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedEntityId === entity.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
  onClick={() => setSelectedEntityId(entity.id)}
>
                          <td className="py-2 px-4 border-b">{entity.id}</td>
                          <td className="py-2 px-4 border-b font-medium">{entity.name}</td>
                          <td className="py-2 px-4 border-b">{entity.type}</td>
                          <td className="py-2 px-4 border-b">
                            {Object.keys(entity.attributes).length > 0 ? (
                              <pre className="text-xs bg-gray-100 p-2 rounded">
                                {JSON.stringify(entity.attributes, null, 2)}
                              </pre>
                            ) : (
                              "None"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Relationships Table */}
              <div className="flex-grow overflow-auto">
                <h3 className="text-lg font-semibold mb-1">Relationships</h3>
                <div className="overflow-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border-b text-left">ID</th>
                        <th className="py-2 px-4 border-b text-left">Entity 1</th>
                        <th className="py-2 px-4 border-b text-left">Relationship</th>
                        <th className="py-2 px-4 border-b text-left">Entity 2</th>
                        <th className="py-2 px-4 border-b text-left">Type</th>
                        <th className="py-2 px-4 border-b text-left">Score</th>
                        <th className="py-2 px-4 border-b text-left">Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.relationships.map((relationship) => (
                        <tr key={relationship.id} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b">{relationship.id}</td>
                          <td className="py-2 px-4 border-b">{getEntityName(relationship.entity1_id, analysisResult.entities)}</td>
                          <td className="py-2 px-4 border-b">{relationship.relationship}</td>
                          <td className="py-2 px-4 border-b">{getEntityName(relationship.entity2_id, analysisResult.entities)}</td>
                          <td className="py-2 px-4 border-b">{relationship.type}</td>
                          <td className="py-2 px-4 border-b">{relationship.score}</td>
                          <td className="py-2 px-4 border-b">{relationship.context}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // Visual View with Graph
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold mb-2">Visual View</h2>
              {analysisResult && (
                <div className="flex-grow flex flex-col">
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded mb-4">
                    {selectedEntityId && analysisResult ? (
                      <SlidingAirportDisplay 
                        first={analysisResult.relationships
                          .filter(rel => rel.entity2_id === selectedEntityId)
                          .map(rel => `${getEntityName(rel.entity1_id, analysisResult.entities)} ${rel.relationship}`)
                        }
                        second={getEntityName(selectedEntityId, analysisResult.entities)}
                        third={analysisResult.relationships
                          .filter(rel => rel.entity1_id === selectedEntityId)
                          .map(rel => `${rel.relationship} ${getEntityName(rel.entity2_id, analysisResult.entities)}`)
                        }
                      />
                    ) : (
                      <SlidingAirportDisplay />
                    )}
                  </div>
                  <div className="flex-grow border border-gray-300 rounded p-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Graph Visualization</h3>
                      <button 
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                        onClick={() => window.location.reload()}
                      >
                        Reset Visualization
                      </button>
                    </div>
<GraphView
  entities={analysisResult.entities}
  relationships={analysisResult.relationships}
  selectedEntityId={selectedEntityId}
  setSelectedEntityId={setSelectedEntityId}
  getEntityName={getEntityName}
/>
<SelectedEntityDetails
  entity={selectedEntity}
  relationships={analysisResult.relationships}
  getEntityName={getEntityName}
  entities={analysisResult.entities}
/>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityRelationshipsView;

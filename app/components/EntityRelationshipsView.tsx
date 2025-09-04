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
  getEntityName: (id: string, entities: Entity[]) => string;
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
}

const EntityRelationshipsView: FC<EntityRelationshipsViewProps> = ({
  analysisResult,
  isAnalyzing,
  getEntityName,
  selectedEntityId,
  setSelectedEntityId
}) => {
  const selectedEntity = analysisResult?.entities.find(e => e.id === selectedEntityId) || null;
  return (
    <div className="w-2/3 pl-3 overflow-auto">
      {/* Show spinner when analyzing and no results yet */}
      {isAnalyzing && !analysisResult && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600">Analyzing text...</p>
        </div>
      )}
      
      {/* Visual View with Graph */}
      {analysisResult && (analysisResult.entities.length > 0 || analysisResult.relationships.length > 0) && (
        <div className="flex flex-col h-full">
          {analysisResult && (
            <div className="flex-grow flex flex-col">
              <div className="w-full min-h-20 flex items-center justify-center rounded mb-4">
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
              <div className="flex flex-col flex-grow rounded p-1 min-h-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-semibold">Graph Visualization</h3>
                </div>
                <div className="flex-grow min-h-0">
                  <GraphView
                    entities={analysisResult.entities}
                    relationships={analysisResult.relationships}
                    selectedEntityId={selectedEntityId}
                    setSelectedEntityId={setSelectedEntityId}
                    getEntityName={getEntityName}
                  />
                  <div className="flex-grow min-h-0 mt-2 overflow-auto">
                    <SelectedEntityDetails
                      entity={selectedEntity}
                      relationships={analysisResult.relationships}
                      getEntityName={getEntityName}
                      entities={analysisResult.entities}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityRelationshipsView;

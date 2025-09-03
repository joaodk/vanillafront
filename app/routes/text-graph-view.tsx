import { useState, useRef, useEffect } from "react";
import type { FC } from "react";
import GraphVisualizer from "../components/GraphVisualizer";
import PersistentMarkdownEditor from "../components/PersistentMarkdownEditor";
import type { PersistentMarkdownEditorRef } from "../components/PersistentMarkdownEditor";
import AnalyzeButton from "../components/AnalyzeButton";

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

const TextGraphViewPage: FC = () => {
  const [analysisResult, setAnalysisResult] = useState<{ entities: Entity[]; relationships: Relationship[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [activeTab, setActiveTab] = useState<"tabular" | "visual">("tabular");
  const editorRef = useRef<PersistentMarkdownEditorRef>(null);

  // Helper function to get entity name by ID
  const getEntityName = (id: string, entities: Entity[]): string => {
    const entity = entities.find(e => e.id === id);
    return entity ? entity.name : id;
  };

  // Track current content of the editor
  useEffect(() => {
    const interval = setInterval(() => {
      if (editorRef.current) {
        const content = editorRef.current.getContent() || "";
        setCurrentContent(content);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-row h-screen">
      {/* Left pane: textarea and analyze button (1/3 width) */}
      <div className="w-1/3 pr-4 flex flex-col relative">
        <div className="absolute top-0 left-0 z-10">
          <AnalyzeButton 
            editorRef={editorRef} 
            onAnalysisComplete={setAnalysisResult} 
            onLoadingChange={setIsAnalyzing}
            currentContent={currentContent}
            lastAnalyzedContent={lastAnalyzedContent}
            onLastAnalyzedContentChange={setLastAnalyzedContent}
          />
        </div>
        <PersistentMarkdownEditor
          ref={editorRef}
          storageKey="textGraphMarkdown"
          initialContentUrl="/text-graph-view.md"
          className="w-full h-full border rounded p-2 flex-grow mt-10"
        />
      </div>
      
      {/* Right pane: preview and graph (2/3 width) */}
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
                    <table className="min-w-full bg-white border border-gray-200">
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
                          <tr key={entity.id} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{entity.id}</td>
                            <td className="py-2 px-4 border-b">{entity.name}</td>
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
              // Visual View (blank for now)
              <div className="flex flex-col h-full">
                <h2 className="text-xl font-bold mb-2">Visual View</h2>
                <div className="flex-grow flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <p className="text-gray-500">Visual representation area (to be implemented)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextGraphViewPage;

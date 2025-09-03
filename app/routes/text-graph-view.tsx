import { useState, useRef, useEffect } from "react";
import type { FC } from "react";
import GraphVisualizer from "../components/GraphVisualizer";
import PersistentMarkdownEditor from "../components/PersistentMarkdownEditor";
import type { PersistentMarkdownEditorRef } from "../components/PersistentMarkdownEditor";
import AnalyzeButton from "../components/AnalyzeButton";
import EntityRelationshipsView from "../components/EntityRelationshipsView";
import { RouteProtection } from "~/components";

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
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const editorRef = useRef<PersistentMarkdownEditorRef>(null);

  // Helper function to get entity name by ID
  const getEntityName = (id: string, entities: Entity[]): string => {
    const entity = entities.find(e => e.id === id);
    return entity ? entity.name : id;
  };

  // Set the first entity as selected by default when analysis results are loaded
  useEffect(() => {
    if (analysisResult && analysisResult.entities.length > 0 && selectedEntityId === null) {
      setSelectedEntityId(analysisResult.entities[0].id);
    }
  }, [analysisResult, selectedEntityId]);

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
    <RouteProtection>
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
        <EntityRelationshipsView
          analysisResult={analysisResult}
          isAnalyzing={isAnalyzing}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          getEntityName={getEntityName}
          selectedEntityId={selectedEntityId}
          setSelectedEntityId={setSelectedEntityId}
        />
      </div>
    </RouteProtection>
  );
};

export default TextGraphViewPage;

import { useState, useRef } from "react";
import type { FC } from "react";
import type { PersistentMarkdownEditorRef } from "./PersistentMarkdownEditor";
import { ANALYZE_API } from "../lib/constants";
import { useAuthData } from "../lib/auth";

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

interface AnalyzeButtonProps {
  editorRef: React.RefObject<PersistentMarkdownEditorRef | null>;
  onAnalysisComplete: (result: { entities: Entity[]; relationships: Relationship[] } | null) => void;
  onLoadingChange?: (loading: boolean) => void;
  currentContent: string;
  lastAnalyzedContent: string;
  onLastAnalyzedContentChange: (content: string) => void;
}

const AnalyzeButton: FC<AnalyzeButtonProps> = ({ 
  editorRef, 
  onAnalysisComplete, 
  onLoadingChange,
  currentContent,
  lastAnalyzedContent,
  onLastAnalyzedContentChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { getToken } = useAuthData();

  // Check if content has changed since last analysis
  const hasContentChanged = currentContent !== lastAnalyzedContent;

  const startTimer = () => {
    setElapsedTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      onLoadingChange?.(true);
      startTimer();
      
      const token = await getToken();
      // Get content from the editor ref
      const content = editorRef.current?.getContent() || "";
      const response = await fetch(ANALYZE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: content }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      onAnalysisComplete(data);
      onLastAnalyzedContentChange(content);
    } catch (error) {
      console.error("Error analyzing text:", error);
      onAnalysisComplete({ entities: [], relationships: [] });
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
      stopTimer();
    }
  };

  // Simple spinner component
  const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center"
      onClick={handleAnalyze}
      disabled={isLoading || !hasContentChanged}
    >
      {isLoading ? (
        <>
          <Spinner />
          Analyzing... {elapsedTime}s
        </>
      ) : (
        "Analyze"
      )}
    </button>
  );
};

export default AnalyzeButton;

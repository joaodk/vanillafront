import { useEffect, useState } from "react";
import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import GraphVisualizer from "../components/GraphVisualizer";

const TextGraphViewPage: FC = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/text-graph-view.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <ReactMarkdown>{markdown}</ReactMarkdown>
      <h2 className="text-2xl font-semibold mb-4 mt-8">Graph Visualization</h2>
      <GraphVisualizer />
    </div>
  );
};

export default TextGraphViewPage;

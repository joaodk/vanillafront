import { useEffect, useState } from "react";
import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import GraphVisualizer from "../components/GraphVisualizer";

const TextGraphViewPage: FC = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("textGraphMarkdown");
    if (stored) {
      setMarkdown(stored);
    } else {
      fetch("/text-graph-view.md")
        .then((response) => response.text())
        .then((text) => {
          setMarkdown(text);
          localStorage.setItem("textGraphMarkdown", text);
        });
    }
  }, []);

    return (
      <div className="container mx-auto px-4 py-8 flex">
        {/* Left pane: textarea */}
        <div className="w-1/3 pr-4">
          <textarea
            className="w-full h-full border rounded p-2"
            value={markdown}
            onChange={(e) => {
              const newVal = e.target.value;
              setMarkdown(newVal);
              localStorage.setItem("textGraphMarkdown", newVal);
            }}
          />
        </div>
        {/* Right pane: preview and graph */}
        <div className="w-2/3 pl-4 overflow-auto">

        </div>
      </div>
    );
};

export default TextGraphViewPage;

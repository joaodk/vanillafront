import { useEffect, useState } from "react";
import type { FC } from "react";
import ReactMarkdown from "react-markdown";

const HomePage: FC = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/home.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default HomePage;

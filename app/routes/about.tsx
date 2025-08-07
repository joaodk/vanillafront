import { type FC, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

const AboutPage: FC = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/about.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default AboutPage;

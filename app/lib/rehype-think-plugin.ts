import { visit } from 'unist-util-visit';

interface Node {
  type: string;
  [key: string]: unknown; // Allow other properties
}

interface Element extends Node {
  tagName: string;
  properties: Record<string, unknown>;
}

const rehypeThinkPlugin = () => {
  return (tree: Node) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'think') {
        node.tagName = 'blockquote';
        node.properties = { ...node.properties, className: 'think-block' };
      }
    });
  };
};

export default rehypeThinkPlugin;

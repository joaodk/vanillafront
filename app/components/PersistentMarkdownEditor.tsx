import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from "react";
import type { TextareaHTMLAttributes, ForwardedRef } from "react";

interface PersistentMarkdownEditorProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'defaultValue'> {
  storageKey: string;
  defaultValue?: string;
  initialContentUrl?: string;
  onChange?: (content: string) => void;
}

export interface PersistentMarkdownEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
}

const PersistentMarkdownEditor = forwardRef<PersistentMarkdownEditorRef, PersistentMarkdownEditorProps>(
  (
    { storageKey, defaultValue = "", initialContentUrl, onChange, ...textareaProps }: PersistentMarkdownEditorProps,
    ref: ForwardedRef<PersistentMarkdownEditorRef>
  ) => {
    const [content, setContent] = useState(defaultValue);
    const contentRef = useRef(content);
    const [isLoading, setIsLoading] = useState(false);

    // Update ref when content changes
    useEffect(() => {
      contentRef.current = content;
    }, [content]);

    // Expose methods to parent components
useImperativeHandle(ref, () => ({
  getContent: () => contentRef.current,
  setContent: (newContent: string) => {
    setContent(newContent);
    contentRef.current = newContent;
    localStorage.setItem(storageKey, newContent);
  },
}));

    // Load content from localStorage on mount
    useEffect(() => {
      const loadContent = async () => {
        setIsLoading(true);
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            setContent(stored);
            contentRef.current = stored;
          } else if (initialContentUrl) {
            // Fetch initial content from URL if provided
            const response = await fetch(initialContentUrl);
            const text = await response.text();
            setContent(text);
            contentRef.current = text;
            localStorage.setItem(storageKey, text);
          } else if (defaultValue) {
            setContent(defaultValue);
            contentRef.current = defaultValue;
          }
        } catch (error) {
          console.error("Error loading initial content:", error);
          // Fallback to defaultValue if fetch fails
          if (defaultValue) {
            setContent(defaultValue);
            contentRef.current = defaultValue;
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadContent();
    }, [storageKey, defaultValue, initialContentUrl]);

    // Handle content changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newVal = e.target.value;
      setContent(newVal);
      contentRef.current = newVal;
      localStorage.setItem(storageKey, newVal);
      onChange?.(newVal);
    };

    return (
      <textarea
        {...textareaProps}
        value={isLoading ? "Loading..." : content}
        onChange={handleChange}
      />
    );
  }
);

export default PersistentMarkdownEditor;

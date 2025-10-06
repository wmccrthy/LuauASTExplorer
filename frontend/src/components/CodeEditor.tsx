import React, { useRef } from "react";
import Editor from "react-simple-code-editor";
import { highlightLuauCode } from "../utils/syntaxHighlighting";
import "./CodeEditor.css";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  height?: string; // height of the scrollable container
  placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  height = "320px",
  placeholder = "Enter your Luau code here...",
}) => {
  const editorRef = useRef<any>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only focus if clicking on the container itself, not the editor content
    if (e.target === e.currentTarget) {
      // Try multiple ways to access the textarea
      const container = e.currentTarget as HTMLElement;
      const textarea = container.querySelector("textarea");
      if (textarea) {
        textarea.focus();
      }
    }
  };

  return (
    <div
      className="code-editor-viewport"
      style={{
        height,
        overflow: "auto",
        resize: "vertical",
        minHeight: "120px",
        maxHeight: "80vh",
      }}
      onClick={handleContainerClick}
    >
      <Editor
        ref={editorRef}
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlightLuauCode(code)}
        padding={8}
        preClassName="hljs lua"
        textareaClassName=""
        placeholder={placeholder}
        // keep styles minimal—no height!
        style={{
          border: "transparent",
          background: "transparent",
          fontFamily:
            'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
          fontSize: 13,
          lineHeight: 1.3,
        }}
      />
    </div>
  );
};

export default CodeEditor;

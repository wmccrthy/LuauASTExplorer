import React from "react";
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
  return (
    <div className="code-editor-viewport" style={{ height, overflow: "auto" }}>
      {/* Editor is natural height; no height style here */}
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => highlightLuauCode(code)}
        padding={8}
        preClassName="hljs lua"
        placeholder={placeholder}
        // keep styles minimal—no height!
        style={{
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

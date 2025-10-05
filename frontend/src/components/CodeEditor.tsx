import React, {
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { highlightLuauCode } from "../utils/syntaxHighlighting";
import "./CodeEditor.css"

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string; // e.g. "200px" or "40vh"
}

const PADDING_X = 12;
const PADDING_Y = 8;

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your Luau code here...",
  height = "200px",
}) => {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  // Build highlighted HTML once per value change
  const highlighted = useMemo(() => {
    if (!value) return "";
    // Ensure there's always a trailing newline so the last line height matches textarea
    return highlightLuauCode(value) + "<br/>";
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    const textarea = e.currentTarget;

    // Tab / Shift+Tab for indent / outdent
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const before = value.slice(0, start);
      const selection = value.slice(start, end);
      const after = value.slice(end);

      // If selection spans multiple lines, indent/outdent linewise
      const isMultiLine = selection.includes("\n");
      const INDENT = "  ";

      if (e.shiftKey) {
        // OUTDENT
        if (isMultiLine) {
          const replaced = selection
            .split("\n")
            .map((line) =>
              line.startsWith(INDENT)
                ? line.slice(INDENT.length)
                : line.replace(/^\t/, "")
            )
            .join("\n");
          const newVal = before + replaced + after;
          const removedPerLine = selection
            .split("\n")
            .map((line) =>
              line.startsWith(INDENT)
                ? INDENT.length
                : line.startsWith("\t")
                ? 1
                : 0
            )
            .reduce((a, b) => a + b, 0);
          onChange(newVal);
          // keep selection
          requestAnimationFrame(() => {
            textarea.selectionStart = start;
            textarea.selectionEnd = end - removedPerLine;
          });
        } else {
          // single line outdent if possible
          const lineStart = value.lastIndexOf("\n", start - 1) + 1;
          const linePrefix = value.slice(lineStart, start);
          let delta = 0;
          if (linePrefix.startsWith(INDENT)) {
            const newVal =
              value.slice(0, lineStart) +
              value.slice(lineStart + INDENT.length);
            delta = INDENT.length;
            onChange(newVal);
          } else if (linePrefix.startsWith("\t")) {
            const newVal =
              value.slice(0, lineStart) + value.slice(lineStart + 1);
            delta = 1;
            onChange(newVal);
          } else {
            return; // nothing to outdent
          }
          requestAnimationFrame(() => {
            const newPos = Math.max(start - delta, lineStart);
            textarea.selectionStart = textarea.selectionEnd = newPos;
          });
        }
      } else {
        // INDENT
        if (isMultiLine) {
          const replaced = selection
            .split("\n")
            .map((line) => INDENT + line)
            .join("\n");
          const newVal = before + replaced + after;
          onChange(newVal);
          requestAnimationFrame(() => {
            textarea.selectionStart = start + INDENT.length;
            textarea.selectionEnd =
              end + INDENT.length * selection.split("\n").length;
          });
        } else {
          const newVal = before + INDENT + after;
          onChange(newVal);
          requestAnimationFrame(() => {
            const pos = start + INDENT.length;
            textarea.selectionStart = textarea.selectionEnd = pos;
          });
        }
      }
    }
  };

  // Keep the <pre> scrolled with the textarea
  const syncScroll = () => {
    const ta = taRef.current;
    const pre = preRef.current;
    if (!ta || !pre) return;
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
  };

  useEffect(() => {
    // Sync scroll when value changes (line wraps can change height)
    syncScroll();
  }, [value]);

  return (
    <div className="luau-editor-shell" style={{ height }}>
      {/* Highlight layer */}
      <pre
        ref={preRef}
        className="luau-editor-pre hljs"
        aria-hidden="true"
        style={{
          padding: `${PADDING_Y}px ${PADDING_X}px`,
        }}
      >
        <code
          className="lua"
          // Show placeholder as dim text when empty
          dangerouslySetInnerHTML={{
            __html:
              value.trim().length === 0
                ? `<span class="luau-editor-placeholder">${(placeholder || "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</span>`
                : highlighted,
          }}
        />
      </pre>

      {/* Input layer */}
      <textarea
        ref={taRef}
        className="luau-editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          padding: `${PADDING_Y}px ${PADDING_X}px`,
        }}
        aria-label="Luau code editor"
      />
    </div>
  );
};

export default CodeEditor;

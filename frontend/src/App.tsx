import React, { useState, useEffect } from "react";
import { isSearchable } from "./helpers";
import TreeNodeContainer from "./TreeNode";
import CodeEditor from "./CodeEditor";
import "./App.css";
import {
  handleParseResult,
  parseAST,
  handleParseDiffResult,
  parseDiff,
} from "./parsingMessageHandlers";
import {
  ASTNode,
  ParseResultMessage,
  ParseDiffResultMessage,
  VSCodeAPI,
  WindowMode,
  DiffASTNode,
} from "./typesAndInterfaces";
import FilterDropdown from "./components/filterDropdown";

const App: React.FC = () => {
  // Get all available node keys and start with none hidden (all visible)
  const [hiddenNodes, setHiddenNodes] = useState<string[]>([]);

  const [originalContent, setOriginalContent] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [astMode, setAstMode] = useState<"json" | "text">("text");
  const [astTree, setAstTree] = useState<ASTNode | null>(null);

  // Multi-window state
  const [windowMode, setWindowMode] = useState<WindowMode>(
    WindowMode.LiveEditor
  );
  const [codeSnippet1, setCodeSnippet1] = useState<string>(""); // Live editor / Before code
  const [codeSnippet2, setCodeSnippet2] = useState<string>(""); // After code (diff analyzer only)

  // Live parsing state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [vscodeApi, setVscodeApi] = useState<VSCodeAPI | null>(null);

  // Diff parsing state
  const [isParsingDiff, setIsParsingDiff] = useState<boolean>(false);
  const [parseDiffError, setParseDiffError] = useState<string | null>(null);
  const [diffTree, setDiffTree] = useState<DiffASTNode | null>(null);

  // Initialize with AST data from window
  useEffect(() => {
    const mode = window.astMode || "text";
    setAstMode(mode);

    if (window.astData) {
      const content = window.astData;

      if (mode === "json") {
        try {
          const parsedAST = JSON.parse(content);
          setAstTree(parsedAST);

          // For now, show formatted JSON until we build tree view
          const formatted = JSON.stringify(parsedAST, null, 2);
          setOriginalContent(formatted);
        } catch (e) {
          // Fallback to text mode if JSON parsing fails
          setOriginalContent(content);
          setAstMode("text");
        }
      } else {
        setOriginalContent(content);
      }

      setCodeSnippet1(window.selectedText || "");
    } else {
      // Fallback if no AST data
      const testContent = "No AST data received from extension";
      setOriginalContent(testContent);
    }
  }, []);

  // Set up VSCode API and message listener
  useEffect(() => {
    if (window.acquireVsCodeApi) {
      const api = window.acquireVsCodeApi();
      setVscodeApi(api);

      // Set up message listener for responses from extension
      const messageListener = (event: MessageEvent) => {
        const message = event.data;

        if (message.command === "parseResult") {
          handleParseResult(
            message as ParseResultMessage,
            setIsParsing,
            setParseError,
            setAstTree
          );
        } else if (message.command === "parseDiffResult") {
          handleParseDiffResult(
            message as ParseDiffResultMessage,
            setIsParsingDiff,
            setParseDiffError,
            setDiffTree
          );
        }
      };

      window.addEventListener("message", messageListener);

      // Cleanup listener on unmount
      return () => {
        window.removeEventListener("message", messageListener);
      };
    }
  }, []);

  // Search functionality
  const performSearch = (term: string) => {
    if (!term || !isSearchable(term)) {
      setOriginalContent(originalContent);
      setTotalMatches(0);
      return;
    }

    // Text mode search with HTML marks and navigation
    const regex = new RegExp(term, "gi");
    let matchCount = 0;
    const highlighted = originalContent.replace(regex, (match) => {
      matchCount++;
      return `<mark id="match-${matchCount}" class="search-match">${match}</mark>`;
    });

    setOriginalContent(highlighted);
    setTotalMatches(matchCount);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    performSearch(term);
  };

  // Render different window content based on mode
  const renderWindowContent = () => {
    switch (windowMode) {
      case WindowMode.LiveEditor:
        // Window 1: Live code editor + AST view
        return (
          <div className="live-editor-layout">
            <div className="code-preview-section">
              <h3>📝 Code Preview</h3>
              <CodeEditor
                value={codeSnippet1}
                onChange={setCodeSnippet1}
                placeholder="Edit your Luau code here..."
                height="200px"
              />
            </div>
            <div className="button-section">
              <button
                className="btn"
                onClick={() => parseAST(codeSnippet1, vscodeApi, setParseError)}
                disabled={isParsing || !codeSnippet1.trim()}
              >
                {isParsing ? "⏳ Parsing..." : "🔄 Parse AST"}
              </button>
              <FilterDropdown hiddenNodes={hiddenNodes} setHiddenNodes={setHiddenNodes} />
            </div>
            <div className="ast-view-section">
              <h3>🌳 Live AST</h3>
              <div className="ast-view-content">
                {parseError ? (
                  <div className="error-message">
                    ❌ Parse Error: {parseError}
                  </div>
                ) : isParsing ? (
                  <div className="loading-message">⏳ Parsing AST...</div>
                ) : astTree ? (
                  <div className="ast-content tree-view">
                    <TreeNodeContainer
                      nodeKey="root"
                      value={astTree}
                      level={0}
                      searchTerm={searchTerm}
                      hiddenNodes={hiddenNodes}
                    />
                  </div>
                ) : (
                  <div className="placeholder">
                    Click "Parse AST" to see the AST structure
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case WindowMode.DiffAnalyzer:
        // Window 2: Codemod transformation diff
        return (
          <div className="diff-analyzer-layout">
            <div className="diff-header">
              <h3>🔄 Codemod Transformation Analyzer</h3>
              <p>
                Compare two code snippets to see how the AST needs to be
                modified to transform the first into the second
              </p>
            </div>
            <div className="code-inputs-section">
              <div className="code-input">
                <h4>📝 Before (Code to Transform)</h4>
                <CodeEditor
                  value={codeSnippet1}
                  onChange={setCodeSnippet1}
                  placeholder="Original code..."
                  height="180px"
                />
              </div>
              <div className="code-input">
                <h4>✨ After (Target Result)</h4>
                <CodeEditor
                  value={codeSnippet2}
                  onChange={setCodeSnippet2}
                  placeholder="Transformed code..."
                  height="180px"
                />
              </div>
            </div>
            <div className="button-section">
              <button
                className="btn"
                onClick={() =>
                  parseDiff(
                    codeSnippet1,
                    codeSnippet2,
                    vscodeApi,
                    setParseDiffError
                  )
                }
                disabled={
                  isParsingDiff || !codeSnippet1.trim() || !codeSnippet2.trim()
                }
              >
                {isParsingDiff ? "⏳ Analyzing..." : "🔍 Analyze Transformation"}
              </button>
              <FilterDropdown hiddenNodes={hiddenNodes} setHiddenNodes={setHiddenNodes} />
            </div>
            <div className="ast-view-section">
              <h4>🌳 AST Transformation Diff</h4>
              {parseDiffError ? (
                <div className="error-message">
                  ❌ Diff Error: {parseDiffError}
                </div>
              ) : isParsingDiff ? (
                <div className="loading-message">
                  ⏳ Analyzing transformation...
                </div>
              ) : diffTree ? (
                <div className="ast-content tree-view">
                  <TreeNodeContainer
                    nodeKey="root"
                    value={diffTree}
                    level={0}
                    searchTerm={searchTerm}
                    isDiffMode={true}
                    hiddenNodes={hiddenNodes}
                  />
                </div>
              ) : (
                <div className="placeholder">
                  Enter code in both fields and click "Analyze Transformation"
                  to see the AST diff
                </div>
              )}
            </div>
          </div>
        );

      default:
        return <div>Unknown window mode</div>;
    }
  };

  return (
    <div className="ast-explorer">
      <div className="header">
        <div className="title">
          🌳 AST Explorer
          <span
            style={{
              fontSize: "12px",
              marginLeft: "8px",
              padding: "2px 6px",
              backgroundColor:
                astMode === "json"
                  ? "var(--vscode-statusBarItem-prominentBackground)"
                  : "var(--vscode-badge-background)",
              borderRadius: "3px",
            }}
          >
            {astMode.toUpperCase()}
          </span>
        </div>

        <div className="window-mode-toggle">
          <button
            className={`btn ${
              windowMode === WindowMode.LiveEditor ? "active" : ""
            }`}
            onClick={() => setWindowMode(WindowMode.LiveEditor)}
          >
            ✏️ Live Editor
          </button>
          <button
            className={`btn ${
              windowMode === WindowMode.DiffAnalyzer ? "active" : ""
            }`}
            onClick={() => setWindowMode(WindowMode.DiffAnalyzer)}
          >
            🔄 Codemod Diff
          </button>
        </div>
        {windowMode === WindowMode.LiveEditor && (
          <div className="controls">
            <input
              type="text"
              className="search-box"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <span className="search-info">
              {totalMatches > 0 ? `${totalMatches} matches` : ""}
            </span>
          </div>
        )}
      </div>

      {renderWindowContent()}
    </div>
  );
};

export default App;

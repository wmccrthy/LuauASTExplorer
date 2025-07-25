import React, { useState, useEffect } from 'react';
import { isSearchable } from './helpers';
import TreeNodeContainer from './TreeNode';
import CodeEditor from './CodeEditor';
import './App.css';

// Global window interface for VSCode webview API and AST data
declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
    astData?: string;
    astMode?: 'json' | 'text';
    selectedText?: string;
  }
}

interface VSCodeAPI {
  postMessage(message: any): void;
  setState?(state: any): void;
  getState?(): any;
}

interface ParseASTMessage {
  command: 'parseAST';
  code: string;
}

interface ParseResultMessage {
  command: 'parseResult';
  status: 'loading' | 'success' | 'error';
  astResult?: string;
  error?: string;
}

interface ASTNode {
  tag?: string;
  location?: {
    begin: { line: number; column: number };
    end: { line: number; column: number };
  };
  [key: string]: any;
}

enum WindowMode {
  Explorer = 'explorer',      // Current AST viewer (default)
  LiveEditor = 'live-editor', // Window 1: Live code editor + AST
  DiffAnalyzer = 'diff-analyzer' // Window 2: Code transformation diff
}

const App: React.FC = () => {
  // Original AST viewer state
  const [astContent, setAstContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [astMode, setAstMode] = useState<'json' | 'text'>('text');
  const [astTree, setAstTree] = useState<ASTNode | null>(null);

  // Multi-window state
  const [windowMode, setWindowMode] = useState<WindowMode>(WindowMode.Explorer);
  const [codeSnippet1, setCodeSnippet1] = useState<string>(''); // Live editor / Before code
  const [codeSnippet2, setCodeSnippet2] = useState<string>(''); // After code (diff analyzer only)
  const [astTree1, setAstTree1] = useState<ASTNode | null>(null);
  const [astTree2, setAstTree2] = useState<ASTNode | null>(null);

  // Live parsing state
  const [isParsing1, setIsParsing1] = useState<boolean>(false);
  const [parseError1, setParseError1] = useState<string | null>(null);
  const [vscodeApi, setVscodeApi] = useState<VSCodeAPI | null>(null);

  // Initialize with AST data from window
  useEffect(() => {
    const mode = window.astMode || 'text';
    setAstMode(mode);
    
    if (window.astData) {
      const content = window.astData;
      
      if (mode === 'json') {
        try {
          const parsedAST = JSON.parse(content);
          setAstTree(parsedAST);
          
          // For now, show formatted JSON until we build tree view
          const formatted = JSON.stringify(parsedAST, null, 2);
          setAstContent(formatted);
          setOriginalContent(formatted);
        } catch (e) {
          // Fallback to text mode if JSON parsing fails
          setAstContent(content);
          setOriginalContent(content);
          setAstMode('text');
        }
      } else {
        setAstContent(content);
        setOriginalContent(content);
      }
      
      setCodeSnippet1(window.selectedText || '');
      
    } else {
      // Fallback if no AST data
      const testContent = 'No AST data received from extension';
      setAstContent(testContent);
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
        const message = event.data as ParseResultMessage;
        if (message.command === 'parseResult') {
          handleParseResult(message);
        }
      };

      window.addEventListener('message', messageListener);

      // Cleanup listener on unmount
      return () => {
        window.removeEventListener('message', messageListener);
      };
    }
  }, []);

  // Calculate stats
  const getStats = () => {
    const lines = astContent.split('\n').length;
    const characters = astContent.length;
    
    let nodes = 0;
    if (astMode === 'json' && astTree) {
      // Count nodes in JSON tree
      const countNodes = (obj: any): number => {
        let count = 0;
        if (obj && typeof obj === 'object') {
          if (obj.tag) count = 1;
          for (const value of Object.values(obj)) {
            if (Array.isArray(value)) {
              count += value.reduce((acc, item) => acc + countNodes(item), 0);
            } else {
              count += countNodes(value);
            }
          }
        }
        return count;
      };
      nodes = countNodes(astTree);
    } else {
      // Count nodes in text mode (fallback)
      nodes = (astContent.match(/tag[":]/g) || []).length;
    }
    
    return { lines, nodes, characters };
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      let textToCopy = originalContent;
      
      if (astMode === 'json' && astTree) {
        // For JSON mode, copy the formatted JSON
        textToCopy = JSON.stringify(astTree, null, 2);
      }
      
      await navigator.clipboard.writeText(textToCopy);
      // TODO: Add toast notification for user feedback
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Search functionality
  const performSearch = (term: string) => {
    if (!term || !isSearchable(term)) {
      setAstContent(originalContent);
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    if (astMode === 'json') {
      // For JSON mode, simple highlighting without navigation
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      // TreeNode handles the actual highlighting
      return;
    }

    // Text mode search with HTML marks and navigation
    const regex = new RegExp(term, 'gi');
    let matchCount = 0;
    const highlighted = originalContent.replace(regex, (match) => {
      matchCount++;
      return `<mark id="match-${matchCount}" class="search-match">${match}</mark>`;
    });

    setAstContent(highlighted);
    setTotalMatches(matchCount);
    setCurrentMatchIndex(0);

    // Auto-scroll to first match
    if (matchCount > 0) {
      setTimeout(() => scrollToMatch(0), 100);
    }
  };

  // Navigation
  const scrollToMatch = (index: number) => {
    if (astMode === 'json') {
      // Tree view uses different IDs and the TreeNodeContainer handles scrolling
      // Just trigger a re-render - TreeNodeContainer will handle the scrolling
      return;
    }

    // Text mode navigation with HTML marks
    setTimeout(() => {
      const match = document.getElementById(`match-${index + 1}`);
      if (match) {
        // Remove current-match from all
        document.querySelectorAll('.search-match').forEach(m => m.classList.remove('current-match'));
        
        // Add current-match to the target
        match.classList.add('current-match');
        
        // Scroll to the match
        match.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 50);
  };

  const nextMatch = () => {
    if (totalMatches > 0) {
      const newIndex = (currentMatchIndex + 1) % totalMatches;
      setCurrentMatchIndex(newIndex);
      scrollToMatch(newIndex);
    }
  };

  const previousMatch = () => {
    if (totalMatches > 0) {
      const newIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches;
      setCurrentMatchIndex(newIndex);
      scrollToMatch(newIndex);
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    performSearch(term);
  };

  // Handle Enter key for cycling
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextMatch();
    }
  };

  // Handle parse result messages from extension
  const handleParseResult = (message: ParseResultMessage) => {
    switch (message.status) {
      case 'loading':
        setIsParsing1(true);
        setParseError1(null);
        break;
      case 'success':
        setIsParsing1(false);
        setParseError1(null);
        if (message.astResult) {
          try {
            // Try to parse as JSON for tree view
            const parsedAST = JSON.parse(message.astResult);
            setAstTree1(parsedAST);
          } catch (e) {
            // If not JSON, handle as text (though we expect JSON from our parser)
            console.warn('Received non-JSON AST result:', e);
            setAstTree1(null);
          }
        }
        break;
      case 'error':
        setIsParsing1(false);
        setParseError1(message.error || 'Unknown parsing error');
        setAstTree1(null);
        break;
    }
  };

  // Send parse request to extension
  const parseAST = (code: string) => {
    if (!vscodeApi) {
      setParseError1('VSCode API not available');
      return;
    }

    if (!code.trim()) {
      setParseError1('Please enter some code to parse');
      return;
    }

    const message: ParseASTMessage = {
      command: 'parseAST',
      code: code
    };

    vscodeApi.postMessage(message);
  };

  const stats = getStats();

  // Render different window content based on mode
  const renderWindowContent = () => {
    switch (windowMode) {
      case WindowMode.Explorer:
        // Original AST explorer (current functionality)
        return (
          <div className="ast-container">
            {astMode === 'json' && astTree ? (
              <div className="ast-content tree-view">
                <TreeNodeContainer
                  nodeKey="root"
                  value={astTree}
                  level={0}
                  searchTerm={searchTerm}
                />
              </div>
            ) : (
              <pre 
                className="ast-content" 
                dangerouslySetInnerHTML={{ __html: astContent }}
              />
            )}
          </div>
        );
        
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
               <button 
                 className="btn parse-btn"
                 onClick={() => parseAST(codeSnippet1)}
                 disabled={isParsing1 || !codeSnippet1.trim()}
               >
                 {isParsing1 ? '⏳ Parsing...' : '🔄 Parse AST'}
               </button>
             </div>
                         <div className="ast-view-section">
               <h3>🌳 Live AST</h3>
               <div className="ast-view-content">
                 {parseError1 ? (
                   <div className="error-message">
                     ❌ Parse Error: {parseError1}
                   </div>
                 ) : isParsing1 ? (
                   <div className="loading-message">
                     ⏳ Parsing AST...
                   </div>
                 ) : astTree1 ? (
                   <div className="ast-content tree-view">
                     <TreeNodeContainer
                       nodeKey="root"
                       value={astTree1}
                       level={0}
                       searchTerm={searchTerm}
                     />
                   </div>
                 ) : (
                   <div className="placeholder">Click "Parse AST" to see the AST structure</div>
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
              <p>Compare two code snippets to see how AST modifications transform code</p>
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
            <button className="btn parse-btn">🔍 Analyze Transformation</button>
            <div className="diff-view-section">
              <h4>🌳 AST Transformation Diff</h4>
              <div className="placeholder">
                Enter code in both fields and click "Analyze Transformation" to see the AST diff
              </div>
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
          <span style={{ 
            fontSize: '12px', 
            marginLeft: '8px', 
            padding: '2px 6px', 
            backgroundColor: astMode === 'json' ? 'var(--vscode-statusBarItem-prominentBackground)' : 'var(--vscode-badge-background)',
            borderRadius: '3px'
          }}>
            {astMode.toUpperCase()}
          </span>
        </div>
        
        <div className="window-mode-toggle">
          <button 
            className={`btn ${windowMode === WindowMode.Explorer ? 'active' : ''}`}
            onClick={() => setWindowMode(WindowMode.Explorer)}
          >
            🔍 Explorer
          </button>
          <button 
            className={`btn ${windowMode === WindowMode.LiveEditor ? 'active' : ''}`}
            onClick={() => setWindowMode(WindowMode.LiveEditor)}
          >
            ✏️ Live Editor
          </button>
          <button 
            className={`btn ${windowMode === WindowMode.DiffAnalyzer ? 'active' : ''}`}
            onClick={() => setWindowMode(WindowMode.DiffAnalyzer)}
          >
            🔄 Codemod Diff
          </button>
        </div>
        {windowMode === WindowMode.Explorer && (
          <div className="controls">
            <input
              type="text"
              className="search-box"
              placeholder="Search nodes (Enter to cycle)..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
            {astMode === 'text' && (
              <>
                <button 
                  className="btn" 
                  onClick={previousMatch}
                  disabled={totalMatches === 0}
                >
                  ⬆️ Prev
                </button>
                <button 
                  className="btn" 
                  onClick={nextMatch}
                  disabled={totalMatches === 0}
                >
                  ⬇️ Next
                </button>
                <span className="search-info">
                  {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : ''}
                </span>
              </>
            )}
            <button className="btn" onClick={copyToClipboard}>
              📋 Copy
            </button>
          </div>
        )}
      </div>
      
      {renderWindowContent()}
      
      {windowMode === WindowMode.Explorer && (
        <div className="stats">
          📊 <strong>{stats.lines}</strong> lines | <strong>{stats.nodes}</strong> nodes | <strong>{stats.characters}</strong> characters
        </div>
      )}
    </div>
  );
};

export default App;

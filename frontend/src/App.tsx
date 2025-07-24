import React, { useState, useEffect } from 'react';
import './App.css';

// Global window interface for VSCode webview API and AST data
declare global {
  interface Window {
    acquireVsCodeApi?: () => any;
    astData?: string;
  }
}

const App: React.FC = () => {
  const [astContent, setAstContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [totalMatches, setTotalMatches] = useState<number>(0);

  // Initialize with AST data from window
  useEffect(() => {
    if (window.astData) {
      const content = window.astData;
      setAstContent(content);
      setOriginalContent(content);
    } else {
      // Fallback if no AST data
      const testContent = 'No AST data received from extension';
      setAstContent(testContent);
      setOriginalContent(testContent);
    }
  }, []);

  // Calculate stats
  const getStats = () => {
    const lines = astContent.split('\n').length;
    const nodes = (astContent.match(/tag:/g) || []).length;
    const characters = astContent.length;
    return { lines, nodes, characters };
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(originalContent);
      // TODO: Add toast notification for user feedback
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Search functionality
  const performSearch = (term: string) => {
    if (!term) {
      setAstContent(originalContent);
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

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
    const match = document.getElementById(`match-${index + 1}`);
    if (match) {
      match.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight current match
      document.querySelectorAll('.search-match').forEach(m => m.classList.remove('current-match'));
      match.classList.add('current-match');
    }
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

  const stats = getStats();

  return (
    <div className="ast-explorer">
      <div className="header">
        <div className="title">🌳 AST Explorer</div>
        <div className="controls">
          <input
            type="text"
            className="search-box"
            placeholder="Search nodes (Enter to cycle)..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
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
          <button className="btn" onClick={copyToClipboard}>
            📋 Copy
          </button>
        </div>
      </div>
      
      <div className="ast-container">
        <pre 
          className="ast-content" 
          dangerouslySetInnerHTML={{ __html: astContent }}
        />
      </div>
      
      <div className="stats">
        📊 <strong>{stats.lines}</strong> lines | <strong>{stats.nodes}</strong> nodes | <strong>{stats.characters}</strong> characters
      </div>
    </div>
  );
};

export default App;

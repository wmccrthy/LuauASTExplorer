import React from 'react';

interface TreeNodeProps {
  nodeKey: string;
  value: any;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  searchTerm?: string;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ 
  nodeKey, 
  value, 
  level, 
  expanded, 
  onToggle,
  searchTerm = ''
}) => {
  const indent = '  '.repeat(level);
  
  // Simple highlight with pronounced styling
  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(searchTerm, 'gi');
    const parts = text.split(regex);
    const matches = text.match(regex) || [];
    
    return parts.reduce((acc, part, i) => {
      acc.push(part);
      if (matches[i]) {
        acc.push(
          <mark 
            key={i} 
            className="search-match tree-highlight"
          >
            {matches[i]}
          </mark>
        );
      }
      return acc;
    }, [] as React.ReactNode[]);
  };

  // Render primitive values
  if (value === null || value === undefined) {
    return (
      <div>
        {indent}{highlightText(`${nodeKey}: null`)}
      </div>
    );
  }

  if (typeof value !== 'object') {
    const displayValue = typeof value === 'string' ? `"${value}"` : String(value);
    return (
      <div>
        {indent}{highlightText(`${nodeKey}: ${displayValue}`)}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div>
          {indent}{highlightText(`${nodeKey}: []`)}
        </div>
      );
    }

    const arrow = expanded ? '▼' : '▶';
    return (
      <div>
        <div 
          style={{ cursor: 'pointer' }}
          onClick={onToggle}
        >
          {indent}<span className="tree-arrow" style={{ color: 'var(--vscode-symbolIcon-arrayForeground)' }}>{arrow}</span>{highlightText(`${nodeKey}:`)}
        </div>
        {expanded && value.map((item, index) => (
          <TreeNodeContainer
            key={index}
            nodeKey={`[${index}]`}
            value={item}
            level={level + 1}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    );
  }

  // Handle objects
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return (
      <div>
        {indent}{highlightText(`${nodeKey}: {}`)}
      </div>
    );
  }

  const arrow = expanded ? '▼' : '▶';
  return (
    <div>
      <div 
        style={{ cursor: 'pointer' }}
        onClick={onToggle}
      >
        {indent}<span className="tree-arrow" style={{ color: 'var(--vscode-symbolIcon-objectForeground)' }}>{arrow}</span>{highlightText(`${nodeKey}:`)}
      </div>
      {expanded && keys.map(key => (
        <TreeNodeContainer
          key={key}
          nodeKey={key}
          value={value[key]}
          level={level + 1}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
};

// Container component that manages expand/collapse state for each node
interface TreeNodeContainerProps {
  nodeKey: string;
  value: any;
  level: number;
  searchTerm?: string;
}

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  const [expanded, setExpanded] = React.useState(true); // All expanded by default
  
  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <TreeNode
      {...props}
      expanded={expanded}
      onToggle={handleToggle}
    />
  );
};

export default TreeNodeContainer; 
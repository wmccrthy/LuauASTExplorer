import React from 'react';
import { DiffASTNode } from './typesAndInterfaces';

interface TreeNodeProps {
  nodeKey: string;
  value: any;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  searchTerm?: string;
  isDiffMode?: boolean;
  diffStatus?: 'added' | 'removed' | 'updated' | 'unchanged' | 'contains-changes';
  beforeValue?: any;
  afterValue?: any;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ 
  nodeKey, 
  value, 
  level, 
  expanded, 
  onToggle,
  searchTerm = '',
  isDiffMode = false,
  diffStatus = 'unchanged',
  beforeValue,
  afterValue
}) => {
  const indent = '  '.repeat(level);
  
  // Get diff-specific styling
  const getDiffClassName = () => {
    if (!isDiffMode) return '';
    switch (diffStatus) {
      case 'added': return 'diff-added';
      case 'removed': return 'diff-removed';
      case 'updated': return 'diff-updated';
      case 'contains-changes': return 'diff-contains-changes';
      default: return '';
    }
  };
  
  const diffClassName = getDiffClassName();
  
  // Debug diff props
  if (isDiffMode && diffStatus !== 'unchanged') {
    console.log(`TreeNode [${nodeKey}]: diffStatus=${diffStatus}, beforeValue=`, beforeValue, 'afterValue=', afterValue);
  }
  
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
  
  // Render diff indicator for changed values
  const renderDiffIndicator = () => {
    if (!isDiffMode || diffStatus === 'unchanged') return null;
    
    switch (diffStatus) {
      case 'added':
        return <span className="diff-indicator diff-added-indicator">+ </span>;
      case 'removed':
        return <span className="diff-indicator diff-removed-indicator">- </span>;
      case 'updated':
        return <span className="diff-indicator diff-updated-indicator">~ </span>;
      default:
        return null;
    }
  };
  
  // Render value with diff information
  const renderValueWithDiff = (displayValue: string) => {
    if (!isDiffMode || diffStatus === 'unchanged') {
      return highlightText(`${nodeKey}: ${displayValue}`);
    }
    
    switch (diffStatus) {
      case 'added':
        return (
          <>
            {renderDiffIndicator()}
            {highlightText(`${nodeKey}: ${displayValue}`)}
          </>
        );
      case 'removed':
        const beforeDisplayValue = typeof beforeValue === 'string' ? `"${beforeValue}"` : String(beforeValue);
        return (
          <>
            {renderDiffIndicator()}
            {highlightText(`${nodeKey}: ${beforeDisplayValue}`)}
          </>
        );
      case 'updated':
        const beforeDisplay = typeof beforeValue === 'string' ? `"${beforeValue}"` : String(beforeValue);
        const afterDisplay = typeof afterValue === 'string' ? `"${afterValue}"` : String(afterValue);
        return (
          <>
            {renderDiffIndicator()}
            {highlightText(`${nodeKey}: `)}
            <span className="diff-before">{beforeDisplay}</span>
            <span className="diff-arrow"> → </span>
            <span className="diff-after">{afterDisplay}</span>
          </>
        );
      default:
        return highlightText(`${nodeKey}: ${displayValue}`);
    }
  };

  // Render primitive values
  if (value === null || value === undefined) {
    return (
      <div className={diffClassName}>
        {indent}{renderValueWithDiff('null')}
      </div>
    );
  }

  if (typeof value !== 'object') {
    const displayValue = typeof value === 'string' ? `"${value}"` : String(value);
    return (
      <div className={diffClassName}>
        {indent}{renderValueWithDiff(displayValue)}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={diffClassName}>
          {indent}{renderValueWithDiff('[]')}
        </div>
      );
    }

    const arrow = expanded ? '▼' : '▶';
    return (
      <div className={diffClassName}>
        <div 
          style={{ cursor: 'pointer' }}
          onClick={onToggle}
        >
          {indent}{renderDiffIndicator()}<span className="tree-arrow" style={{ color: 'var(--vscode-symbolIcon-arrayForeground)' }}>{arrow}</span>{highlightText(`${nodeKey}:`)}
        </div>
        {expanded && value.map((item, index) => {
          // Pass through diff props for child nodes if they have diff annotations
          const childDiffProps = item && typeof item === 'object' && 'diffStatus' in item ? {
            isDiffMode,
            diffStatus: item.diffStatus,
            beforeValue: item.beforeValue,
            afterValue: item.afterValue
          } : { isDiffMode };
          
          return (
            <TreeNodeContainer
              key={index}
              nodeKey={`[${index}]`}
              value={item}
              level={level + 1}
              searchTerm={searchTerm}
              {...childDiffProps}
            />
          );
        })}
      </div>
    );
  }

  // Handle objects
  const keys = Object.keys(value).filter(key => 
    !['diffStatus', 'beforeValue', 'afterValue', 'diffKey'].includes(key)
  );
  
  if (keys.length === 0) {
    return (
      <div className={diffClassName}>
        {indent}{renderValueWithDiff('{}')}
      </div>
    );
  }

  const arrow = expanded ? '▼' : '▶';
  return (
    <div className={diffClassName}>
      <div 
        style={{ cursor: 'pointer' }}
        onClick={onToggle}
      >
        {indent}{renderDiffIndicator()}<span className="tree-arrow" style={{ color: 'var(--vscode-symbolIcon-objectForeground)' }}>{arrow}</span>{highlightText(`${nodeKey}:`)}
      </div>
      {expanded && keys.map(key => {
        // Pass through diff props for child nodes if they have diff annotations
        const childValue = value[key];
        const childDiffProps = childValue && typeof childValue === 'object' && 'diffStatus' in childValue ? {
          isDiffMode,
          diffStatus: childValue.diffStatus,
          beforeValue: childValue.beforeValue,
          afterValue: childValue.afterValue
        } : { isDiffMode };
        
        return (
          <TreeNodeContainer
            key={key}
            nodeKey={key}
            value={childValue}
            level={level + 1}
            searchTerm={searchTerm}
            {...childDiffProps}
          />
        );
      })}
    </div>
  );
};

// Container component that manages expand/collapse state for each node
interface TreeNodeContainerProps {
  nodeKey: string;
  value: any;
  level: number;
  searchTerm?: string;
  isDiffMode?: boolean;
  diffStatus?: 'added' | 'removed' | 'updated' | 'unchanged' | 'contains-changes';
  beforeValue?: any;
  afterValue?: any;
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
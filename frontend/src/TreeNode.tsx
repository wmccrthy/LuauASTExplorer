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
  parentChanges?: any;
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
  afterValue,
  parentChanges = {}
}) => {
  // Always reserve space for diff indicator to maintain consistent indentation
  const baseIndent = '  '.repeat(level);
  const indent = baseIndent;

  const getTagAndTypeAnnotation = () => {
    let annotation = " (";
    if (value.tag) annotation += `tag: "${value.tag}"`;
    if (value._astType) annotation += `${value.tag ? ", " : ""}type: ${value._astType}`;
    if (annotation.length > 2) {
      annotation += ")";
      return annotation;
    }
    return "";
  }

  // Get diff-specific styling
  const getDiffClassName = () => {
    if (!isDiffMode) return '';

    // Check if this specific value changed via parent change info
    const isChanged = parentChanges[nodeKey];
    if (isChanged) {
      switch (isChanged.type) {
        case 'ADD': return 'diff-added';
        case 'REMOVE': return 'diff-removed';
        case 'UPDATE': return 'diff-updated';
        default: return '';
      }
    }

    // Normal diff status
    switch (diffStatus) {
      case 'added': return 'diff-added';
      case 'removed': return 'diff-removed';
      case 'updated': return 'diff-updated';
      case 'contains-changes': return 'diff-contains-changes';
      default: return '';
    }
  };

  const diffClassName = getDiffClassName();

  // Debug diff props (only log meaningful changes)
  if (isDiffMode && diffStatus !== 'unchanged' && (beforeValue !== undefined || afterValue !== undefined)) {
    const logMsg = diffStatus === 'updated'
      ? `TreeNode [${nodeKey}]: ${diffStatus} (${beforeValue} → ${afterValue})`
      : `TreeNode [${nodeKey}]: ${diffStatus} (${beforeValue || afterValue})`;
    console.log(logMsg);
  }

  // Debug parent changes being passed down
  if (isDiffMode && Object.keys(parentChanges).length > 0) {
    console.log(`TreeNode [${nodeKey}] received parentChanges:`, parentChanges);
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

  // Render diff indicator for changed values - always render to maintain consistent indentation
  const renderDiffIndicator = () => {
    if (!isDiffMode) return <span className="diff-indicator"> </span>;

    // Check for parent change information first
    const isChanged = parentChanges[nodeKey];
    if (isChanged) {
      if (isChanged.fullPath) {
        console.log(`Node [${nodeKey}] checking parent change: path="${isChanged.fullPath}", level=${level}`);
      } else {
        console.log(`Node [${nodeKey}] has parent change (no path):`, isChanged, 'at level', level);
      }

      switch (isChanged.type) {
        case 'ADD':
          return <span className="diff-indicator diff-added-indicator">+</span>;
        case 'REMOVE':
          return <span className="diff-indicator diff-removed-indicator">-</span>;
        case 'UPDATE':
          return <span className="diff-indicator diff-updated-indicator">~</span>;
      }
    }

    switch (diffStatus) {
      case 'added':
        return <span className="diff-indicator diff-added-indicator">+</span>;
      case 'removed':
        return <span className="diff-indicator diff-removed-indicator">-</span>;
      case 'updated':
        return <span className="diff-indicator diff-updated-indicator">~</span>;
      case 'contains-changes':
        return <span className="diff-indicator diff-updated-indicator">○</span>;
      default:
        return <span className="diff-indicator"> </span>;
    }
  };

  // Render value with diff information
  const renderValueWithDiff = (displayValue: string) => {
    if (!isDiffMode) {
      return highlightText(`${nodeKey}: ${displayValue}`);
    }

    // Check for parent change information first
    const isChanged = parentChanges[nodeKey];
    if (isChanged) {
      switch (isChanged.type) {
        case 'ADD':
          return highlightText(`${nodeKey}: ${displayValue}`);
        case 'REMOVE':
          const removedDisplay = typeof isChanged.oldValue === 'string' ? `"${isChanged.oldValue}"` : String(isChanged.oldValue);
          return highlightText(`${nodeKey}: ${removedDisplay}`);
        case 'UPDATE':
          const beforeDisplay = typeof isChanged.oldValue === 'string' ? `"${isChanged.oldValue}"` : String(isChanged.oldValue);
          const afterDisplay = typeof isChanged.value === 'string' ? `"${isChanged.value}"` : String(isChanged.value);
          return (
            <>
              {highlightText(`${nodeKey}: `)}
              <span className="diff-before">{beforeDisplay}</span>
              <span className="diff-arrow"> → </span>
              <span className="diff-after">{afterDisplay}</span>
            </>
          );
      }
    }

    // Fall back to node's own diff status
    if (diffStatus === 'unchanged') {
      return highlightText(`${nodeKey}: ${displayValue}`);
    }

    switch (diffStatus) {
      case 'added':
        return highlightText(`${nodeKey}: ${displayValue}`);
      case 'removed':
        const beforeDisplayValue = typeof beforeValue === 'string' ? `"${beforeValue}"` : String(beforeValue);
        return highlightText(`${nodeKey}: ${beforeDisplayValue}`);
      case 'updated':
        const beforeDisplay = typeof beforeValue === 'string' ? `"${beforeValue}"` : String(beforeValue);
        const afterDisplay = typeof afterValue === 'string' ? `"${afterValue}"` : String(afterValue);
        return (
          <>
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
        {indent}{renderDiffIndicator()}{renderValueWithDiff('null')}
      </div>
    );
  }

  if (typeof value !== 'object') {
    if (nodeKey === "tag" || nodeKey === "_astType") return null;
    const displayValue = typeof value === 'string' ? `"${value}"` : String(value);
    return (
      <div className={diffClassName}>
        {/* include empty span to ensure indentation aligns with expandable nodes */}
        <span className='tree-arrow'></span>{indent}{renderDiffIndicator()}{renderValueWithDiff(displayValue)}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={diffClassName}>
          {/* include empty span to ensure indentation aligns with expandable nodes */}
          <span className='tree-arrow'></span>{indent}{renderDiffIndicator()}{renderValueWithDiff('[]')}
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
          {indent}<span className="tree-arrow" style={{ color: 'var(--vscode-symbolIcon-arrayForeground)' }}>{arrow}</span>{renderDiffIndicator()}{highlightText(`${nodeKey}${getTagAndTypeAnnotation()}`)}
        </div>
        {expanded && value.map((item, index) => {
          // Pass through diff props for child nodes if they have diff annotations
          // Check if this child has change information (from props or value)
          const nodeChildChanges = (value as any)?.childChanges || {};
          const childChange = nodeChildChanges[index.toString()] || parentChanges[index.toString()];

          const childDiffProps = item && typeof item === 'object' && 'diffStatus' in item ? {
            isDiffMode,
            diffStatus: item.diffStatus,
            beforeValue: item.beforeValue,
            afterValue: item.afterValue
          } : childChange ? {
            isDiffMode,
            diffStatus: childChange.type === 'ADD' ? 'added' as const :
              childChange.type === 'REMOVE' ? 'removed' as const : 'updated' as const,
            beforeValue: childChange.oldValue,
            afterValue: childChange.value
          } : {
            isDiffMode,
            diffStatus: 'unchanged' as const
          };

          return (
            <TreeNodeContainer
              key={index}
              nodeKey={`[${index}]`}
              value={item}
              level={level + 1}
              searchTerm={searchTerm}
              parentChanges={nodeChildChanges}
              {...childDiffProps}
            />
          );
        })}
      </div>
    );
  }



  // Handle objects (normal case)
  const keys = Object.keys(value).filter(key =>
    !['diffStatus', 'beforeValue', 'afterValue', 'diffKey', 'childChanges'].includes(key)
  );

  if (keys.length === 0) {
    return (
      <div className={diffClassName}>
        {/* include empty span to ensure indentation aligns with expandable nodes */}
        <span className='tree-arrow'></span>{indent}{renderDiffIndicator()}{renderValueWithDiff('{}')}
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
        {indent}<span className="tree-arrow" style={{ color: 'var(--vscode-symbolIcon-objectForeground)' }}>{arrow}</span>{renderDiffIndicator()}{highlightText(`${nodeKey}${getTagAndTypeAnnotation()}`)}
      </div>
      {expanded && keys.map(key => {
        // Pass through diff props for child nodes if they have diff annotations
        const childValue = value[key];
        // Check if this child has change information (from props or value)
        const nodeChildChanges = (value as any)?.childChanges || {};
        const childChange = nodeChildChanges[key] || parentChanges[key];

        // Debug: Check if we're getting changes correctly
        if (childChange) {
          console.log(`Child [${key}] at level ${level} has change:`, childChange);
        }

        const childDiffProps = childValue && typeof childValue === 'object' && 'diffStatus' in childValue ? {
          isDiffMode,
          diffStatus: childValue.diffStatus,
          beforeValue: childValue.beforeValue,
          afterValue: childValue.afterValue
        } : childChange ? {
          isDiffMode,
          diffStatus: childChange.type === 'ADD' ? 'added' as const :
            childChange.type === 'REMOVE' ? 'removed' as const : 'updated' as const,
          beforeValue: childChange.oldValue,
          afterValue: childChange.value
        } : {
          isDiffMode,
          diffStatus: 'unchanged' as const
        };

        return (
          <TreeNodeContainer
            key={key}
            nodeKey={key}
            value={childValue}
            level={level + 1}
            searchTerm={searchTerm}
            parentChanges={nodeChildChanges}
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
  parentChanges?: any;
}

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  // Auto-collapse irrelevant node types by default
  const shouldAutoCollapse = ['leadingTrivia', 'trailingTrivia', 'location', 'argLocation', "indexLocation", "position"].includes(props.nodeKey);
  const [expanded, setExpanded] = React.useState(!shouldAutoCollapse); // Most expanded by default, irrelevant nodes collapsed

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
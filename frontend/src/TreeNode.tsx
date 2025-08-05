import React from "react";
import { TypeTooltip } from "./components/TypeTooltip";
import { shouldAutoCollapse } from "./nodeEmphasisHelpers";

interface TreeNodeProps {
  nodeKey: string;
  value: any;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  searchTerm?: string;
  isDiffMode?: boolean;
  diffStatus?:
  | "added"
  | "nested-add"
  | "removed"
  | "updated"
  | "unchanged"
  | "contains-changes"
  | "contains-nested-changes";
  beforeValue?: any;
  afterValue?: any;
  hiddenNodes?: string[];
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  nodeKey,
  value,
  level,
  expanded,
  onToggle,
  searchTerm = "",
  isDiffMode = false,
  diffStatus = "unchanged",
  beforeValue,
  afterValue,
  hiddenNodes = [],
}) => {
  // Always reserve space for diff indicator to maintain consistent indentation
  const baseIndent = "  ".repeat(level);
  const indent = baseIndent;

  const renderTypeAnnotations = () => {
    if (value._astType) {
      return (
        <span className="ast-annotations">
          {" ("}
          <TypeTooltip key="type" typeName={value._astType} kind={value.kind}>
            <span className="type-annotation">
              type: {value._astType}
              {value.kind ? ` (${value.kind})` : ""}
            </span>
          </TypeTooltip>
          {")"}
        </span>
      );
    }
    return null;
  };

  // Get diff-specific styling
  const getDiffClassName = () => {
    if (!isDiffMode) return "";

    switch (diffStatus) {
      case "added":
        return "diff-added";
      case "removed":
        return "diff-removed";
      case "updated":
        return "diff-updated";
      case "contains-changes":
        return "diff-contains-changes";
      default:
        return "";
    }
  };

  const diffClassName = getDiffClassName();
  const fullClassName = `${diffClassName}`; // might use for adding specific node styling (by importance proxy) later on

  // Debug diff props (only log meaningful changes)
  if (
    isDiffMode &&
    diffStatus !== "unchanged" &&
    (beforeValue !== undefined || afterValue !== undefined)
  ) {
    const logMsg =
      diffStatus === "updated"
        ? `TreeNode [${nodeKey}]: ${diffStatus} (${beforeValue} → ${afterValue})`
        : `TreeNode [${nodeKey}]: ${diffStatus} (${beforeValue || afterValue})`;
    console.log(logMsg);
  }

  // Simple highlight with pronounced styling
  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(searchTerm, "gi");
    const parts = text.split(regex);
    const matches = text.match(regex) || [];

    return parts.reduce((acc, part, i) => {
      acc.push(part);
      if (matches[i]) {
        acc.push(
          <mark key={i} className="search-match tree-highlight">
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

    switch (diffStatus) {
      case "added":
        return <span className="diff-indicator diff-added-indicator">+</span>;
      case "removed":
        return <span className="diff-indicator diff-removed-indicator">-</span>;
      case "updated":
        return <span className="diff-indicator diff-updated-indicator">~</span>;
      case "contains-changes":
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
    // Fall back to node's own diff status
    if (diffStatus === "unchanged") {
      return highlightText(`${nodeKey}: ${displayValue}`);
    }

    switch (diffStatus) {
      case "added":
        return highlightText(`${nodeKey}: ${displayValue}`);
      case "removed":
        const beforeDisplayValue =
          typeof beforeValue === "string"
            ? `"${beforeValue}"`
            : String(beforeValue);
        return highlightText(`${nodeKey}: ${beforeDisplayValue}`);
      case "updated":
        const beforeDisplay =
          typeof beforeValue === "string"
            ? `"${beforeValue}"`
            : String(beforeValue);
        const afterDisplay =
          typeof afterValue === "string"
            ? `"${afterValue}"`
            : String(afterValue);
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
        {indent}
        {renderDiffIndicator()}
        {renderValueWithDiff("null")}
      </div>
    );
  }

  if (typeof value !== "object") {
    if (nodeKey === "_astType") return null;
    const displayValue =
      typeof value === "string" ? `"${value}"` : String(value);
    return (
      <div className={fullClassName}>
        {/* include empty span to ensure indentation aligns with expandable nodes */}
        <span className="tree-arrow"></span>
        {indent}
        {renderDiffIndicator()}
        {renderValueWithDiff(displayValue)}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={fullClassName}>
          {/* include empty span to ensure indentation aligns with expandable nodes */}
          <span className="tree-arrow"></span>
          {indent}
          {renderDiffIndicator()}
          {renderValueWithDiff("[]")}
        </div>
      );
    }

    const arrow = expanded ? "▼" : "▶";
    return (
      <div className={fullClassName}>
        <div style={{ cursor: "pointer" }} onClick={onToggle}>
          {indent}
          <span
            className="tree-arrow"
            style={{ color: "var(--vscode-symbolIcon-arrayForeground)" }}
          >
            {arrow}
          </span>
          {renderDiffIndicator()}
          {highlightText(nodeKey)}
          {renderTypeAnnotations()}
        </div>
        {expanded &&
          value.map((item, index) => {
            // Pass through diff props for child nodes if they have diff annotations
            // Check if this child has change information (from props or value)
            const nodeChildChanges = (value as any)?.childChanges || {};
            const childChange = nodeChildChanges[index.toString()];

            const childDiffProps =
              item && typeof item === "object" && "diffStatus" in item
                ? {
                  isDiffMode,
                  diffStatus: item.diffStatus,
                  beforeValue: item.beforeValue,
                  afterValue: item.afterValue,
                }
                : childChange
                  ? {
                    isDiffMode,
                    diffStatus:
                      childChange.type === "ADD"
                        ? ("added" as const)
                        : childChange.type === "REMOVE"
                          ? ("removed" as const)
                          : ("updated" as const),
                    beforeValue: childChange.oldValue,
                    afterValue: childChange.value,
                  }
                  : {
                    isDiffMode,
                    diffStatus: "unchanged" as const,
                  };

            return (
              <TreeNodeContainer
                key={index}
                nodeKey={`[${index}]`}
                value={item}
                level={level + 1}
                searchTerm={searchTerm}
                {...childDiffProps}
                hiddenNodes={hiddenNodes}
              />
            );
          })}
      </div>
    );
  }

  // Handle objects (normal case)
  const keys = Object.keys(value).filter(
    (key) =>
      ![
        "diffStatus",
        "beforeValue",
        "afterValue",
        "diffKey",
        "childChanges",
      ].includes(key)
  );

  if (keys.length === 0) {
    return (
      <div className={fullClassName}>
        {/* include empty span to ensure indentation aligns with expandable nodes */}
        <span className="tree-arrow"></span>
        {indent}
        {renderDiffIndicator()}
        {renderValueWithDiff("{}")}
      </div>
    );
  }

  const arrow = expanded ? "▼" : "▶";
  return (
    <div className={fullClassName}>
      <div style={{ cursor: "pointer" }} onClick={onToggle}>
        {indent}
        <span
          className="tree-arrow"
          style={{ color: "var(--vscode-symbolIcon-objectForeground)" }}
        >
          {arrow}
        </span>
        {renderDiffIndicator()}
        {highlightText(nodeKey)}
        {renderTypeAnnotations()}
      </div>
      {expanded &&
        keys.map((key) => {
          // Pass through diff props for child nodes if they have diff annotations
          const childValue = value[key];
          // Check if this child has change information (from props or value)
          const nodeChildChanges = (value as any)?.childChanges || {};
          const childChange = nodeChildChanges[key];

          // Debug: Check if we're getting changes correctly
          if (childChange) {
            console.log(
              `Child [${key}] at level ${level} has change:`,
              childChange
            );
          }

          const childDiffProps =
            childValue &&
              typeof childValue === "object" &&
              "diffStatus" in childValue
              ? {
                isDiffMode,
                diffStatus: childValue.diffStatus,
                beforeValue: childValue.beforeValue,
                afterValue: childValue.afterValue,
              }
              : childChange
                ? {
                  isDiffMode,
                  diffStatus:
                    childChange.type === "ADD"
                      ? ("added" as const)
                      : childChange.type === "REMOVE"
                        ? ("removed" as const)
                        : ("updated" as const),
                  beforeValue: childChange.oldValue,
                  afterValue: childChange.value,
                }
                : {
                  isDiffMode,
                  diffStatus: "unchanged" as const,
                };

          return (
            <TreeNodeContainer
              key={key}
              nodeKey={key}
              value={childValue}
              level={level + 1}
              searchTerm={searchTerm}
              hiddenNodes={hiddenNodes}
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
  diffStatus?:
  | "added"
  | "nested-add"
  | "removed"
  | "updated"
  | "unchanged"
  | "contains-changes"
  | "contains-nested-changes";
  beforeValue?: any;
  afterValue?: any;
  hiddenNodes?: string[];
}

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  const autoCollapse = props.isDiffMode
    ? props.diffStatus === "unchanged"
    : shouldAutoCollapse(props.nodeKey);

  const [expanded, setExpanded] = React.useState(!autoCollapse);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Hide nodes that are in the hidden nodes list (when filtering is active)
  if (props.hiddenNodes && props.hiddenNodes.includes(props.nodeKey)) {
    return null;
  }

  return <TreeNode {...props} expanded={expanded} onToggle={handleToggle} />;
};

export default TreeNodeContainer;

import React from "react";
import { TypeAnnotation } from "./TypeAnnotation";
import { JSX } from "react/jsx-runtime";
import {
  unpackArrayType,
  getChildPropertyDefinition,
} from "../utils/astTypeHelpers";
import { CodeTooltip } from "./CodeTooltip";
import TreeNodeContainer, { TreeNodeContainerProps } from "./TreeNodeContainer";

import { TypeMetadata } from "../utils/astTypeDefinitions";
import { useCodeTranslationContext } from "../context/codeTranslationContext";

interface TreeNodeProps {
  nodeKey: string;
  value: any;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  path: string;
  renderChild: (
    childProps: TreeNodeContainerProps,
    key: string | number
  ) => React.ReactNode;
  typeMetadata: TypeMetadata;
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
  path,
  onToggle,
  renderChild,
  typeMetadata,
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
  const { codeTooltips, requestCodeTooltip, generateNodeId } =
    useCodeTranslationContext();

  const nodeId = React.useMemo(() => {
    return generateNodeId ? generateNodeId(value, nodeKey) : "";
  }, [value, nodeKey, generateNodeId]);

  const renderTypeAnnotations = React.useCallback(() => {
    if (typeMetadata.type) {
      const changedType = typeMetadata.type !== typeMetadata.prevType;
      const currentTypeAnnotation = (
        <TypeAnnotation
          typeName={typeMetadata.type}
          typeDefinition={typeMetadata.typeDefinition}
          isArrayType={typeMetadata.arrayType}
          kind={typeMetadata.kind}
          hasPrevType={changedType}
        ></TypeAnnotation>
      );

      if (changedType && typeMetadata.prevType) {
        // if type ~= prevType, display type before/after very similar to how we display value before/after...
        return (
          <React.Fragment>
            <span className="diff-before">
              {
                <TypeAnnotation
                  typeName={typeMetadata.prevType}
                  typeDefinition={typeMetadata.prevTypeDefinition}
                  isArrayType={typeMetadata.prevArrayType}
                  kind={typeMetadata.prevKind}
                ></TypeAnnotation>
              }
            </span>
            <span className="diff-arrow"> → </span>
            {/* want negative padding on bottom span */}
            <span>{currentTypeAnnotation}</span>
          </React.Fragment>
        );
      } else {
        return currentTypeAnnotation;
      }
    }
    return null;
  }, [typeMetadata]);

  // Get diff-specific styling
  const getDiffClassName = React.useCallback(() => {
    if (!isDiffMode) return "";

    switch (diffStatus) {
      case "added":
        return "diff-added";
      case "removed":
        return "diff-removed";
      case "updated":
        return "diff-updated";
      case "contains-changes":
      case "contains-nested-changes":
        return expanded ? "" : "diff-contains-changes";
      default:
        return "";
    }
  }, [isDiffMode, diffStatus, expanded]);

  const getChildDiffProps = React.useCallback(
    (value: any, key: string | number, child: any) => {
      const nodeChildChanges = (value as any)?.childChanges || {};
      const childChange =
        nodeChildChanges[typeof key == "number" ? key.toString() : key];

      const childDiffProps =
        child && typeof child === "object" && "diffStatus" in child
          ? {
              isDiffMode,
              diffStatus: child.diffStatus,
              beforeValue: child.beforeValue,
              afterValue: child.afterValue,
            }
          : childChange // handles cases where child is primitive value (since diffStatus wont exist on the child node itself)
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

      return childDiffProps;
    },
    [isDiffMode]
  );

  const diffClassName = getDiffClassName();

  // Simple highlight with pronounced styling
  const highlightText = React.useCallback(
    (text: string) => {
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
    },
    [searchTerm]
  );

  // Render diff indicator for changed values - always render to maintain consistent indentation
  const renderDiffIndicator = React.useCallback(() => {
    if (!isDiffMode) return <span className="diff-indicator"></span>;

    switch (diffStatus) {
      case "added":
        return <span className="diff-indicator diff-added-indicator">+</span>;
      case "removed":
        return <span className="diff-indicator diff-removed-indicator">-</span>;
      case "updated":
        return <span className="diff-indicator diff-updated-indicator">~</span>;
      case "contains-changes":
      case "contains-nested-changes":
        return expanded ? (
          <span className="diff-indicator"></span>
        ) : (
          <span className="diff-indicator diff-updated-indicator">○</span>
        );
      default:
        return <span className="diff-indicator"></span>;
    }
  }, [isDiffMode, diffStatus, expanded]);

  // Render value with diff information
  const renderValueWithDiff = React.useCallback(
    (displayValue: string) => {
      if (!isDiffMode) {
        return highlightText(`${nodeKey}: ${displayValue}`);
      }
      // Fall back to node's own diff status
      if (diffStatus === "unchanged") {
        return highlightText(`${nodeKey}: ${displayValue}`);
      }

      switch (diffStatus) {
        case "added":
        case "removed":
          return highlightText(`${nodeKey}: ${displayValue}`);
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
    },
    [isDiffMode, diffStatus, beforeValue, afterValue, nodeKey, highlightText]
  );

  const arrow = expanded ? "▼" : "▶";

  const getRenderedContent = React.useCallback(
    (
      renderArrow: boolean,
      renderValue: string | JSX.Element | React.ReactNode[],
      renderTypeAnnotation: boolean,
      isArray?: boolean
    ) => {
      return (
        <React.Fragment>
          {indent}
          {renderArrow ? (
            <span
              className="tree-arrow"
              style={{
                color: isArray
                  ? "var(--vscode-symbolIcon-arrayForeground)"
                  : "var(--vscode-symbolIcon-objectForeground)",
              }}
            >
              {arrow}
            </span>
          ) : null}
          {renderDiffIndicator()}
          {renderValue}
          {renderTypeAnnotation ? renderTypeAnnotations() : null}
        </React.Fragment>
      );
    },
    [arrow, indent, renderDiffIndicator, renderTypeAnnotations]
  );

  // Handle hover to request code tooltip
  const handleMouseEnter = React.useCallback(() => {
    if (value && (typeof value === "object" || Array.isArray(value))) {
      // Only request if we don't have cached content
      if (!codeTooltips[nodeId]) {
        requestCodeTooltip(value, nodeKey);
      }
    }
  }, [value, nodeKey, requestCodeTooltip, codeTooltips, nodeId]);

  // Render primitive values
  if (value === null || value === undefined) {
    return (
      <div
        className={diffClassName}
        onMouseEnter={handleMouseEnter}
        data-testid={"node-" + path}
      >
        {getRenderedContent(false, renderValueWithDiff("null"), false)}
      </div>
    );
  }

  if (typeof value !== "object") {
    if (nodeKey === "_astType") return null;
    const displayValue =
      typeof value === "string" ? `"${value}"` : String(value);
    return (
      <div
        className={diffClassName}
        onMouseEnter={handleMouseEnter}
        data-testid={"node-" + path}
      >
        {/* include empty span to ensure indentation aligns with expandable nodes */}
        <span className="tree-arrow"></span>
        {getRenderedContent(false, renderValueWithDiff(displayValue), false)}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className={diffClassName} data-testid={"node-" + path}>
          {/* include empty span to ensure indentation aligns with expandable nodes */}
          <span className="tree-arrow"></span>
          {getRenderedContent(false, renderValueWithDiff("[]"), false)}
        </div>
      );
    }

    // check if node is an array of a Punctuated type (TO-DO: add more robust check than this)
    const punctuatedType = typeMetadata.typeDefinition?.properties?.find(
      (item) => item.name === ""
    );

    return (
      <div className={diffClassName} data-testid={"node-" + path}>
        <div
          style={{ cursor: "pointer" }}
          onClick={onToggle}
          onMouseEnter={handleMouseEnter}
          data-testid={"nodeHeader-" + path}
        >
          {getRenderedContent(
            true,
            <CodeTooltip
              isCode={codeTooltips[nodeId] !== undefined}
              text={codeTooltips[nodeId] || path}
            >
              <span>{highlightText(nodeKey)}</span>
            </CodeTooltip>,
            true,
            true
          )}
        </div>
        {expanded &&
          value.map((item, index) => {
            // Pass through diff props for child nodes if they have diff annotations
            const childDiffProps = getChildDiffProps(value, index, item);

            return renderChild(
              {
                nodeKey: `[${index}]`,
                value: item,
                level: level + 1,
                parentInferredType: punctuatedType
                  ? unpackArrayType(punctuatedType.type as string)
                  : typeMetadata.type
                  ? unpackArrayType(typeMetadata.type)
                  : undefined,
                searchTerm: searchTerm,
                path: `${path}.${index}`,
                hiddenNodes: hiddenNodes,
                ...childDiffProps,
              },
              index
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
      <div className={diffClassName} data-testid={"node-" + path}>
        {/* include empty span to ensure indentation aligns with expandable nodes */}
        <span className="tree-arrow"></span>
        {indent}
        {renderDiffIndicator()}
        {renderValueWithDiff("{}")}
      </div>
    );
  }

  return (
    <div className={diffClassName} data-testid={"node-" + path}>
      <div
        style={{ cursor: "pointer" }}
        onClick={onToggle}
        onMouseEnter={handleMouseEnter}
        data-testid={"nodeHeader-" + path}
      >
        {getRenderedContent(
          true,
          <CodeTooltip
            isCode={codeTooltips[nodeId] !== undefined}
            text={codeTooltips[nodeId] || path}
          >
            <span>{highlightText(nodeKey)}</span>
          </CodeTooltip>,
          true
        )}
      </div>
      {expanded &&
        keys.map((key) => {
          // Pass through diff props for child nodes if they have diff annotations
          const childValue = value[key];
          const childDiffProps = getChildDiffProps(value, key, childValue);
          const childPropertyDefinition = getChildPropertyDefinition(
            typeMetadata,
            value.childChanges,
            key
          );

          const parentInferredType = childPropertyDefinition?.generic
            ? childPropertyDefinition.generic
            : childPropertyDefinition?.type;

          return renderChild(
            {
              nodeKey: `${key}`,
              value: childValue,
              level: level + 1,
              parentInferredType: parentInferredType,
              searchTerm: searchTerm,
              path: `${path}.${key}`,
              hiddenNodes: hiddenNodes,
              ...childDiffProps,
            },
            key
          );
        })}
    </div>
  );
};

export default TreeNode;

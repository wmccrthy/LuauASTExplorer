import React, { useEffect, useMemo } from "react";
import TreeNode from "./TreeNode";
import { shouldAutoCollapse } from "../utils/nodeEmphasisHelpers";
import { TreeNodeContainerProps } from "../types/typesAndInterfaces";
import { useTypeMetadata } from "../hooks/useTypeMetadata";

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  const typeMetadata = useTypeMetadata(props);

  const autoCollapse =
    props.forceCollapse ||
    (props.isDiffMode
      ? props.diffStatus === "unchanged" ||
        props.diffStatus === "removed" ||
        shouldAutoCollapse(typeMetadata.type, typeMetadata.typeDefinition)
      : shouldAutoCollapse(typeMetadata.type, typeMetadata.typeDefinition));

  const [expanded, setExpanded] = React.useState(!autoCollapse);

  useEffect(() => {
    setExpanded(!autoCollapse);
  }, [autoCollapse]);

  const [collapsedChildren, setCollapsedChildren] =
    React.useState(autoCollapse);

  const handleCollapseChildren = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents parent node click
    setCollapsedChildren(!collapsedChildren);
  };

  const collapseChildrenButton = useMemo(() => {
    return (
      // toggle children collapse
      <button
        className="collapse-children-btn"
        onClick={handleCollapseChildren}
        title={"Collapse all toggle"}
      >
        {collapsedChildren ? "⟲" : "⤴"}
      </button>
    );
  }, [collapsedChildren, handleCollapseChildren]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Hide nodes that are in the hidden nodes list (when filtering is active)
  if (props.hiddenNodes && props.hiddenNodes.includes(props.nodeKey)) {
    return null;
  }

  return (
    <TreeNode
      {...props}
      expanded={expanded}
      onToggle={handleToggle}
      typeMetadata={typeMetadata}
      renderChild={(
        childProps: TreeNodeContainerProps,
        key: string | number
      ) => <TreeNodeContainer {...childProps} key={key} />}
      collapseAll={{
        collapseAllButton: collapseChildrenButton,
        collapsedChildren: collapsedChildren,
      }}
    />
  );
};

export default TreeNodeContainer;

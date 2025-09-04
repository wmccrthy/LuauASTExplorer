import React from "react";
import TreeNode from "./TreeNode";
import { shouldAutoCollapse } from "../utils/nodeEmphasisHelpers";
import { TreeNodeContainerProps } from "../types/typesAndInterfaces";
import { useTypeMetadata } from "../hooks/useTypeMetadata";

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  const typeMetadata = useTypeMetadata(props);

  const autoCollapse = props.isDiffMode
    ? props.diffStatus === "unchanged" ||
      props.diffStatus === "removed" ||
      shouldAutoCollapse(typeMetadata.type, typeMetadata.typeDefinition)
    : shouldAutoCollapse(typeMetadata.type, typeMetadata.typeDefinition);

  const [expanded, setExpanded] = React.useState(!autoCollapse);

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
    />
  );
};

export default TreeNodeContainer;

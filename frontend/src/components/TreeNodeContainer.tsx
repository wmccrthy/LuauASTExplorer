import { getTypeString, getType } from "../utils/astTypeHelpers";
import React from "react";
import TreeNode from "./TreeNode";
import { shouldAutoCollapse } from "../utils/nodeEmphasisHelpers";
import { TreeNodeContainerProps } from "../types/typesAndInterfaces";

/**
 * Custom hook to compute type metadata for tree nodes.
 * Handles both current and previous type information for diff mode.
 */
const useTypeMetadata = (props: TreeNodeContainerProps) => {
  const [type, kind] = React.useMemo(() => {
    return getTypeString(props.value, props.nodeKey, props.parentInferredType);
  }, [props.value, props.nodeKey, props.parentInferredType]);

  const [typeDefinition, arrayType] = React.useMemo(() => {
    if (type) {
      return getType(type);
    }
    return [undefined, false];
  }, [type]);

  // Compute previous type metadata for diff mode
  const [prevType, prevKind] = React.useMemo(() => {
    const childChanges = props.value?.childChanges;
    if (childChanges && (childChanges._astType || childChanges.kind)) {
      const hackVal = {
        _astType: childChanges._astType ? childChanges._astType.oldValue : type,
        kind: childChanges.kind ? childChanges.kind.oldValue : kind,
      };
      return getTypeString(hackVal, props.nodeKey, undefined);
    }
    return [type, kind];
  }, [type, kind, props.value, props.nodeKey]);

  const [prevTypeDefinition, prevArrayType] = React.useMemo(() => {
    if (prevType) {
      return getType(prevType);
    }
    return [undefined, false];
  }, [prevType]);

  return {
    type,
    typeDefinition,
    arrayType,
    kind,
    prevType,
    prevTypeDefinition,
    prevArrayType,
    prevKind,
  };
};

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

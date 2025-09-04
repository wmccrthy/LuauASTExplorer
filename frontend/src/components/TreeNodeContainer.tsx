import { getTypeString, getType } from "../utils/astTypeHelpers";
import React from "react";
import TreeNode from "./TreeNode";
import { shouldAutoCollapse } from "../utils/nodeEmphasisHelpers";
import { TreeNodeContainerProps } from "../types/typesAndInterfaces";

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = (props) => {
  // get all this metadata at tree node level; pass to TypeTooltip
  const [type, kind] = React.useMemo(() => {
    return getTypeString(props.value, props.nodeKey, props.parentInferredType);
  }, [props.value, props.nodeKey, props.parentInferredType]);

  const [typeDefinition, arrayType] = React.useMemo(() => {
    if (type) {
      return getType(type);
    }
    return [undefined, false];
  }, [type]);

  // do the above once each for old and new values on contains-changes nodes
  const [prevType, prevKind] = React.useMemo(() => {
    const childChanges = props.value ? props.value.childChanges : undefined;
    if (childChanges && (childChanges._astType || childChanges.kind)) {
      const hackVal = {
        _astType: childChanges._astType ? childChanges._astType.oldValue : type, // might need to handle removed ast types here better; (generally scenarios other than UPDATE _astType)
        kind: childChanges.kind ? childChanges.kind.oldValue : kind,
      };
      return getTypeString(hackVal, props.nodeKey, undefined);
    }
    return [type, kind]; // if _astType not in changes, return already computed (prevType is same as currentType)
  }, [type, kind, props.value, props.nodeKey]);
  const [prevTypeDefinition, prevArrayType] = React.useMemo(() => {
    if (prevType) {
      return getType(prevType);
    }
    return [undefined, false];
  }, [prevType]);

  const typeMetadata = {
    type: type,
    typeDefinition: typeDefinition,
    arrayType: arrayType,
    kind: kind,
    prevType: prevType,
    prevTypeDefinition: prevTypeDefinition,
    prevArrayType: prevArrayType,
    prevKind: prevKind,
  };

  const autoCollapse = props.isDiffMode
    ? props.diffStatus === "unchanged" ||
      props.diffStatus === "removed" ||
      shouldAutoCollapse(type, typeDefinition)
    : shouldAutoCollapse(type, typeDefinition);

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

import { getTypeString, getType } from "../utils/astTypeHelpers";
import { TreeNodeContainerProps } from "../types/typesAndInterfaces";
import React from "react";
import { TypeMetadata } from "../utils/astTypeDefinitions";

/**
 * Custom hook to compute type metadata for tree nodes.
 * Handles both current and previous type information for diff mode.
 */
export const useTypeMetadata = (
  props: TreeNodeContainerProps
): TypeMetadata => {
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
    const typeChanged =
      childChanges && (childChanges._astType || childChanges.kind);
    if (props.isDiffMode && typeChanged) {
      const hackVal = {
        _astType: childChanges._astType ? childChanges._astType.oldValue : type,
        kind: childChanges.kind ? childChanges.kind.oldValue : kind,
      };
      return getTypeString(hackVal, props.nodeKey, undefined);
    }
    return [type, kind];
  }, [type, kind, props.value, props.nodeKey, props.isDiffMode]);

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

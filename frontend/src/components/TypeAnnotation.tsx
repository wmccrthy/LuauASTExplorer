import React from "react";
import { TypeTooltip } from "./TypeTooltip";
import { ASTTypeDefinition } from "../astTypeDefinitions";

export interface TypeAnnotationProps {
  typeName: string;
  typeDefinition?: ASTTypeDefinition;
  isArrayType: boolean;
  kind: string;
}

export const TypeAnnotation: React.FC<TypeAnnotationProps> = ({
  typeName,
  typeDefinition,
  isArrayType,
  kind,
}) => {
  return (
    <span className="ast-annotations">
      <TypeTooltip
        key="type"
        unpackedType={typeName}
        typeDefinition={typeDefinition}
        arrayType={isArrayType}
        kind={kind}
      >
        <span className="type-annotation"> (type: {typeName})</span>
      </TypeTooltip>
    </span>
  );
};

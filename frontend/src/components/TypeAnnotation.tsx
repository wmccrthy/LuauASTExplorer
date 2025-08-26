import React from "react";
import { TypeTooltip } from "./TypeTooltip";
import { ASTTypeDefinition } from "../utils/astTypeDefinitions";

export interface TypeAnnotationProps {
  typeName: string;
  typeDefinition?: ASTTypeDefinition;
  isArrayType: boolean;
  kind: string;
  hasPrevType?: boolean;
}

export const TypeAnnotation: React.FC<TypeAnnotationProps> = ({
  typeName,
  typeDefinition,
  isArrayType,
  kind,
  hasPrevType = false,
}) => {
  return (
    <span className="ast-annotations">
      <span className={`${hasPrevType ? "" : "unchanged"}`}>
        <TypeTooltip
          key="type"
          typeName={typeName}
          typeDefinition={typeDefinition}
          arrayType={isArrayType}
          kind={kind}
        >
          <span
            className={`type-annotation ${hasPrevType ? "has-prev-type" : ""}`}
          >
            type: {typeName}
          </span>
        </TypeTooltip>
      </span>
    </span>
  );
};

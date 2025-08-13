import { ASTTypeDefinition } from "./utils/astTypeDefinitions";
import { unpackArrayType } from "./utils/astTypeHelpers";

export const autoCollapseTypes = [
  "Token",
  "Whitespace",
  "SingleLineComment",
  "MultiLineComment",
  "Trivia",
  "Location"
];

// auto-collapse if type is:
//   one of the autoCollapseTypes
//   an array of autoCollapseTypes
//   a union of autoCollapseTypes
//   an extension of autoCollapseTypes
export const shouldAutoCollapse = (
  type: string | string[],
  typeDefinition?: ASTTypeDefinition
): boolean => {
  if (type) {
    if (typeof type == "string") {
      if (autoCollapseTypes.includes(type)) return true;

      if (autoCollapseTypes.includes(unpackArrayType(type))) return true;
    }

    if (typeDefinition && typeDefinition.unionMembers) {
      typeDefinition.unionMembers.forEach((member) => {
        if (shouldAutoCollapse(member)) {
          return true;
        }
      });
    }

    if (
      typeDefinition &&
      typeDefinition.baseType &&
      autoCollapseTypes.includes(typeDefinition.baseType)
    ) {
      return true;
    }
  }

  return false;
};

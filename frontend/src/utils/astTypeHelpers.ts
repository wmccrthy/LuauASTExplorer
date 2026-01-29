// Comprehensive Luau AST Type Definitions
// Generated from official Luau type definitions for maximum accuracy
import {
  ASTTypeDefinition,
  GenericTypeDefinition,
  astTypeDefinitions,
  TypeMetadata,
} from "./astTypeDefinitions";

export function getTypeDefinition(
  typeName: string | GenericTypeDefinition
): ASTTypeDefinition | undefined {
  if (typeof typeName === "string") {
    return astTypeDefinitions[typeName];
  }

  return getGenericASTTypeDefinition(typeName);
}

export function getGenericASTTypeDefinition(
  genericType: GenericTypeDefinition
): ASTTypeDefinition {
  switch (genericType.baseType) {
    case "Pair":
      const splitGenericType = genericType.genericType.split(",");
      return {
        properties: [
          { name: "node", type: splitGenericType[0] },
          {
            name: "separator",
            type: `Token${
              splitGenericType[1] ? `<${splitGenericType[1].trim()}>` : ""
            }`,
            optional: true,
          },
        ],
      };
    case "Punctuated":
      return {
        properties: [
          { name: "", type: `{ Pair<${genericType.genericType}> }` },
        ],
      };
    default:
      return { properties: [] };
  }
}

export function getAllTypes(): string[] {
  return Object.keys(astTypeDefinitions);
}

export function getAllNodeKeys(): string[] {
  // Extract all unique property names from all type definitions
  const allProperties: string[] = [];

  Object.values(astTypeDefinitions).forEach((typeDef) => {
    // Add properties from the main properties array
    if (typeDef.properties) {
      typeDef.properties.forEach((prop) => {
        allProperties.push(prop.name);
      });
    }

    // Add properties from kinds (for union types)
    if (typeDef.kinds) {
      Object.values(typeDef.kinds).forEach((kindDef) => {
        if (kindDef.properties) {
          kindDef.properties.forEach((prop) => {
            allProperties.push(prop.name);
          });
        }
      });
    }
  });

  return Array.from(new Set(allProperties)).sort();
}

const resolveEntriesType = (value: any[]): string => {
  if (value[0] && value[0].colon) {
    return "{ AstTypeTableItem }";
  }

  return "{ AstExprTableItem }";
};

const resolveEntriesKind = (value: any[]): string => {
  return value.length > 0 && value[0].kind ? value[0].kind : "";
};

const arrayTypeFallbacks: Record<string, string | ((item: any[]) => string)> = {
  statements: "{ AstStat }",
  leadingtrivia: "{ Trivia }",
  trailingtrivia: "{ Trivia }",
  attributes: "{ AstAttribute }",
  expressions: "{ AstExpr }",
  elseifs: "{ AstElseIfExpr }",
  strings: "{ Token }",
  entries: resolveEntriesType,
};

export const getArrayType = (
  arrayKey: string,
  arrayValue?: any[]
): [string, string] => {
  const fallback = arrayTypeFallbacks[arrayKey];
  if (typeof fallback === "function") {
    const entryKind = resolveEntriesKind(arrayValue ?? []);
    return [fallback(arrayValue ?? []), entryKind];
  }
  return [fallback, ""];
};

// true if type is a table of subtypes (i.e. { Trivia }) literally just checks for curly braces
export const isArrayType = (type: string) => {
  return /^\{\s*[\w<>| ]+\s*\}$/.test(type);
};

export const unpackArrayType = (type: string): string => {
  // Match any content inside curly braces, including nested angle brackets, quotes, etc.
  // This regex matches everything between the first { and last }
  const matchAny = type.match(/^\{\s*([\s\S]+?)\s*\}$/);
  return matchAny ? matchAny[1] : type;
};

// Parse generic types like "Pair<AstExpr>" -> { baseType: "Pair", genericType: "AstExpr" }
export const parseGenericType = (
  type: string
): GenericTypeDefinition | undefined => {
  const match = type.match(/^(\w+)<(.+)>$/);
  if (match) {
    return { baseType: match[1], genericType: match[2] };
  }
  return undefined;
};

export const getTypeString = (
  value: any,
  nodeKey: string,
  parentInferredType?: string | string[]
) => {
  let type = value ? value._astType : undefined;
  let kind = value ? value.kind || "" : "";
  if (Array.isArray(value)) {
    [type, kind] = getArrayType(
      nodeKey,
      nodeKey === "entries" ? value : undefined
    );
  }
  type = !type ? parentInferredType : type; // if type is null, fallback to parentInferredType (this should handle Punctuated well)
  return [type, kind];
};

export const getType = (
  type: string
): [ASTTypeDefinition | undefined, boolean] => {
  const genericTypeInfo = Array.isArray(type)
    ? undefined
    : parseGenericType(type);
  const isArray = isArrayType(type);
  const unpackedType = isArray
    ? unpackArrayType(type)
    : genericTypeInfo
    ? genericTypeInfo
    : type;
  return [getTypeDefinition(unpackedType), isArray];
};

export const getChildPropertyDefinition = (
  typeMetadata: TypeMetadata,
  childChanges: any,
  childKey: string
) => {
  if (
    childChanges &&
    childChanges[childKey] &&
    childChanges[childKey].type === "REMOVE"
  ) {
    // handle childPropertyDefinition differently when node is removed; since in object case, this implies a key no longer exists, it indicates the node type has changed
    // so we need to ensure the childPropertyDefinition is adjusted appopriately given it was a child of the previous node value
    return typeMetadata.prevTypeDefinition?.properties?.find(
      (prop) => prop.name === childKey
    );
  } else {
    return typeMetadata.typeDefinition?.properties?.find(
      (prop) => prop.name === childKey
    );
  }
};
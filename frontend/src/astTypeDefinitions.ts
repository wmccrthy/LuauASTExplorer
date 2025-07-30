export interface ASTTypeDefinition {
  properties: string[];
}

export const astTypeDefinitions: Record<string, ASTTypeDefinition> = {
  // === EXPRESSIONS ===
  "AstExprGroup": {
    properties: ["openParens", "expression", "closeParens"]
  },
  
  "AstExprConstantNil": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia"]
  },
  
  "AstExprConstantBool": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia", "value"]
  },
  
  "AstExprConstantNumber": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia", "value"]
  },
  
  "AstExprConstantString": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia", "quoteStyle", "blockDepth"]
  },
  
  "AstExprLocal": {
    properties: ["token", "local", "upvalue"]
  },
  
  "AstExprGlobal": {
    properties: ["name"]
  },
  
  "AstExprVarargs": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia"]
  },
  
  "AstExprCall": {
    properties: ["func", "openParens", "arguments", "closeParens", "self", "argLocation"]
  },
  
  "AstExprIndexName": {
    properties: ["expression", "accessor", "index", "indexLocation"]
  },
  
  "AstExprIndexExpr": {
    properties: ["expression", "openBrackets", "index", "closeBrackets"]
  },
  
  "AstExprAnonymousFunction": {
    properties: ["attributes", "functionKeyword", "body"]
  },
  
  "AstExprTable": {
    properties: ["openBrace", "entries", "closeBrace"]
  },
  
  "AstExprUnary": {
    properties: ["operator", "operand"]
  },
  
  "AstExprBinary": {
    properties: ["lhsoperand", "operator", "rhsoperand"]
  },

  "AstExprInterpString": {
    properties: ["strings", "expressions"]
  },

  "AstExprTypeAssertion": {
    properties: ["operand", "operator", "annotation"]
  },

  "AstExprIfElse": {
    properties: ["ifKeyword", "condition", "thenKeyword", "consequent", "elseifs", "elseKeyword", "antecedent"]
  },
  
  // === STATEMENTS ===
  "AstStatBlock": {
    properties: ["statements", "location"]
  },
  
  "AstStatIf": {
    properties: ["ifKeyword", "condition", "thenKeyword", "consequent", "elseifs", "elseKeyword", "antecedent", "endKeyword"]
  },
  
  "AstStatWhile": {
    properties: ["whileKeyword", "condition", "doKeyword", "body", "endKeyword"]
  },
  
  "AstStatRepeat": {
    properties: ["repeatKeyword", "body", "untilKeyword", "condition"]
  },
  
  "AstStatBreak": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia"]
  },
  
  "AstStatContinue": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia"]
  },
  
  "AstStatReturn": {
    properties: ["returnKeyword", "expressions"]
  },
  
  "AstStatExpr": {
    properties: ["expression"]
  },

  "AstStatLocal": {
    properties: ["localKeyword", "variables", "equals", "values"]
  },
  
  "AstStatAssign": {
    properties: ["variables", "equals", "values"]
  },

  "AstStatCompoundAssign": {
    properties: ["variable", "operand", "value"]
  },
  
  "AstStatFor": {
    properties: ["forKeyword", "variable", "equals", "from", "toComma", "to", "stepComma", "step", "doKeyword", "body", "endKeyword"]
  },
  
  "AstStatForIn": {
    properties: ["forKeyword", "variables", "inKeyword", "values", "doKeyword", "body", "endKeyword"]
  },

  "AstStatFunction": {
    properties: ["attributes", "functionKeyword", "name", "body"]
  },

  "AstStatLocalFunction": {
    properties: ["attributes", "localKeyword", "functionKeyword", "name", "body"]
  },

  "AstStatTypeAlias": {
    properties: ["export", "typeToken", "name", "openGenerics", "generics", "genericPacks", "closeGenerics", "equals", "type"]
  },

  "AstStatTypeFunction": {
    properties: ["export", "type", "functionKeyword", "name", "body"]
  },
  
  // === TYPES ===
  "AstTypeReference": {
    properties: ["prefix", "prefixPoint", "name", "openParameters", "parameters", "closeParameters"]
  },

  "AstTypeSingletonBool": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia", "value"]
  },

  "AstTypeSingletonString": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia", "quoteStyle"]
  },
  
  "AstTypeTypeof": {
    properties: ["typeof", "openParens", "expression", "closeParens"]
  },

  "AstTypeGroup": {
    properties: ["openParens", "type", "closeParens"]
  },

  "AstTypeOptional": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia"]
  },
  
  "AstTypeUnion": {
    properties: ["leading", "types"]
  },
  
  "AstTypeIntersection": {
    properties: ["leading", "types"]
  },

  "AstTypeArray": {
    properties: ["openBrace", "access", "type", "closeBrace"]
  },

  "AstTypeTable": {
    properties: ["openBrace", "entries", "closeBrace"]
  },

  "AstTypeFunction": {
    properties: ["openGenerics", "generics", "genericPacks", "closeGenerics", "openParens", "parameters", "vararg", "closeParens", "returnArrow", "returnTypes"]
  },

  // === TYPE PACKS ===
  "AstTypePackExplicit": {
    properties: ["openParens", "types", "tailType", "closeParens"]
  },

  "AstTypePackGeneric": {
    properties: ["name", "ellipsis"]
  },

  "AstTypePackVariadic": {
    properties: ["ellipsis", "type"]
  },
  
  // === UTILITY TYPES ===
  "Position": {
    properties: ["line", "column"]
  },

  "Location": {
    properties: ["begin", "end"]
  },
  
  "Token": {
    properties: ["leadingTrivia", "position", "text", "trailingTrivia"]
  },
  
  "Trivia": {
    properties: ["tag", "location", "text"]
  },

  "Whitespace": {
    properties: ["location", "text"]
  },
  
  "SingleLineComment": {
    properties: ["location", "text"]
  },
  
  "MultiLineComment": {
    properties: ["location", "text"]
  },

  "AstLocal": {
    properties: ["name", "colon", "annotation", "shadows"]
  },

  "AstFunctionBody": {
    properties: ["openGenerics", "generics", "genericPacks", "closeGenerics", "self", "openParens", "parameters", "vararg", "varargColon", "varargAnnotation", "closeParens", "returnSpecifier", "returnAnnotation", "body", "endKeyword"]
  },

  "AstAttribute": {
    properties: ["position", "text", "leadingTrivia", "trailingTrivia"]
  },

  "AstGenericType": {
    properties: ["name", "equals", "default"]
  },

  "AstGenericTypePack": {
    properties: ["name", "ellipsis", "equals", "default"]
  }
};

export function getTypeDefinition(typeName: string): ASTTypeDefinition | undefined {
  return astTypeDefinitions[typeName];
}

export function getAllTypes(): string[] {
  return Object.keys(astTypeDefinitions);
} 
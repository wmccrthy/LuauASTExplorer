export interface PropertyDefinition {
  name: string;
  type: string | string[];
  optional?: boolean;
  generic?: string;
}

export interface ASTTypeDefinition {
  properties?: PropertyDefinition[];
  kinds?: Record<string, ASTTypeDefinition>;
  baseType?: string;
  unionMembers?: string[];
}

export interface GenericTypeDefinition {
  baseType: string;
  genericType: string;
}

export interface TypeMetadata {
  type: string;
  typeDefinition: ASTTypeDefinition | undefined;
  arrayType: boolean;
  kind: string;
  prevType: string;
  prevTypeDefinition: ASTTypeDefinition | undefined;
  prevArrayType: boolean;
  prevKind: string;
}

// Aligned with ~/.lute/typedefs/1.0.1/lute/syntax/cst.luau
export const astTypeDefinitions: Record<string, ASTTypeDefinition> = {
  // === UTILITY TYPES ===
  span: {
    properties: [
      { name: "beginLine", type: "number" },
      { name: "beginColumn", type: "number" },
      { name: "endLine", type: "number" },
      { name: "endColumn", type: "number" },
    ],
  },

  Whitespace: {
    properties: [
      { name: "tag", type: '"whitespace"' },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
    ],
  },

  SingleLineComment: {
    properties: [
      { name: "tag", type: '"comment"' },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
    ],
  },

  MultiLineComment: {
    properties: [
      { name: "tag", type: '"blockcomment"' },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
    ],
  },

  Trivia: {
    unionMembers: ["Whitespace", "SingleLineComment", "MultiLineComment"],
  },

  CstToken: {
    properties: [
      { name: "leadingTrivia", type: "{ Trivia }" },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
      { name: "trailingTrivia", type: "{ Trivia }" },
      { name: "kind", type: '"token"' },
    ],
  },

  CstEof: {
    baseType: "CstToken",
    properties: [{ name: "tag", type: '"eof"' }],
  },

  CstPunctuated: {
    properties: [
      { name: "", type: "{ T }" },
      { name: "separators", type: "{ CstToken }" },
    ],
  },

  CstLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"local"' },
      { name: "name", type: "CstToken" },
      { name: "colon", type: "CstToken", optional: true },
      { name: "annotation", type: "CstType", optional: true },
      { name: "shadows", type: "CstLocal", optional: true },
    ],
  },

  // === EXPRESSIONS ===
  CstExprGroup: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"group"' },
      { name: "openParens", type: "CstToken" },
      { name: "expression", type: "CstExpr" },
      { name: "closeParens", type: "CstToken" },
    ],
  },

  CstExprConstantNil: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"nil"' },
      { name: "token", type: "CstToken" },
    ],
  },

  CstExprConstantBool: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"boolean"' },
      { name: "value", type: "boolean" },
      { name: "token", type: "CstToken" },
    ],
  },

  CstExprConstantNumber: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"number"' },
      { name: "value", type: "number" },
      { name: "token", type: "CstToken" },
    ],
  },

  CstExprConstantInteger: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"integer"' },
      { name: "value", type: "number" },
      { name: "token", type: "CstToken" },
    ],
  },

  CstExprConstantString: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"string"' },
      { name: "quoteStyle", type: ["single", "double", "block", "interp"] },
      { name: "blockDepth", type: "number" },
      { name: "value", type: "CstToken" },
    ],
  },

  CstExprLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"local"' },
      { name: "token", type: "CstToken" },
      { name: "local", type: "CstLocal" },
      { name: "upvalue", type: "boolean" },
    ],
  },

  CstExprGlobal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"global"' },
      { name: "name", type: "CstToken" },
    ],
  },

  CstExprVarargs: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"vararg"' },
      { name: "token", type: "CstToken" },
    ],
  },

  CstExprCall: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"call"' },
      { name: "func", type: "CstExpr" },
      { name: "openParens", type: "CstToken", optional: true },
      { name: "arguments", type: "CstPunctuated<CstExpr>" },
      { name: "closeParens", type: "CstToken", optional: true },
      { name: "self", type: "boolean" },
      { name: "argLocation", type: "span" },
    ],
  },

  CstExprInstantiate: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"instantiate"' },
      { name: "expr", type: "CstExpr" },
      { name: "leftArrow1", type: "CstToken" },
      { name: "leftArrow2", type: "CstToken" },
      { name: "typeArguments", type: "CstPunctuated<CstType | CstTypePack>" },
      { name: "rightArrow1", type: "CstToken" },
      { name: "rightArrow2", type: "CstToken" },
    ],
  },

  CstExprIndexName: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"indexname"' },
      { name: "expression", type: "CstExpr" },
      { name: "accessor", type: "CstToken" },
      { name: "index", type: "CstToken" },
      { name: "indexLocation", type: "span" },
    ],
  },

  CstExprIndexExpr: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"index"' },
      { name: "expression", type: "CstExpr" },
      { name: "openBrackets", type: "CstToken" },
      { name: "index", type: "CstExpr" },
      { name: "closeBrackets", type: "CstToken" },
    ],
  },

  CstExprFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"function"' },
      { name: "attributes", type: "{ CstAttribute }" },
      { name: "functionKeyword", type: "CstToken" },
      { name: "openGenerics", type: "CstToken", optional: true },
      { name: "generics", type: "CstPunctuated<CstGenericType>", optional: true },
      { name: "genericPacks", type: "CstPunctuated<CstGenericTypePack>", optional: true },
      { name: "closeGenerics", type: "CstToken", optional: true },
      { name: "openParens", type: "CstToken" },
      { name: "self", type: "CstLocal", optional: true },
      { name: "parameters", type: "CstPunctuated<CstLocal>" },
      { name: "vararg", type: "CstToken", optional: true },
      { name: "varargColon", type: "CstToken", optional: true },
      { name: "varargAnnotation", type: "CstTypePack", optional: true },
      { name: "closeParens", type: "CstToken" },
      { name: "returnSpecifier", type: "CstToken", optional: true },
      { name: "returnAnnotation", type: "CstTypePack", optional: true },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "CstToken" },
    ],
  },

  CstTableExprListItem: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"list"' },
      { name: "value", type: "CstExpr" },
      { name: "separator", type: "CstToken", optional: true },
      { name: "isTableItem", type: "true" },
    ],
  },

  CstTableExprRecordItem: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"record"' },
      { name: "key", type: "CstToken" },
      { name: "equals", type: "CstToken" },
      { name: "value", type: "CstExpr" },
      { name: "separator", type: "CstToken", optional: true },
      { name: "isTableItem", type: "true" },
    ],
  },

  CstTableExprGeneralItem: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"general"' },
      { name: "indexerOpen", type: "CstToken" },
      { name: "key", type: "CstExpr" },
      { name: "indexerClose", type: "CstToken" },
      { name: "equals", type: "CstToken" },
      { name: "value", type: "CstExpr" },
      { name: "separator", type: "CstToken", optional: true },
      { name: "isTableItem", type: "true" },
    ],
  },

  CstTableExprItem: {
    unionMembers: [
      "CstTableExprListItem",
      "CstTableExprRecordItem",
      "CstTableExprGeneralItem",
    ],
  },

  CstExprTable: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"table"' },
      { name: "openBrace", type: "CstToken" },
      { name: "entries", type: "{ CstTableExprItem }" },
      { name: "closeBrace", type: "CstToken" },
    ],
  },

  CstExprUnary: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"unary"' },
      { name: "operator", type: "CstToken" },
      { name: "operand", type: "CstExpr" },
    ],
  },

  CstExprBinary: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"binary"' },
      { name: "lhsOperand", type: "CstExpr" },
      { name: "operator", type: "CstToken" },
      { name: "rhsOperand", type: "CstExpr" },
    ],
  },

  CstExprInterpString: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"interpolatedstring"' },
      { name: "strings", type: "{ CstToken }" },
      { name: "expressions", type: "{ CstExpr }" },
    ],
  },

  CstExprTypeAssertion: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"cast"' },
      { name: "operand", type: "CstExpr" },
      { name: "operator", type: "CstToken" },
      { name: "annotation", type: "CstType" },
    ],
  },

  CstElseIfExpr: {
    properties: [
      { name: "elseIfKeyword", type: "CstToken" },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "CstToken" },
      { name: "thenExpr", type: "CstExpr" },
    ],
  },

  CstExprIfElse: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"conditional"' },
      { name: "ifKeyword", type: "CstToken" },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "CstToken" },
      { name: "thenExpr", type: "CstExpr" },
      { name: "elseifs", type: "{ CstElseIfExpr }" },
      { name: "elseKeyword", type: "CstToken" },
      { name: "elseExpr", type: "CstExpr" },
    ],
  },

  CstExpr: {
    unionMembers: [
      "CstExprGroup",
      "CstExprConstantNil",
      "CstExprConstantBool",
      "CstExprConstantNumber",
      "CstExprConstantInteger",
      "CstExprConstantString",
      "CstExprLocal",
      "CstExprGlobal",
      "CstExprVarargs",
      "CstExprCall",
      "CstExprInstantiate",
      "CstExprIndexName",
      "CstExprIndexExpr",
      "CstExprFunction",
      "CstExprTable",
      "CstExprUnary",
      "CstExprBinary",
      "CstExprInterpString",
      "CstExprTypeAssertion",
      "CstExprIfElse",
    ],
  },

  // === STATEMENTS ===
  CstStatBlock: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"block"' },
      { name: "statements", type: "{ CstStat }" },
    ],
  },

  CstStatDo: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"do"' },
      { name: "doKeyword", type: "CstToken" },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "CstToken" },
    ],
  },

  CstElseIfStat: {
    properties: [
      { name: "elseIfKeyword", type: "CstToken" },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "CstToken" },
      { name: "thenBlock", type: "CstStatBlock" },
    ],
  },

  CstStatIf: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"conditional"' },
      { name: "ifKeyword", type: "CstToken" },
      { name: "condition", type: "CstExpr" },
      { name: "thenKeyword", type: "CstToken" },
      { name: "thenBlock", type: "CstStatBlock" },
      { name: "elseifs", type: "{ CstElseIfStat }" },
      { name: "elseKeyword", type: "CstToken", optional: true },
      { name: "elseBlock", type: "CstStatBlock", optional: true },
      { name: "endKeyword", type: "CstToken" },
    ],
  },

  CstStatWhile: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"while"' },
      { name: "whileKeyword", type: "CstToken" },
      { name: "condition", type: "CstExpr" },
      { name: "doKeyword", type: "CstToken" },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "CstToken" },
    ],
  },

  CstStatRepeat: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"repeat"' },
      { name: "repeatKeyword", type: "CstToken" },
      { name: "body", type: "CstStatBlock" },
      { name: "untilKeyword", type: "CstToken" },
      { name: "condition", type: "CstExpr" },
    ],
  },

  CstStatBreak: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"break"' },
      { name: "token", type: "CstToken" },
    ],
  },

  CstStatContinue: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"continue"' },
      { name: "token", type: "CstToken" },
    ],
  },

  CstStatReturn: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"return"' },
      { name: "returnKeyword", type: "CstToken" },
      { name: "expressions", type: "CstPunctuated<CstExpr>" },
    ],
  },

  CstStatExpr: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"expression"' },
      { name: "expression", type: "CstExpr" },
    ],
  },

  CstStatLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"local"' },
      { name: "localKeyword", type: "CstToken" },
      { name: "variables", type: "CstPunctuated<CstLocal>" },
      { name: "equals", type: "CstToken", optional: true },
      { name: "values", type: "CstPunctuated<CstExpr>" },
    ],
  },

  CstStatConst: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"const"' },
      { name: "constKeyword", type: "CstToken" },
      { name: "variables", type: "CstPunctuated<CstLocal>" },
      { name: "equals", type: "CstToken", optional: true },
      { name: "values", type: "CstPunctuated<CstExpr>" },
    ],
  },

  CstStatFor: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"for"' },
      { name: "forKeyword", type: "CstToken" },
      { name: "variable", type: "CstLocal" },
      { name: "equals", type: "CstToken" },
      { name: "from", type: "CstExpr" },
      { name: "toComma", type: "CstToken" },
      { name: "to", type: "CstExpr" },
      { name: "stepComma", type: "CstToken", optional: true },
      { name: "step", type: "CstExpr", optional: true },
      { name: "doKeyword", type: "CstToken" },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "CstToken" },
    ],
  },

  CstStatForIn: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"forin"' },
      { name: "forKeyword", type: "CstToken" },
      { name: "variables", type: "CstPunctuated<CstLocal>" },
      { name: "inKeyword", type: "CstToken" },
      { name: "values", type: "CstPunctuated<CstExpr>" },
      { name: "doKeyword", type: "CstToken" },
      { name: "body", type: "CstStatBlock" },
      { name: "endKeyword", type: "CstToken" },
    ],
  },

  CstStatAssign: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"assign"' },
      { name: "variables", type: "CstPunctuated<CstExpr>" },
      { name: "equals", type: "CstToken" },
      { name: "values", type: "CstPunctuated<CstExpr>" },
    ],
  },

  CstStatCompoundAssign: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"compoundassign"' },
      { name: "variable", type: "CstExpr" },
      { name: "operand", type: "CstToken" },
      { name: "value", type: "CstExpr" },
    ],
  },

  CstAttribute: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"attribute"' },
      { name: "name", type: "CstToken" },
    ],
  },

  CstStatFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"function"' },
      { name: "name", type: "CstExpr" },
      { name: "func", type: "CstExprFunction" },
    ],
  },

  CstStatLocalFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"localfunction"' },
      { name: "localKeyword", type: "CstToken" },
      { name: "name", type: "CstLocal" },
      { name: "func", type: "CstExprFunction" },
    ],
  },

  CstStatTypeAlias: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"typealias"' },
      { name: "export", type: "CstToken", optional: true },
      { name: "typeToken", type: "CstToken" },
      { name: "name", type: "CstToken" },
      { name: "openGenerics", type: "CstToken", optional: true },
      { name: "generics", type: "CstPunctuated<CstGenericType>", optional: true },
      { name: "genericPacks", type: "CstPunctuated<CstGenericTypePack>", optional: true },
      { name: "closeGenerics", type: "CstToken", optional: true },
      { name: "equals", type: "CstToken" },
      { name: "type", type: "CstType" },
    ],
  },

  CstStatTypeFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"typefunction"' },
      { name: "export", type: "CstToken", optional: true },
      { name: "type", type: "CstToken" },
      { name: "name", type: "CstToken" },
      { name: "body", type: "CstExprFunction" },
    ],
  },

  CstStat: {
    unionMembers: [
      "CstStatBlock",
      "CstStatDo",
      "CstStatIf",
      "CstStatWhile",
      "CstStatRepeat",
      "CstStatBreak",
      "CstStatContinue",
      "CstStatReturn",
      "CstStatExpr",
      "CstStatLocal",
      "CstStatConst",
      "CstStatFor",
      "CstStatForIn",
      "CstStatAssign",
      "CstStatCompoundAssign",
      "CstStatFunction",
      "CstStatLocalFunction",
      "CstStatTypeAlias",
      "CstStatTypeFunction",
    ],
  },

  // === GENERIC TYPES ===
  CstGenericType: {
    properties: [
      { name: "tag", type: '"generic"' },
      { name: "name", type: "CstToken" },
      { name: "equals", type: "CstToken", optional: true },
      { name: "default", type: "CstType", optional: true },
    ],
  },

  CstGenericTypePack: {
    properties: [
      { name: "tag", type: '"genericpack"' },
      { name: "name", type: "CstToken" },
      { name: "ellipsis", type: "CstToken" },
      { name: "equals", type: "CstToken", optional: true },
      { name: "default", type: "CstTypePack", optional: true },
    ],
  },

  // === TYPE SYSTEM ===
  CstTypeReference: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"reference"' },
      { name: "prefix", type: "CstToken", optional: true },
      { name: "prefixPoint", type: "CstToken", optional: true },
      { name: "name", type: "CstToken" },
      { name: "openParameters", type: "CstToken", optional: true },
      { name: "parameters", type: "CstPunctuated<CstType | CstTypePack>", optional: true },
      { name: "closeParameters", type: "CstToken", optional: true },
    ],
  },

  CstTypeSingletonBool: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"boolean"' },
      { name: "value", type: "boolean" },
      { name: "token", type: "CstToken" },
    ],
  },

  CstTypeSingletonString: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"string"' },
      { name: "quoteStyle", type: ["single", "double"] },
      { name: "value", type: "CstToken" },
    ],
  },

  CstTypeTypeof: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"typeof"' },
      { name: "typeof", type: "CstToken" },
      { name: "openParens", type: "CstToken" },
      { name: "expression", type: "CstExpr" },
      { name: "closeParens", type: "CstToken" },
    ],
  },

  CstTypeGroup: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"group"' },
      { name: "openParens", type: "CstToken" },
      { name: "type", type: "CstType" },
      { name: "closeParens", type: "CstToken" },
    ],
  },

  CstTypeOptional: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"optional"' },
      { name: "token", type: "CstToken" },
    ],
  },

  CstTypeUnion: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"union"' },
      { name: "leading", type: "CstToken", optional: true },
      { name: "types", type: 'CstPunctuated<CstType, "|">' },
    ],
  },

  CstTypeIntersection: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"intersection"' },
      { name: "leading", type: "CstToken", optional: true },
      { name: "types", type: 'CstPunctuated<CstType, "&">' },
    ],
  },

  CstTypeArray: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"array"' },
      { name: "openBrace", type: "CstToken" },
      { name: "access", type: "CstToken", optional: true },
      { name: "type", type: "CstType" },
      { name: "closeBrace", type: "CstToken" },
    ],
  },

  CstTableTypeItemIndexer: {
    properties: [
      { name: "kind", type: '"indexer"' },
      { name: "access", type: "CstToken", optional: true },
      { name: "indexerOpen", type: "CstToken" },
      { name: "key", type: "CstType" },
      { name: "indexerClose", type: "CstToken" },
      { name: "colon", type: "CstToken" },
      { name: "value", type: "CstType" },
      { name: "separator", type: "CstToken", optional: true },
    ],
  },

  CstTableTypeItemStringProperty: {
    properties: [
      { name: "kind", type: '"stringproperty"' },
      { name: "access", type: "CstToken", optional: true },
      { name: "indexerOpen", type: "CstToken" },
      { name: "key", type: "CstTypeSingletonString" },
      { name: "indexerClose", type: "CstToken" },
      { name: "colon", type: "CstToken" },
      { name: "value", type: "CstType" },
      { name: "separator", type: "CstToken", optional: true },
    ],
  },

  CstTableTypeItemProperty: {
    properties: [
      { name: "kind", type: '"property"' },
      { name: "access", type: "CstToken", optional: true },
      { name: "key", type: "CstToken" },
      { name: "colon", type: "CstToken" },
      { name: "value", type: "CstType" },
      { name: "separator", type: "CstToken", optional: true },
    ],
  },

  CstTableTypeItem: {
    unionMembers: [
      "CstTableTypeItemIndexer",
      "CstTableTypeItemStringProperty",
      "CstTableTypeItemProperty",
    ],
  },

  CstTypeTable: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"table"' },
      { name: "openBrace", type: "CstToken" },
      { name: "entries", type: "{ CstTableTypeItem }" },
      { name: "closeBrace", type: "CstToken" },
    ],
  },

  CstFunctionTypeParameter: {
    properties: [
      { name: "name", type: "CstToken", optional: true },
      { name: "colon", type: "CstToken", optional: true },
      { name: "type", type: "CstType" },
    ],
  },

  CstTypeFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"function"' },
      { name: "openGenerics", type: "CstToken", optional: true },
      { name: "generics", type: "CstPunctuated<CstGenericType>", optional: true },
      { name: "genericPacks", type: "CstPunctuated<CstGenericTypePack>", optional: true },
      { name: "closeGenerics", type: "CstToken", optional: true },
      { name: "openParens", type: "CstToken" },
      { name: "parameters", type: "CstPunctuated<CstFunctionTypeParameter>" },
      { name: "vararg", type: "CstTypePack", optional: true },
      { name: "closeParens", type: "CstToken" },
      { name: "returnArrow", type: "CstToken" },
      { name: "returnTypes", type: "CstTypePack" },
    ],
  },

  CstType: {
    unionMembers: [
      "CstTypeReference",
      "CstTypeSingletonBool",
      "CstTypeSingletonString",
      "CstTypeTypeof",
      "CstTypeGroup",
      "CstTypeUnion",
      "CstTypeIntersection",
      "CstTypeOptional",
      "CstTypeArray",
      "CstTypeTable",
      "CstTypeFunction",
    ],
  },

  // === TYPE PACKS ===
  CstTypePackExplicit: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"explicit"' },
      { name: "openParens", type: "CstToken", optional: true },
      { name: "types", type: "CstPunctuated<CstType>" },
      { name: "tailType", type: "CstTypePack", optional: true },
      { name: "closeParens", type: "CstToken", optional: true },
    ],
  },

  CstTypePackGeneric: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"generic"' },
      { name: "name", type: "CstToken" },
      { name: "ellipsis", type: "CstToken" },
    ],
  },

  CstTypePackVariadic: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"variadic"' },
      { name: "ellipsis", type: "CstToken", optional: true },
      { name: "type", type: "CstType" },
    ],
  },

  CstTypePack: {
    unionMembers: [
      "CstTypePackExplicit",
      "CstTypePackGeneric",
      "CstTypePackVariadic",
    ],
  },

  _testType: {
    properties: [
      { name: "removedName", type: "CstToken", optional: true },
      { name: "name", type: "CstToken", optional: true },
    ],
  },
};

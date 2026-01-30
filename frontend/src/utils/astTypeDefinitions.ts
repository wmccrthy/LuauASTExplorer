export interface PropertyDefinition {
  name: string;
  type: string | string[]; // string[] for unions like "true" | "false"
  optional?: boolean;
  generic?: string; // for Token<"specific"> types
}

export interface ASTTypeDefinition {
  properties?: PropertyDefinition[];
  kinds?: Record<string, ASTTypeDefinition>;
  baseType?: string; // for intersections like "Token &"
  unionMembers?: string[]; // for "AstExpr = A | B | C"
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

export const astTypeDefinitions: Record<string, ASTTypeDefinition> = {
  // === UTILITY TYPES ===
  span: {
    properties: [
      { name: "beginline", type: "number" },
      { name: "begincolumn", type: "number" },
      { name: "endline", type: "number" },
      { name: "endcolumn", type: "number" },
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

  Token: {
    properties: [
      { name: "leadingtrivia", type: "{ Trivia }" },
      { name: "location", type: "span" },
      { name: "text", type: "string" },
      { name: "trailingtrivia", type: "{ Trivia }" },
      { name: "istoken", type: "true" },
    ],
  },

  Eof: {
    baseType: "Token",
    properties: [
      { name: "tag", type: '"eof"' },
      { name: "text", type: '""' },
    ],
  },

  Pair: {
    properties: [
      { name: "node", type: "any" },
      { name: "separator", type: "Token", optional: true },
    ],
  },

  Punctuated: {
    properties: [{ name: "pairs", type: "{ Pair }" }],
  },

  AstLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"local"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "colon", type: "Token", generic: 'Token<":">', optional: true },
      { name: "annotation", type: "AstType", optional: true },
      { name: "shadows", type: "AstLocal", optional: true },
    ],
  },

  // === EXPRESSIONS ===
  AstExprGroup: {
    properties: [
      { name: "location", type: "span" },
      { name: "tag", type: '"group"' },
      { name: "openparens", type: "Token", generic: 'Token<"(">' },
      { name: "expression", type: "AstExpr" },
      { name: "closeparens", type: "Token", generic: 'Token<")">' },
    ],
  },

  AstExprConstantNil: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"nil"' },
      { name: "text", type: '"nil"' },
    ],
  },

  AstExprConstantBool: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"boolean"' },
      { name: "text", type: ["true", "false"] },
      { name: "value", type: "boolean" },
    ],
  },

  AstExprConstantNumber: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"number"' },
      { name: "text", type: "string" },
      { name: "value", type: "number" },
    ],
  },

  AstExprConstantString: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"string"' },
      { name: "text", type: "string" },
      { name: "quotestyle", type: ["single", "double", "block", "interp"] },
      { name: "blockdepth", type: "number" },
    ],
  },

  AstExprLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"local"' },
      { name: "token", type: "Token", generic: "Token<string>" },
      { name: "local", type: "AstLocal" },
      { name: "upvalue", type: "boolean" },
    ],
  },

  AstExprGlobal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"global"' },
      { name: "name", type: "Token" },
    ],
  },

  AstExprVarargs: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"vararg"' },
      { name: "text", type: '"..."' },
    ],
  },

  AstExprCall: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"call"' },
      { name: "func", type: "AstExpr" },
      {
        name: "openparens",
        type: "Token",
        generic: 'Token<"(">',
        optional: true,
      },
      { name: "arguments", type: "Punctuated", generic: "Punctuated<AstExpr>" },
      {
        name: "closeparens",
        type: "Token",
        generic: 'Token<")">',
        optional: true,
      },
      { name: "self", type: "boolean" },
      { name: "argLocation", type: "span" },
    ],
  },

  AstExprIndexName: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"indexname"' },
      { name: "expression", type: "AstExpr" },
      { name: "accessor", type: "Token", generic: 'Token<"." | ":">' },
      { name: "index", type: "Token", generic: "Token<string>" },
      { name: "indexlocation", type: "span" },
    ],
  },

  AstExprIndexExpr: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"index"' },
      { name: "expression", type: "AstExpr" },
      { name: "openbrackets", type: "Token", generic: 'Token<"[">' },
      { name: "index", type: "AstExpr" },
      { name: "closebrackets", type: "Token", generic: 'Token<"]">' },
    ],
  },

  AstExprFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"function"' },
      { name: "attributes", type: "{ AstAttribute }" },
      { name: "functionkeyword", type: "Token", generic: 'Token<"function">' },
      {
        name: "opengenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<AstGenericType>",
        optional: true,
      },
      {
        name: "genericpacks",
        type: "Punctuated",
        generic: "Punctuated<AstGenericTypePack>",
        optional: true,
      },
      {
        name: "closegenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "openparens", type: "Token", generic: 'Token<"(">' },
      { name: "self", type: "AstLocal", optional: true },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<AstLocal>",
      },
      {
        name: "vararg",
        type: "Token",
        generic: 'Token<"...">',
        optional: true,
      },
      {
        name: "varargcolon",
        type: "Token",
        generic: 'Token<":">',
        optional: true,
      },
      { name: "varargannotation", type: "AstTypePack", optional: true },
      { name: "closeparens", type: "Token", generic: 'Token<")">' },
      {
        name: "returnspecifier",
        type: "Token",
        generic: 'Token<":">',
        optional: true,
      },
      { name: "returnannotation", type: "AstTypePack", optional: true },
      { name: "body", type: "AstStatBlock" },
      { name: "endkeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstExprTableItemList: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"list"' },
      { name: "value", type: "AstExpr" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
      { name: "istableitem", type: "true" },
    ],
  },

  AstExprTableItemRecord: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"record"' },
      { name: "key", type: "Token", generic: "Token<string>" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "value", type: "AstExpr" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
      { name: "istableitem", type: "true" },
    ],
  },

  AstExprTableItemGeneral: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"general"' },
      { name: "indexeropen", type: "Token", generic: 'Token<"[">' },
      { name: "key", type: "AstExpr" },
      { name: "indexerclose", type: "Token", generic: 'Token<"]">' },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "value", type: "AstExpr" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
      { name: "istableitem", type: "true" },
    ],
  },

  AstExprTableItem: {
    unionMembers: [
      "AstExprTableItemList",
      "AstExprTableItemRecord",
      "AstExprTableItemGeneral",
    ],
  },

  AstExprTable: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"table"' },
      { name: "openbrace", type: "Token", generic: 'Token<"{">' },
      { name: "entries", type: "{ AstExprTableItem }" },
      { name: "closebrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  AstExprUnary: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"unary"' },
      { name: "operator", type: "Token", generic: 'Token<"not" | "-" | "#">' },
      { name: "operand", type: "AstExpr" },
    ],
  },

  AstExprBinary: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"binary"' },
      { name: "lhsoperand", type: "AstExpr" },
      { name: "operator", type: "Token" },
      { name: "rhsoperand", type: "AstExpr" },
    ],
  },

  AstExprInterpString: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"interpolatedstring"' },
      { name: "strings", type: "{ Token }", generic: "{ Token<string> }" },
      { name: "expressions", type: "{ AstExpr }" },
    ],
  },

  AstExprTypeAssertion: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"cast"' },
      { name: "operand", type: "AstExpr" },
      { name: "operator", type: "Token", generic: 'Token<"::">' },
      { name: "annotation", type: "AstType" },
    ],
  },

  AstElseIfExpr: {
    properties: [
      { name: "elseifkeyword", type: "Token", generic: 'Token<"elseif">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenkeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenexpr", type: "AstExpr" },
    ],
  },

  AstExprIfElse: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"expr"' },
      { name: "tag", type: '"conditional"' },
      { name: "ifkeyword", type: "Token", generic: 'Token<"if">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenkeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenexpr", type: "AstExpr" },
      { name: "elseifs", type: "{ AstElseIfExpr }" },
      { name: "elsekeyword", type: "Token", generic: 'Token<"else">' },
      { name: "elseexpr", type: "AstExpr" },
    ],
  },

  AstExpr: {
    unionMembers: [
      "AstExprGroup",
      "AstExprConstantNil",
      "AstExprConstantBool",
      "AstExprConstantNumber",
      "AstExprConstantString",
      "AstExprLocal",
      "AstExprGlobal",
      "AstExprVarargs",
      "AstExprCall",
      "AstExprIndexName",
      "AstExprIndexExpr",
      "AstExprFunction",
      "AstExprTable",
      "AstExprUnary",
      "AstExprBinary",
      "AstExprInterpString",
      "AstExprTypeAssertion",
      "AstExprIfElse",
    ],
  },

  // === STATEMENTS ===
  AstStatBlock: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"block"' },
      { name: "statements", type: "{ AstStat }" },
    ],
  },

  AstStatDo: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"do"' },
      { name: "dokeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "{ AstStat }" },
      { name: "endkeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstElseIfStat: {
    properties: [
      { name: "elseifkeyword", type: "Token", generic: 'Token<"elseif">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenkeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenblock", type: "AstStatBlock" },
    ],
  },

  AstStatIf: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"conditional"' },
      { name: "ifkeyword", type: "Token", generic: 'Token<"if">' },
      { name: "condition", type: "AstExpr" },
      { name: "thenkeyword", type: "Token", generic: 'Token<"then">' },
      { name: "thenblock", type: "AstStatBlock" },
      { name: "elseifs", type: "{ AstElseIfStat }" },
      {
        name: "elsekeyword",
        type: "Token",
        generic: 'Token<"else">',
        optional: true,
      },
      { name: "elseblock", type: "AstStatBlock", optional: true },
      { name: "endkeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatWhile: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"while"' },
      { name: "whilekeyword", type: "Token", generic: 'Token<"while">' },
      { name: "condition", type: "AstExpr" },
      { name: "dokeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "AstStatBlock" },
      { name: "endkeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatRepeat: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"repeat"' },
      { name: "repeatkeyword", type: "Token", generic: 'Token<"repeat">' },
      { name: "body", type: "AstStatBlock" },
      { name: "untilkeyword", type: "Token", generic: 'Token<"until">' },
      { name: "condition", type: "AstExpr" },
    ],
  },

  AstStatBreak: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"break"' },
      { name: "text", type: '"break"' },
    ],
  },

  AstStatContinue: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"continue"' },
      { name: "text", type: '"continue"' },
    ],
  },

  AstStatReturn: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"return"' },
      { name: "returnkeyword", type: "Token", generic: 'Token<"return">' },
      {
        name: "expressions",
        type: "Punctuated",
        generic: "Punctuated<AstExpr>",
      },
    ],
  },

  AstStatExpr: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"expression"' },
      { name: "expression", type: "AstExpr" },
    ],
  },

  AstStatLocal: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"local"' },
      { name: "localkeyword", type: "Token", generic: 'Token<"local">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<AstLocal>",
      },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "values", type: "Punctuated", generic: "Punctuated<AstExpr>" },
    ],
  },

  AstStatFor: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"for"' },
      { name: "forkeyword", type: "Token", generic: 'Token<"for">' },
      { name: "variable", type: "AstLocal" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "from", type: "AstExpr" },
      { name: "tocomma", type: "Token", generic: 'Token<",">' },
      { name: "to", type: "AstExpr" },
      {
        name: "stepcomma",
        type: "Token",
        generic: 'Token<",">',
        optional: true,
      },
      { name: "step", type: "AstExpr", optional: true },
      { name: "dokeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "AstStatBlock" },
      { name: "endkeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatForIn: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"forin"' },
      { name: "forkeyword", type: "Token", generic: 'Token<"for">' },
      {
        name: "variables",
        type: "Punctuated",
        generic: "Punctuated<AstLocal>",
      },
      { name: "inkeyword", type: "Token", generic: 'Token<"in">' },
      { name: "values", type: "Punctuated", generic: "Punctuated<AstExpr>" },
      { name: "dokeyword", type: "Token", generic: 'Token<"do">' },
      { name: "body", type: "AstStatBlock" },
      { name: "endkeyword", type: "Token", generic: 'Token<"end">' },
    ],
  },

  AstStatAssign: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"assign"' },
      { name: "variables", type: "Punctuated", generic: "Punctuated<AstExpr>" },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "values", type: "Punctuated", generic: "Punctuated<AstExpr>" },
    ],
  },

  AstStatCompoundAssign: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"compoundassign"' },
      { name: "variable", type: "AstExpr" },
      { name: "operand", type: "Token" },
      { name: "value", type: "AstExpr" },
    ],
  },

  AstAttribute: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"attribute"' },
      { name: "text", type: ["@checked", "@native", "@deprecated"] },
    ],
  },

  AstStatFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"function"' },
      { name: "name", type: "AstExpr" },
      { name: "func", type: "AstExprFunction" },
    ],
  },

  AstStatLocalFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"localfunction"' },
      { name: "localkeyword", type: "Token", generic: 'Token<"local">' },
      { name: "name", type: "AstLocal" },
      { name: "func", type: "AstExprFunction" },
    ],
  },

  AstStatTypeAlias: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"typealias"' },
      {
        name: "export",
        type: "Token",
        generic: 'Token<"export">',
        optional: true,
      },
      { name: "typetoken", type: "Token", generic: 'Token<"type">' },
      { name: "name", type: "Token" },
      {
        name: "opengenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<AstGenericType>",
        optional: true,
      },
      {
        name: "genericpacks",
        type: "Punctuated",
        generic: "Punctuated<AstGenericTypePack>",
        optional: true,
      },
      {
        name: "closegenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "equals", type: "Token", generic: 'Token<"=">' },
      { name: "type", type: "AstType" },
    ],
  },

  AstStatTypeFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"stat"' },
      { name: "tag", type: '"typefunction"' },
      {
        name: "export",
        type: "Token",
        generic: 'Token<"export">',
        optional: true,
      },
      { name: "type", type: "Token", generic: 'Token<"type">' },
      { name: "name", type: "Token" },
      { name: "body", type: "AstExprFunction" },
    ],
  },

  AstStat: {
    unionMembers: [
      "AstStatBlock",
      "AstStatDo",
      "AstStatIf",
      "AstStatWhile",
      "AstStatRepeat",
      "AstStatBreak",
      "AstStatContinue",
      "AstStatReturn",
      "AstStatExpr",
      "AstStatLocal",
      "AstStatFor",
      "AstStatForIn",
      "AstStatAssign",
      "AstStatCompoundAssign",
      "AstStatFunction",
      "AstStatLocalFunction",
      "AstStatTypeAlias",
      "AstStatTypeFunction",
    ],
  },

  // === GENERIC TYPES ===
  AstGenericType: {
    properties: [
      { name: "tag", type: '"generic"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "default", type: "AstType", optional: true },
    ],
  },

  AstGenericTypePack: {
    properties: [
      { name: "tag", type: '"genericpack"' },
      { name: "name", type: "Token", generic: "Token<string>" },
      { name: "ellipsis", type: "Token", generic: 'Token<"...">' },
      { name: "equals", type: "Token", generic: 'Token<"=">', optional: true },
      { name: "default", type: "AstTypePack", optional: true },
    ],
  },

  // === TYPE SYSTEM ===
  AstTypeReference: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"reference"' },
      {
        name: "prefix",
        type: "Token",
        generic: "Token<string>",
        optional: true,
      },
      {
        name: "prefixpoint",
        type: "Token",
        generic: 'Token<".">',
        optional: true,
      },
      { name: "name", type: "Token", generic: "Token<string>" },
      {
        name: "openparameters",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<AstType | AstTypePack>",
        optional: true,
      },
      {
        name: "closeparameters",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
    ],
  },

  AstTypeSingletonBool: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"boolean"' },
      { name: "text", type: ["true", "false"] },
      { name: "value", type: "boolean" },
    ],
  },

  AstTypeSingletonString: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"string"' },
      { name: "text", type: "string" },
      { name: "quotestyle", type: ["single", "double"] },
    ],
  },

  AstTypeTypeof: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"typeof"' },
      { name: "typeof", type: "Token", generic: 'Token<"typeof">' },
      { name: "openparens", type: "Token", generic: 'Token<"(">' },
      { name: "expression", type: "AstExpr" },
      { name: "closeparens", type: "Token", generic: 'Token<")">' },
    ],
  },

  AstTypeGroup: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"group"' },
      { name: "openparens", type: "Token", generic: 'Token<"(">' },
      { name: "type", type: "AstType" },
      { name: "closeparens", type: "Token", generic: 'Token<")">' },
    ],
  },

  AstTypeOptional: {
    baseType: "Token",
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"optional"' },
      { name: "text", type: '"?"' },
    ],
  },

  AstTypeUnion: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"union"' },
      { name: "leading", type: "Token", generic: 'Token<"|">', optional: true },
      {
        name: "types",
        type: "Punctuated",
        generic: 'Punctuated<AstType, "|">',
      },
    ],
  },

  AstTypeIntersection: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"intersection"' },
      { name: "leading", type: "Token", generic: 'Token<"&">', optional: true },
      {
        name: "types",
        type: "Punctuated",
        generic: 'Punctuated<AstType, "&">',
      },
    ],
  },

  AstTypeArray: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"array"' },
      { name: "openbrace", type: "Token", generic: 'Token<"{">' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "type", type: "AstType" },
      { name: "closebrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  AstTypeTableItemIndexer: {
    properties: [
      { name: "kind", type: '"indexer"' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "indexeropen", type: "Token", generic: 'Token<"[">' },
      { name: "key", type: "AstType" },
      { name: "indexerclose", type: "Token", generic: 'Token<"]">' },
      { name: "colon", type: "Token", generic: 'Token<":">' },
      { name: "value", type: "AstType" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
    ],
  },

  AstTypeTableItemStringProperty: {
    properties: [
      { name: "kind", type: '"stringproperty"' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "indexeropen", type: "Token", generic: 'Token<"[">' },
      { name: "key", type: "AstTypeSingletonString" },
      { name: "indexerclose", type: "Token", generic: 'Token<"]">' },
      { name: "colon", type: "Token", generic: 'Token<":">' },
      { name: "value", type: "AstType" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
    ],
  },

  AstTypeTableItemProperty: {
    properties: [
      { name: "kind", type: '"property"' },
      {
        name: "access",
        type: "Token",
        generic: 'Token<"read" | "write">',
        optional: true,
      },
      { name: "key", type: "Token" },
      { name: "colon", type: "Token", generic: 'Token<":">' },
      { name: "value", type: "AstType" },
      {
        name: "separator",
        type: "Token",
        generic: 'Token<"," | ";">',
        optional: true,
      },
    ],
  },

  AstTypeTableItem: {
    unionMembers: [
      "AstTypeTableItemIndexer",
      "AstTypeTableItemStringProperty",
      "AstTypeTableItemProperty",
    ],
  },

  AstTypeTable: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"table"' },
      { name: "openbrace", type: "Token", generic: 'Token<"{">' },
      { name: "entries", type: "{ AstTypeTableItem }" },
      { name: "closebrace", type: "Token", generic: 'Token<"}">' },
    ],
  },

  AstTypeFunctionParameter: {
    properties: [
      { name: "location", type: "span" },
      { name: "name", type: "Token", optional: true },
      { name: "colon", type: "Token", generic: 'Token<":">', optional: true },
      { name: "type", type: "AstType" },
    ],
  },

  AstTypeFunction: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"type"' },
      { name: "tag", type: '"function"' },
      {
        name: "opengenerics",
        type: "Token",
        generic: 'Token<"<">',
        optional: true,
      },
      {
        name: "generics",
        type: "Punctuated",
        generic: "Punctuated<AstGenericType>",
        optional: true,
      },
      {
        name: "genericpacks",
        type: "Punctuated",
        generic: "Punctuated<AstGenericTypePack>",
        optional: true,
      },
      {
        name: "closegenerics",
        type: "Token",
        generic: 'Token<">">',
        optional: true,
      },
      { name: "openparens", type: "Token", generic: 'Token<"(">' },
      {
        name: "parameters",
        type: "Punctuated",
        generic: "Punctuated<AstTypeFunctionParameter>",
      },
      { name: "vararg", type: "AstTypePack", optional: true },
      { name: "closeparens", type: "Token", generic: 'Token<")">' },
      { name: "returnarrow", type: "Token", generic: 'Token<"->">' },
      { name: "returntypes", type: "AstTypePack" },
    ],
  },

  AstType: {
    unionMembers: [
      "AstTypeReference",
      "AstTypeSingletonBool",
      "AstTypeSingletonString",
      "AstTypeTypeof",
      "AstTypeGroup",
      "AstTypeUnion",
      "AstTypeIntersection",
      "AstTypeOptional",
      "AstTypeArray",
      "AstTypeTable",
      "AstTypeFunction",
    ],
  },

  // === TYPE PACKS ===
  AstTypePackExplicit: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"explicit"' },
      {
        name: "openparens",
        type: "Token",
        generic: 'Token<"(">',
        optional: true,
      },
      { name: "types", type: "Punctuated", generic: "Punctuated<AstType>" },
      { name: "tailtype", type: "AstTypePack", optional: true },
      {
        name: "closeparens",
        type: "Token",
        generic: 'Token<")">',
        optional: true,
      },
    ],
  },

  AstTypePackGeneric: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"generic"' },
      { name: "name", type: "Token" },
      { name: "ellipsis", type: "Token", generic: 'Token<"...">' },
    ],
  },

  AstTypePackVariadic: {
    properties: [
      { name: "location", type: "span" },
      { name: "kind", type: '"typepack"' },
      { name: "tag", type: '"variadic"' },
      {
        name: "ellipsis",
        type: "Token",
        generic: 'Token<"...">',
        optional: true,
      },
      { name: "type", type: "AstType" },
    ],
  },

  AstTypePack: {
    unionMembers: [
      "AstTypePackExplicit",
      "AstTypePackGeneric",
      "AstTypePackVariadic",
    ],
  },

  _testType: {
    properties: [
      { name: "removedName", type: "Token", optional: true },
      { name: "name", type: "Token", optional: true },
    ],
  },
};

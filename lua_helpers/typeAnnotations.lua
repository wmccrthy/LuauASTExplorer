--[[
	Module that serves as reference for Luau AST types so we can annotate the AST with type information
	This is all based directly on Luau AST type definitions from Lute
	Updated to match latest Lute AST structure (camelCase property names, kind field, etc.)
]]

local typeDefinitions = {
	-- Tag-based mappings
	-- Note: many types now also have a 'kind' field (expr, stat, type, typepack, local, attribute)
	tags = {
		-- Trivia
		["whitespace"] = "Whitespace",
		["comment"] = "SingleLineComment",
		["blockcomment"] = "MultiLineComment",
		["eof"] = "Eof",

		-- Expressions (kind: "expr")
		["nil"] = "CstExprConstantNil",
		["boolean"] = "CstExprConstantBool", -- also CstTypeSingletonBool - disambiguated by kind
		["number"] = "CstExprConstantNumber",
		["global"] = "CstExprGlobal",
		["vararg"] = "CstExprVarargs",
		["call"] = "CstExprCall",
		["instantiate"] = "CstExprInstantiate",
		["indexname"] = "CstExprIndexName",
		["index"] = "CstExprIndexExpr",
		["unary"] = "CstExprUnary",
		["binary"] = "CstExprBinary",
		["interpolatedstring"] = "CstExprInterpString",
		["cast"] = "CstExprTypeAssertion",

		-- Statements (kind: "stat")
		["block"] = "CstStatBlock",
		["do"] = "CstStatDo",
		["while"] = "CstStatWhile",
		["repeat"] = "CstStatRepeat",
		["break"] = "CstStatBreak",
		["continue"] = "CstStatContinue",
		["return"] = "CstStatReturn",
		["expression"] = "CstStatExpr",
		["assign"] = "CstStatAssign",
		["for"] = "CstStatFor",
		["forin"] = "CstStatForIn",
		["compoundassign"] = "CstStatCompoundAssign",
		["const"] = "CstStatConst",
		["localfunction"] = "CstStatLocalFunction",
		["typealias"] = "CstStatTypeAlias",
		["typefunction"] = "CstStatTypeFunction",

		-- Types (kind: "type")
		["reference"] = "CstTypeReference",
		["typeof"] = "CstTypeTypeof",
		["union"] = "CstTypeUnion",
		["intersection"] = "CstTypeIntersection",
		["optional"] = "CstTypeOptional",
		["array"] = "CstTypeArray",

		-- Type packs (kind: "typepack")
		["explicit"] = "CstTypePackExplicit",
		["variadic"] = "CstTypePackVariadic",

		-- Generic types (no kind field)
		["generic"] = "CstGenericType", -- also CstTypePackGeneric - disambiguated by ellipsis
		["genericpack"] = "CstGenericTypePack",
	},

	-- Key-based mappings (fallback when tag is not present)
	-- Updated to use camelCase property names
	keys = {
		-- Span fields
		["beginLine"] = "number",
		["beginColumn"] = "number",
		["endLine"] = "number",
		["endColumn"] = "number",
		["argLocation"] = "span",
		["indexLocation"] = "span",

		-- Common token properties (fallback to Token)
		["functionKeyword"] = "Token",
		["localKeyword"] = "Token",
		["constKeyword"] = "Token",
		["ifKeyword"] = "Token",
		["thenKeyword"] = "Token",
		["elseKeyword"] = "Token",
		["elseIfKeyword"] = "Token",
		["endKeyword"] = "Token",
		["whileKeyword"] = "Token",
		["doKeyword"] = "Token",
		["forKeyword"] = "Token",
		["inKeyword"] = "Token",
		["repeatKeyword"] = "Token",
		["untilKeyword"] = "Token",
		["returnKeyword"] = "Token",
		["export"] = "Token",
		["typeToken"] = "Token",
		["typeof"] = "Token",

		-- Punctuation tokens
		["openParens"] = "Token",
		["closeParens"] = "Token",
		["openBrace"] = "Token",
		["closeBrace"] = "Token",
		["openBrackets"] = "Token",
		["closeBrackets"] = "Token",
		["openGenerics"] = "Token",
		["closeGenerics"] = "Token",
		["openParameters"] = "Token",
		["closeParameters"] = "Token",
		["indexerOpen"] = "Token",
		["indexerClose"] = "Token",
		["returnSpecifier"] = "Token",

		-- Operators and symbols
		["equals"] = "Token",
		["colon"] = "Token",
		["semicolon"] = "Token",
		["comma"] = "Token",
		["accessor"] = "Token",
		["operator"] = "Token",
		["ellipsis"] = "Token",
		["varargColon"] = "Token",
		["toComma"] = "Token",
		["stepComma"] = "Token",
		["prefixPoint"] = "Token",
		["leadingTrivia"] = "Token",
		["access"] = "Token",
		["separator"] = "Token",

		-- Special names/identifiers
		["token"] = "Token",

		-- Expression/Statement specific
		["expression"] = "CstExpr",
		["func"] = "CstExprFunction",
		["condition"] = "CstExpr",
		["from"] = "CstExpr",
		["to"] = "CstExpr",
		["step"] = "CstExpr",
		["lhsOperand"] = "CstExpr",
		["rhsOperand"] = "CstExpr",
		["thenExpr"] = "CstExpr",
		["elseExpr"] = "CstExpr",

		-- Block references
		["thenBlock"] = "CstStatBlock",
		["elseBlock"] = "CstStatBlock",

		-- Variables and locals
		["local"] = "CstLocal",
		["shadows"] = "CstLocal",

		-- Type system
		["annotation"] = "CstType",
		["varargAnnotation"] = "CstTypePack",
		["returnAnnotation"] = "CstTypePack",
		["returnTypes"] = "CstTypePack",
		["tailType"] = "CstTypePack",

		-- Special properties
		["text"] = "string",
		["upvalue"] = "boolean",
		["quoteStyle"] = "string",
		["blockDepth"] = "number",
		["isTableItem"] = "boolean",

		-- ParseResult specific
		["root"] = "CstStatBlock",
		["eof"] = "Eof",
		["lines"] = "number",
	},

	-- Kind-based mappings for table items and other kinded structures
	kinds = {
		-- Expression table items (isTableItem: true)
		["record"] = "CstTableExprRecordItem",
		["general"] = "CstTableExprGeneralItem",
		["list"] = "CstTableExprListItem",

		-- Type table items
		["property"] = "CstTableTypeItemProperty",
		["indexer"] = "CstTableTypeItemIndexer",
		["stringproperty"] = "CstTableTypeItemStringProperty",

		-- CstLocal
		["local"] = "CstLocal",

		-- Attribute
		["attribute"] = "CstAttribute",
	},
}

-- Context-aware type resolution for ambiguous tags
local function resolveAmbiguousTags(node): string?
	local tag = node.tag
	if not tag then
		return nil
	end

	-- Use 'kind' field for disambiguation when available
	local kind = node.kind

	-- Handle ambiguous cases based on distinguishing properties
	if tag == "conditional" then
		-- CstStatIf has endKeyword and kind="stat", CstExprIfElse has kind="expr"
		if kind == "stat" or node.endKeyword then
			return "CstStatIf"
		else
			return "CstExprIfElse"
		end
	elseif tag == "function" then
		-- CstTypeFunction has returnSpecifier and kind="type"
		if kind == "type" or node.returnSpecifier then
			return "CstTypeFunction"
		-- CstStatFunction has name field and kind="stat" (but not func field directly on it)
		elseif kind == "stat" then
			return "CstStatFunction"
		else
			-- CstExprFunction (consolidated from old CstExprAnonymousFunction + CstFunctionBody)
			return "CstExprFunction"
		end
	elseif tag == "group" then
		-- CstExprGroup has expression and kind="expr", CstTypeGroup has type and kind="type"
		if kind == "type" or node.type then
			return "CstTypeGroup"
		else
			return "CstExprGroup"
		end
	elseif tag == "local" then
		-- CstExprLocal has token/upvalue and kind="expr", CstStatLocal has localKeyword and kind="stat"
		if kind == "expr" or (node.token and node.upvalue ~= nil) then
			return "CstExprLocal"
		elseif kind == "stat" or (node.localKeyword and node.variables) then
			return "CstStatLocal"
		end
	elseif tag == "generic" then
		-- CstTypePackGeneric has ellipsis and kind="typepack", CstGenericType doesn't
		if kind == "typepack" or node.ellipsis then
			return "CstTypePackGeneric"
		else
			return "CstGenericType"
		end
	elseif tag == "table" then
		-- AstTypeTable has kind="type", AstExprTable has kind="expr"
		if kind == "type" then
			return "CstTypeTable"
		elseif kind == "expr" then
			return "CstExprTable"
		end
		-- Fallback heuristic
		if node.entries and #node.entries > 0 then
			local firstEntry = node.entries[1]
			if firstEntry and firstEntry.isTableItem then
				return "CstExprTable"
			end
		end
		return "CstExprTable" -- Default to expression table
	elseif tag == "string" then
		-- AstTypeSingletonString has kind="type", AstExprConstantString has kind="expr"
		if kind == "type" then
			return "CstTypeSingletonString"
		elseif kind == "expr" then
			return "CstExprConstantString"
		end
		-- Fallback: expression strings can have block/interp quoteStyle
		if node.quoteStyle == "block" or node.quoteStyle == "interp" or node.blockDepth then
			return "CstExprConstantString"
		else
			return "CstTypeSingletonString"
		end
	elseif tag == "boolean" then
		-- AstTypeSingletonBool has kind="type", AstExprConstantBool has kind="expr"
		if kind == "type" then
			return "CstTypeSingletonBool"
		else
			return "CstExprConstantBool"
		end
	end

	-- Fallback to original mapping if no disambiguation needed
	return typeDefinitions.tags[tag]
end

local function resolveAmbiguousKeys(nodeKey, node, parentNode: any?): string?
	-- Handle 'kind' field specially - it's a discriminator, not a type
	if nodeKey == "kind" then
		return nil -- Don't annotate the kind field itself
	end

	-- Ambiguous keys that need context-aware resolution:
	if nodeKey == "body" then
		-- AstStatBlock vs AstExprFunction (for AstStatTypeFunction) vs { AstStat } for AstStatDo
		if node.functionKeyword and node.openParens then
			-- This is AstExprFunction (used in AstStatTypeFunction.body)
			return "CstExprFunction"
		elseif node.statements then
			return "CstStatBlock"
		else
			return nil -- Array of statements for AstStatDo
		end
	elseif nodeKey == "name" then
		-- Token vs AstExpr vs AstLocal
		if node.kind == "token" or node.text then
			return "Token"
		elseif node.kind == "local" or node.name then
			return "CstLocal"
		else
			return "CstExpr"
		end
	elseif nodeKey == "value" then
		-- boolean vs number vs AstExpr vs AstType
		if parentNode.colon then
			return "CstType"
		elseif parentNode.isTableItem or parentNode.operand then
			return "CstExpr"
		else
			return if parentNode.tag == "boolean" then "boolean" else "number"
		end
	elseif nodeKey == "key" then
		-- Token vs AstExpr vs AstType vs AstTypeSingletonString
		local kind = parentNode.kind
		if kind == "record" then
			return "Token"
		elseif kind == "general" then
			return "CstExpr"
		elseif kind == "indexer" then
			return "CstType"
		elseif kind == "stringproperty" then
			return "CstTypeSingletonString"
		elseif kind == "property" then
			return "Token"
		end
	elseif nodeKey == "operand" then
		-- AstExpr vs Token
		if parentNode.operator and parentNode.tag then
			return "CstExpr"
		else
			return "Token"
		end
	elseif nodeKey == "variable" then
		-- CstLocal vs AstExpr
		if parentNode.equals and parentNode.from then
			return "CstLocal"
		else
			return "CstExpr"
		end
	elseif nodeKey == "type" then
		-- AstType vs Token
		if parentNode.functionKeyword and parentNode.tag == "typefunction" then
			return "Token"
		else
			return "CstType"
		end
	elseif nodeKey == "default" then
		-- AstType vs AstTypePack
		if parentNode.ellipsis then
			return "CstTypePack"
		else
			return "CstType"
		end
	elseif nodeKey == "self" then
		-- boolean vs AstLocal
		if parentNode.tag then
			return "boolean"
		else
			return "CstLocal"
		end
	elseif nodeKey == "index" then
		-- Token vs AstExpr
		if parentNode.accessor then
			return "Token"
		else
			return "CstExpr"
		end
	elseif nodeKey == "prefix" then
		-- Token
		return "Token"
	end

	-- Fallback to original key mapping
	return typeDefinitions.keys[nodeKey]
end

local function annotateWithType(node, nodeKey: (string | number)?, parent: any?, parentKey: (string | number)?)
	if type(node) ~= "table" then
		return node
	end

	-- Lute AST nodes can be readonly in newer versions; avoid in-place mutation by
	-- copying before annotating.
	local annotatedNode = table.clone(node)

	local astType: string?

	-- Priority 1: Check for 'kind' field for direct type mapping (local, attribute)
	if annotatedNode.kind == "local" and not annotatedNode.tag then
		astType = "CstLocal"
	elseif annotatedNode.kind == "attribute" then
		astType = "CstAttribute"

		-- Priority 2: Context-aware tag-based type resolution
	elseif annotatedNode.tag then
		astType = resolveAmbiguousTags(annotatedNode)

		-- Priority 3: Check for 'kind' field for table items
	elseif annotatedNode.kind and annotatedNode.isTableItem then
		astType = typeDefinitions.kinds[annotatedNode.kind]
	elseif annotatedNode.kind and (annotatedNode.key or annotatedNode.indexerOpen) then
		-- Type table items
		astType = typeDefinitions.kinds[annotatedNode.kind]

		-- Priority 4: Check for kind="token" marker
	elseif annotatedNode.kind == "token" then
		astType = "Token"

		-- Priority 5: Key-based type resolution (fallback)
	elseif nodeKey then
		astType = resolveAmbiguousKeys(nodeKey, annotatedNode, parent)

		-- Priority 6: Generic token detection
	elseif nodeKey and nodeKey:match("keyword$") then
		-- Any property ending in "keyword" is probably a token
		astType = "Token"
	elseif nodeKey and (nodeKey:match("^open") or nodeKey:match("^close")) then
		-- Properties like openParens, closeBrace, etc.
		astType = "Token"
	end

	-- Add type annotation (skip arrays to avoid JSON encoding issues)
	if astType and not (#annotatedNode > 0) then
		annotatedNode._astType = astType
	end

	-- Recursively annotate children, passing key context
	for key, value in annotatedNode do
		if key ~= "_astType" then
			annotatedNode[key] =
				annotateWithType(value, if typeof(key) == "string" then key else tostring(key), annotatedNode, nodeKey)
		end
	end
	return annotatedNode
end

return {
	annotateWithType = annotateWithType,
	resolveAmbiguousTags = resolveAmbiguousTags,
	resolveAmbiguousKeys = resolveAmbiguousKeys,
}

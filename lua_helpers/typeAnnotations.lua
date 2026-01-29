--[[
	Module that serves as reference for Luau AST types so we can annotate the AST with type information
	This is all based directly on Luau AST type definitions from Lute
	Updated to match latest Lute AST structure (lowercase property names, kind field, etc.)
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
		["nil"] = "AstExprConstantNil",
		["boolean"] = "AstExprConstantBool", -- also AstTypeSingletonBool - disambiguated by kind
		["number"] = "AstExprConstantNumber",
		["global"] = "AstExprGlobal",
		["vararg"] = "AstExprVarargs",
		["call"] = "AstExprCall",
		["indexname"] = "AstExprIndexName",
		["index"] = "AstExprIndexExpr",
		["unary"] = "AstExprUnary",
		["binary"] = "AstExprBinary",
		["interpolatedstring"] = "AstExprInterpString",
		["cast"] = "AstExprTypeAssertion",

		-- Statements (kind: "stat")
		["block"] = "AstStatBlock",
		["do"] = "AstStatDo",
		["while"] = "AstStatWhile",
		["repeat"] = "AstStatRepeat",
		["break"] = "AstStatBreak",
		["continue"] = "AstStatContinue",
		["return"] = "AstStatReturn",
		["expression"] = "AstStatExpr",
		["assign"] = "AstStatAssign",
		["for"] = "AstStatFor",
		["forin"] = "AstStatForIn",
		["compoundassign"] = "AstStatCompoundAssign",
		["localfunction"] = "AstStatLocalFunction",
		["typealias"] = "AstStatTypeAlias",
		["typefunction"] = "AstStatTypeFunction",

		-- Types (kind: "type")
		["reference"] = "AstTypeReference",
		["typeof"] = "AstTypeTypeof",
		["union"] = "AstTypeUnion",
		["intersection"] = "AstTypeIntersection",
		["optional"] = "AstTypeOptional",
		["array"] = "AstTypeArray",

		-- Type packs (kind: "typepack")
		["explicit"] = "AstTypePackExplicit",
		["variadic"] = "AstTypePackVariadic",

		-- Generic types (no kind field)
		["generic"] = "AstGenericType", -- also AstTypePackGeneric - disambiguated by ellipsis
		["genericpack"] = "AstGenericTypePack",
	},

	-- Key-based mappings (fallback when tag is not present)
	-- Updated to use lowercase property names
	keys = {
		-- Span fields (replaces Location/Position)
		["beginline"] = "number",
		["begincolumn"] = "number",
		["endline"] = "number",
		["endcolumn"] = "number",
		["argLocation"] = "span",
		["indexlocation"] = "span",

		-- Common token properties (fallback to Token)
		["functionkeyword"] = "Token",
		["localkeyword"] = "Token",
		["ifkeyword"] = "Token",
		["thenkeyword"] = "Token",
		["elsekeyword"] = "Token",
		["elseifkeyword"] = "Token",
		["endkeyword"] = "Token",
		["whilekeyword"] = "Token",
		["dokeyword"] = "Token",
		["forkeyword"] = "Token",
		["inkeyword"] = "Token",
		["repeatkeyword"] = "Token",
		["untilkeyword"] = "Token",
		["returnkeyword"] = "Token",
		["export"] = "Token",
		["typetoken"] = "Token",
		["typeof"] = "Token",

		-- Punctuation tokens
		["openparens"] = "Token",
		["closeparens"] = "Token",
		["openbrace"] = "Token",
		["closebrace"] = "Token",
		["openbrackets"] = "Token",
		["closebrackets"] = "Token",
		["opengenerics"] = "Token",
		["closegenerics"] = "Token",
		["openparameters"] = "Token",
		["closeparameters"] = "Token",
		["indexeropen"] = "Token",
		["indexerclose"] = "Token",
		["returnarrow"] = "Token",

		-- Operators and symbols
		["equals"] = "Token",
		["colon"] = "Token",
		["semicolon"] = "Token",
		["comma"] = "Token",
		["accessor"] = "Token",
		["operator"] = "Token",
		["ellipsis"] = "Token",
		["varargcolon"] = "Token",
		["returnspecifier"] = "Token",
		["tocomma"] = "Token",
		["stepcomma"] = "Token",
		["prefixpoint"] = "Token",
		["leading"] = "Token",
		["access"] = "Token",
		["separator"] = "Token",

		-- Special names/identifiers
		["token"] = "Token",

		-- Expression/Statement specific
		["expression"] = "AstExpr",
		["func"] = "AstExpr",
		["condition"] = "AstExpr",
		["from"] = "AstExpr",
		["to"] = "AstExpr",
		["step"] = "AstExpr",
		["lhsoperand"] = "AstExpr",
		["rhsoperand"] = "AstExpr",
		["thenexpr"] = "AstExpr",
		["elseexpr"] = "AstExpr",

		-- Block references
		["thenblock"] = "AstStatBlock",
		["elseblock"] = "AstStatBlock",

		-- Variables and locals
		["local"] = "AstLocal",
		["shadows"] = "AstLocal",

		-- Type system
		["annotation"] = "AstType",
		["varargannotation"] = "AstTypePack",
		["returnannotation"] = "AstTypePack",
		["returntypes"] = "AstTypePack",
		["tailtype"] = "AstTypePack",

		-- Special properties
		["text"] = "string",
		["upvalue"] = "boolean",
		["quotestyle"] = "string",
		["blockdepth"] = "number",
		["istoken"] = "boolean",
		["istableitem"] = "boolean",

		-- ParseResult specific
		["root"] = "AstStatBlock",
		["eof"] = "Eof",
		["lines"] = "number",
	},

	-- Kind-based mappings for table items and other kinded structures
	kinds = {
		-- Expression table items (istableitem: true)
		["record"] = "AstExprTableItemRecord",
		["general"] = "AstExprTableItemGeneral",
		["list"] = "AstExprTableItemList",

		-- Type table items
		["property"] = "AstTypeTableItemProperty",
		["indexer"] = "AstTypeTableItemIndexer",
		["stringproperty"] = "AstTypeTableItemStringProperty",

		-- AstLocal
		["local"] = "AstLocal",

		-- Attribute
		["attribute"] = "AstAttribute",
	},
}

-- Context-aware type resolution for ambiguous tags
local function resolveAmbiguousTags(node)
	local tag = node.tag
	if not tag then
		return nil
	end

	-- Use 'kind' field for disambiguation when available
	local kind = node.kind

	-- Handle ambiguous cases based on distinguishing properties
	if tag == "conditional" then
		-- AstStatIf has endkeyword and kind="stat", AstExprIfElse has kind="expr"
		if kind == "stat" or node.endkeyword then
			return "AstStatIf"
		else
			return "AstExprIfElse"
		end
	elseif tag == "function" then
		-- AstTypeFunction has returnarrow and kind="type"
		if kind == "type" or node.returnarrow then
			return "AstTypeFunction"
		-- AstStatFunction has name and kind="stat"
		elseif kind == "stat" or node.name then
			return "AstStatFunction"
		else
			return "AstExprAnonymousFunction"
		end
	elseif tag == "group" then
		-- AstExprGroup has expression and kind="expr", AstTypeGroup has type and kind="type"
		if kind == "type" or node.type then
			return "AstTypeGroup"
		else
			return "AstExprGroup"
		end
	elseif tag == "local" then
		-- AstExprLocal has token/upvalue and kind="expr", AstStatLocal has localkeyword and kind="stat"
		if kind == "expr" or (node.token and node.upvalue ~= nil) then
			return "AstExprLocal"
		elseif kind == "stat" or (node.localkeyword and node.variables) then
			return "AstStatLocal"
		end
	elseif tag == "generic" then
		-- AstTypePackGeneric has ellipsis and kind="typepack", AstGenericType doesn't
		if kind == "typepack" or node.ellipsis then
			return "AstTypePackGeneric"
		else
			return "AstGenericType"
		end
	elseif tag == "table" then
		-- AstTypeTable has kind="type", AstExprTable has kind="expr"
		if kind == "type" then
			return "AstTypeTable"
		elseif kind == "expr" then
			return "AstExprTable"
		end
		-- Fallback heuristic
		if node.entries and #node.entries > 0 then
			local firstEntry = node.entries[1]
			if firstEntry and firstEntry.istableitem then
				return "AstExprTable"
			end
		end
		return "AstExprTable" -- Default to expression table
	elseif tag == "string" then
		-- AstTypeSingletonString has kind="type", AstExprConstantString has kind="expr"
		if kind == "type" then
			return "AstTypeSingletonString"
		elseif kind == "expr" then
			return "AstExprConstantString"
		end
		-- Fallback: expression strings can have block/interp quotestyle
		if node.quotestyle == "block" or node.quotestyle == "interp" or node.blockdepth then
			return "AstExprConstantString"
		else
			return "AstTypeSingletonString"
		end
	elseif tag == "boolean" then
		-- AstTypeSingletonBool has kind="type", AstExprConstantBool has kind="expr"
		if kind == "type" then
			return "AstTypeSingletonBool"
		else
			return "AstExprConstantBool"
		end
	end

	-- Fallback to original mapping if no disambiguation needed
	return typeDefinitions.tags[tag]
end

local function resolveAmbiguousKeys(nodeKey, node, parentNode, parentKey)
	-- Handle 'kind' field specially - it's a discriminator, not a type
	if nodeKey == "kind" then
		return nil -- Don't annotate the kind field itself
	end

	-- Ambiguous keys that need context-aware resolution:
	if nodeKey == "body" then
		-- AstStatBlock vs AstFunctionBody vs { AstStat } for AstStatDo
		if node.openparens then
			return "AstFunctionBody"
		elseif node.statements then
			return "AstStatBlock"
		else
			return nil -- Array of statements for AstStatDo
		end
	elseif nodeKey == "name" then
		-- Token vs AstExpr vs AstLocal
		if node.istoken or node.text then
			return "Token"
		elseif node.kind == "local" or node.name then
			return "AstLocal"
		else
			return "AstExpr"
		end
	elseif nodeKey == "value" then
		-- boolean vs number vs AstExpr vs AstType
		if parentNode.colon then
			return "AstType"
		elseif parentNode.istableitem or parentNode.operand then
			return "AstExpr"
		else
			return if parentNode.tag == "boolean" then "boolean" else "number"
		end
	elseif nodeKey == "key" then
		-- Token vs AstExpr vs AstType vs AstTypeSingletonString
		local kind = parentNode.kind
		if kind == "record" then
			return "Token"
		elseif kind == "general" then
			return "AstExpr"
		elseif kind == "indexer" then
			return "AstType"
		elseif kind == "stringproperty" then
			return "AstTypeSingletonString"
		elseif kind == "property" then
			return "Token"
		end
	elseif nodeKey == "operand" then
		-- AstExpr vs Token
		if parentNode.operator and parentNode.tag then
			return "AstExpr"
		else
			return "Token"
		end
	elseif nodeKey == "variable" then
		-- AstLocal vs AstExpr
		if parentNode.equals and parentNode.from then
			return "AstLocal"
		else
			return "AstExpr"
		end
	elseif nodeKey == "type" then
		-- AstType vs Token
		if parentNode.functionkeyword and parentNode.tag == "typefunction" then
			return "Token"
		else
			return "AstType"
		end
	elseif nodeKey == "default" then
		-- AstType vs AstTypePack
		if parentNode.ellipsis then
			return "AstTypePack"
		else
			return "AstType"
		end
	elseif nodeKey == "self" then
		-- boolean vs AstLocal
		if parentNode.tag then
			return "boolean"
		else
			return "AstLocal"
		end
	elseif nodeKey == "index" then
		-- Token vs AstExpr
		if parentNode.accessor then
			return "Token"
		else
			return "AstExpr"
		end
	elseif nodeKey == "prefix" then
		-- Token
		return "Token"
	end

	-- Fallback to original key mapping
	return typeDefinitions.keys[nodeKey]
end

local function annotateWithType(node, nodeKey, parent, parentKey)
	if type(node) ~= "table" then
		return node
	end

	local astType = nil

	-- Priority 1: Check for 'kind' field for direct type mapping (local, attribute)
	if node.kind == "local" and not node.tag then
		astType = "AstLocal"
	elseif node.kind == "attribute" then
		astType = "AstAttribute"

	-- Priority 2: Context-aware tag-based type resolution
	elseif node.tag then
		astType = resolveAmbiguousTags(node)

	-- Priority 3: Check for 'kind' field for table items
	elseif node.kind and node.istableitem then
		astType = typeDefinitions.kinds[node.kind]
	elseif node.kind and (node.key or node.indexeropen) then
		-- Type table items
		astType = typeDefinitions.kinds[node.kind]

	-- Priority 4: Check for istoken marker
	elseif node.istoken then
		astType = "Token"

	-- Priority 5: Key-based type resolution (fallback)
	elseif nodeKey then
		astType = resolveAmbiguousKeys(nodeKey, node, parent, parentKey)

	-- Priority 6: Generic token detection
	elseif nodeKey and nodeKey:match("keyword$") then
		-- Any property ending in "keyword" is probably a token
		astType = "Token"
	elseif nodeKey and (nodeKey:match("^open") or nodeKey:match("^close")) then
		-- Properties like openparens, closebrace, etc.
		astType = "Token"
	end

	-- Add type annotation (skip arrays to avoid JSON encoding issues)
	if astType and not (#node > 0) then
		node._astType = astType
	end

	-- Recursively annotate children, passing key context
	for key, value in pairs(node) do
		if key ~= "_astType" then
			node[key] = annotateWithType(value, if typeof(key) == "string" then key else tostring(key), node, nodeKey)
		end
	end
	return node
end

return {
	annotateWithType = annotateWithType,
	resolveAmbiguousTags = resolveAmbiguousTags,
	resolveAmbiguousKeys = resolveAmbiguousKeys,
}

--[[
Module that serves as reference for Luau AST types so we can annotate the AST with type information
]]

local typeDefinitions = {
	-- Tag-based mappings (existing)
	tags = {
		["group"] = "AstExprGroup",
		["nil"] = "AstExprConstantNil",
		["boolean"] = "AstExprConstantBool",
		["number"] = "AstExprConstantNumber",
		["string"] = "AstExprConstantString",
		["local"] = "AstExprLocal",
		["global"] = "AstExprGlobal",
		["vararg"] = "AstExprVarargs",
		["call"] = "AstExprCall",
		["indexname"] = "AstExprIndexName",
		["index"] = "AstExprIndexExpr",
		["function"] = "AstExprAnonymousFunction",
		["table"] = "AstExprTable",
		["unary"] = "AstExprUnary",
		["binary"] = "AstExprBinary",

		-- Statements
		["block"] = "AstStatBlock",
		["conditional"] = "AstStatIf", -- Note: also used for AstExprIfElse
		["while"] = "AstStatWhile",
		["repeat"] = "AstStatRepeat",
		["break"] = "AstStatBreak",
		["continue"] = "AstStatContinue",
		["return"] = "AstStatReturn",
		["expression"] = "AstStatExpr",
		["assign"] = "AstStatAssign",
		["for"] = "AstStatFor",
		["forin"] = "AstStatForIn",

		-- Types
		["reference"] = "AstTypeReference",
		["typeof"] = "AstTypeTypeof",
		["union"] = "AstTypeUnion",
		["intersection"] = "AstTypeIntersection",

		-- Special cases
		["whitespace"] = "Whitespace",
		["comment"] = "SingleLineComment",
		["blockcomment"] = "MultiLineComment",
	},

	-- Key-based mappings (new fallback)
	keys = {
		-- Location and position
		["location"] = "Location",
		["position"] = "Position",
		["argLocation"] = "Location",
		["indexLocation"] = "Location",

		-- Common token properties (fallback to Token)
		["functionKeyword"] = 'Token',
		["localKeyword"] = 'Token',
		["ifKeyword"] = 'Token',
		["thenKeyword"] = 'Token',
		["elseKeyword"] = 'Token',
		["elseifKeyword"] = 'Token',
		["endKeyword"] = 'Token',
		["whileKeyword"] = 'Token',
		["doKeyword"] = 'Token',
		["forKeyword"] = 'Token',
		["inKeyword"] = 'Token',
		["repeatKeyword"] = 'Token',
		["untilKeyword"] = 'Token',
		["returnKeyword"] = 'Token',
		["breakKeyword"] = 'Token',
		["continueKeyword"] = 'Token',

		-- Punctuation tokens
		["openParens"] = 'Token',
		["closeParens"] = 'Token',
		["openBrace"] = 'Token',
		["closeBrace"] = 'Token',
		["openBrackets"] = 'Token',
		["closeBrackets"] = 'Token',
		["openGenerics"] = 'Token',
		["closeGenerics"] = 'Token',

		-- Operators and symbols
		["equals"] = 'Token',
		["colon"] = 'Token',
		["semicolon"] = 'Token',
		["comma"] = 'Token',
		["accessor"] = 'Token',
		["operator"] = "Token",
		["ellipsis"] = 'Token',

		-- Special names/identifiers
		["name"] = 'Token',
		["token"] = "Token",
	},
}

local function annotateWithType(node, nodeKey)
    if type(node) ~= "table" then
        return node
    end
    
    local astType = nil
    
    -- Priority 1: Tag-based type resolution
    if node.tag and typeDefinitions.tags[node.tag] then
        astType = typeDefinitions.tags[node.tag]
    
    -- Priority 2: Key-based type resolution (fallback)
    elseif nodeKey and typeDefinitions.keys[nodeKey] then
        astType = typeDefinitions.keys[nodeKey]
    
    -- Priority 3: Generic token detection
    elseif nodeKey and nodeKey:match("Keyword$") then
        -- Any property ending in "Keyword" is probably a token
        astType = "Token"
    elseif nodeKey and (nodeKey:match("^open") or nodeKey:match("^close")) then
        -- Properties like openParen, closeBrace, etc.
        astType = "Token"
    end
    
    -- Add type annotation
    if astType then
        node._astType = astType
    end
    
    -- Recursively annotate children, passing key context
    for key, value in pairs(node) do
        if key ~= "_astType" then
            node[key] = annotateWithType(value, if typeof(key) == "string" then key else tostring(key))
        end
    end
    return node
end

return {
    annotateWithType = annotateWithType,
}

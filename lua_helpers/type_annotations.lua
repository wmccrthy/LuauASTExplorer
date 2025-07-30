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

-- Context-aware type resolution for ambiguous tags
local function resolveAmbiguousType(node)
    local tag = node.tag
    if not tag then return nil end
    
    -- Handle ambiguous cases based on distinguishing properties
    if tag == "conditional" then
        -- AstStatIf has endKeyword, AstExprIfElse doesn't
        if node.endKeyword then
            return "AstStatIf"
        else
            return "AstExprIfElse"  
        end
        
    elseif tag == "function" then
        -- AstTypeFunction has returnArrow
        if node.returnArrow then
            return "AstTypeFunction"
        -- AstStatFunction has name, AstExprAnonymousFunction doesn't  
        elseif node.name then
            return "AstStatFunction"
        else
            return "AstExprAnonymousFunction"
        end
        
    elseif tag == "group" then
        -- AstExprGroup has expression, AstTypeGroup has type
        if node.expression then
            return "AstExprGroup"
        elseif node.type then
            return "AstTypeGroup"
        end
        
    elseif tag == "local" then
        -- AstExprLocal has token/upvalue, AstStatLocal has localKeyword/variables
        if node.token and node.upvalue ~= nil then
            return "AstExprLocal"
        elseif node.localKeyword and node.variables then
            return "AstStatLocal"
        end
        
    elseif tag == "generic" then
        -- AstTypePackGeneric has ellipsis, AstGenericType doesn't
        if node.ellipsis then
            return "AstTypePackGeneric"
        else
            return "AstGenericType"
        end
        
    elseif tag == "table" then
        -- Both are similar, but we can check entry types or assume context
        -- For now, try to distinguish by checking if we're in a type context
        -- This is a heuristic - could be improved with better context analysis
        if node.entries and #node.entries > 0 then
            -- Check first entry structure for type-like patterns
            local firstEntry = node.entries[1]
            if firstEntry and (firstEntry.colon or firstEntry.key) then
                return "AstTypeTable"  -- More likely a type table
            end
        end
        return "AstExprTable"  -- Default to expression table
        
    elseif tag == "string" then
        -- AstTypeSingletonString typically has fewer quote styles
        if node.quoteStyle == "block" or node.quoteStyle == "interp" then
            return "AstExprConstantString"  -- Only expressions have these
        elseif node.blockDepth then
            return "AstExprConstantString"  -- Only expressions have blockDepth
        else
            -- Could be either, default to expression for now
            return "AstExprConstantString"
        end
        
    elseif tag == "boolean" then
        -- These are nearly identical, default to expression
        -- Could be improved with context analysis
        return "AstExprConstantBool"
    end
    
    -- Fallback to original mapping if no disambiguation needed
    return typeDefinitions.tags[tag]
end

local function annotateWithType(node, nodeKey)
    if type(node) ~= "table" then
        return node
    end
    
    local astType = nil
    
    -- Priority 1: Context-aware tag-based type resolution
    if node.tag then
        astType = resolveAmbiguousType(node)
    
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

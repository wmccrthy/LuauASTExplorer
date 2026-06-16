local lp = require("@std/syntax/printer")
local getSortedChildren = require("../sortByPositionTable")

local function printToken(token: any): string
	if type(token) ~= "table" then
		return ""
	end
	local result = ""
	if token.leadingTrivia then
		for _, trivia in ipairs(token.leadingTrivia) do
			result ..= trivia.text or ""
		end
	end
	result ..= token.text or ""
	if token.trailingTrivia then
		for _, trivia in ipairs(token.trailingTrivia) do
			result ..= trivia.text or ""
		end
	end
	return result
end

local function isToken(node: any): boolean
	return type(node) == "table" and node.kind == "token" and node.text ~= nil
end

-- Tags where the 'func' child's contents should be merged into the parent
-- for correct position-based printing
local flattenFuncTags = {
	localfunction = true,
	["function"] = true,
}

local function printFallback(node: any): string
	local nodeSrcStr = ""
	if node[1] then -- handle arrays
		for i = 1, #node do
			nodeSrcStr ..= printASTNode(node[i]) or ""
		end
	else
		-- For nodes where 'func' should be flattened into parent
		local nodeToSort = node
		if node.tag and flattenFuncTags[node.tag] and node.func then
			-- Merge func's children into a virtual node alongside parent's other children
			nodeToSort = {}
			for k, v in node do
				if k ~= "func" then
					nodeToSort[k] = v
				end
			end
			-- Merge func's children (except location/tag/kind which are metadata)
			for k, v in node.func do
				if k ~= "location" and k ~= "tag" and k ~= "kind" and k ~= "_astType" then
					nodeToSort["func_" .. k] = v
				end
			end
		end

		local sortedChildren = getSortedChildren(nodeToSort)
		for key, child in sortedChildren do
			nodeSrcStr ..= printASTNode(child) or ""
		end
	end
	if nodeSrcStr == "" then
		error("Node is empty")
	end
	return nodeSrcStr
end

function filterNodeForPrinting(node: any)
	local filtered = {}
	if typeof(node) == "table" then
		for k, v in node do
			if
				(type(v) == "table" and v.diffStatus == "removed")
				or k == "childChanges"
				or k == "beforeValue"
				or k == "afterValue"
			then
				continue
			end
			if typeof(v) == "table" then
				v = filterNodeForPrinting(v)
			end
			filtered[k] = v
		end
	end
	return filtered
end

function printASTNode(astNode: any): string | nil
	astNode = filterNodeForPrinting(astNode)

	-- Try standard printer first (works on real CST nodes)
	local success, defaultPrint = pcall(lp.printNode, astNode)
	if success then
		return defaultPrint
	end

	-- Handle tokens directly
	if isToken(astNode) then
		return printToken(astNode)
	end

	return printFallback(astNode)
end

return {
	filterNodeForPrinting = filterNodeForPrinting,
	printASTNode = printASTNode,
}

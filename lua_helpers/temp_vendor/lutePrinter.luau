local lp = require("@std/syntax/printer")
local getSortedChildren = require("../sortByPositionTable")

local function printFallback(node: any): string
	--[[
		Function to serve as fallback when nodes are not printable with printstatement, printexpr, printtype, printlocal, printtoken
		Catches array nodes and other unique cases (nodes without tag that aren't tokens);
		if array node: iteratively call printASTNode (tries to printstatement, printexpr, printtype, printlocal, printtoken on a node) on children
		if non-array node: sort children by position, iteratively try to print children (same way as above)
	]]
	local nodeSrcStr = ""
	if node[1] then -- handle arrays
		for i = 1, #node do
			nodeSrcStr ..= printASTNode(node[i]) or ""
		end
	else
		local sortedChildren = getSortedChildren(node)
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
	-- filter nodes lefover from diff annotations that we DONT want to print
	astNode = filterNodeForPrinting(astNode)

	local success, defaultPrint = pcall(lp.printnode, astNode)
	if success then
		return defaultPrint
	end

	return printFallback(astNode)
end

return {
	filterNodeForPrinting = filterNodeForPrinting,
	printASTNode = printASTNode,
}

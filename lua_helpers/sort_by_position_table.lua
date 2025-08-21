local function getNodePosition(node)
	local nodeLine, nodeCol
	if node.position then
		nodeLine, nodeCol = node.position.line, node.position.column
	else
		if node.location then
			nodeLine, nodeCol = node.location.begin.line, node.location.begin.column
		end
	end

	-- recursively find first descendant and best location occurence of position on node
	if not nodeLine and not nodeCol and typeof(node) == "table" then
		for _, child in node do
			local childLine, childCol = getNodePosition(child)
			if childLine and childCol then
				if nodeLine and nodeCol then
					nodeLine, nodeCol = math.min(childLine, nodeLine), math.min(childCol, nodeCol)
				else
					nodeLine, nodeCol = childLine, childCol
				end
			end
		end
	end
	return nodeLine, nodeCol
end

local function sortByPosition(node1, node2)
	local node1line: number, node1col: number = getNodePosition(node1)
	local node2line: number, node2col: number = getNodePosition(node2)
	if node1line == node2line then
		return node1col < node2col
	end

	return node1line < node2line
end

local function getSortedChildren(node: any)
	-- filter out children that don't have valid position metadata (inefficient but will fix that later)
	local sorted = {}
	-- print("Sorting", node, "by position")
	for key, child in node do
		if key == "beforeValue" or key == "afterValue" then -- filter out diff metadata
			continue
		end
		local nodeLine, nodeCol = getNodePosition(child)
		if nodeLine and nodeCol then
			-- print("inserting", key, "for sorting")
			table.insert(sorted, child)
		end
	end

	table.sort(sorted, sortByPosition)
	return sorted
end

return getSortedChildren

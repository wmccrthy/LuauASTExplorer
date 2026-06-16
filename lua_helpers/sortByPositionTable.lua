local function getNodePosition(node)
	if typeof(node) ~= "table" then
		return nil, nil, nil, nil
	end

	if node.location then
		if node.location.beginLine then
			return node.location.beginLine, node.location.beginColumn, node.location.endLine, node.location.endColumn
		end
	end

	-- Recursive search for position in children
	local minLine, minCol
	for _, child in node do
		if typeof(child) == "table" then
			local childLine, childCol = getNodePosition(child)
			if childLine and childCol then
				if not minLine or childLine < minLine or (childLine == minLine and childCol < minCol) then
					minLine, minCol = childLine, childCol
				end
			end
		end
	end
	return minLine, minCol, nil, nil
end

local function sortByPosition(node1, node2)
	local line1, col1, endLine1, endCol1 = getNodePosition(node1)
	local line2, col2, endLine2, endCol2 = getNodePosition(node2)
	if line1 ~= line2 then
		return line1 < line2
	end
	if col1 ~= col2 then
		return col1 < col2
	end
	-- Tiebreaker: smaller span (earlier end) comes first
	if endLine1 and endLine2 then
		if endLine1 ~= endLine2 then
			return endLine1 < endLine2
		end
		if endCol1 and endCol2 then
			return endCol1 < endCol2
		end
	end
	return false
end

local function getSortedChildren(node: any)
	local sorted = {}
	for key, child in node do
		local line, col = getNodePosition(child)
		if line and col then
			table.insert(sorted, child)
		end
	end
	table.sort(sorted, sortByPosition)
	return sorted
end

return getSortedChildren

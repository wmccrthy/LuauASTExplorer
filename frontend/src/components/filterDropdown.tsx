import React, { useState, useMemo, useRef, useEffect } from "react";
import { getAllNodeKeys } from "../astTypeDefinitions";

interface FilterDropdownProps {
  hiddenNodes: string[];
  setHiddenNodes: (nodes: string[]) => void;
}

const FilterDropdown = ({ hiddenNodes, setHiddenNodes }: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get all available node keys
  const allNodeKeys = useMemo(() => getAllNodeKeys(), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Filter node keys based on search term
  const filteredNodeKeys = useMemo(() => {
    if (!searchTerm) return allNodeKeys;
    return allNodeKeys.filter((key) =>
      key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allNodeKeys, searchTerm]);

  const handleNodeToggle = (nodeKey: string, isChecked: boolean) => {
    if (isChecked) {
      // Add node to hidden list (filter it out)
      setHiddenNodes([...hiddenNodes, nodeKey]);
    } else {
      // Remove node from hidden list (make it visible)
      setHiddenNodes(hiddenNodes.filter((node) => node !== nodeKey));
    }
  };

  const handleHideAll = () => {
    setHiddenNodes(allNodeKeys);
  };

  const handleShowAll = () => {
    setHiddenNodes([]);
  };

  const hiddenCount = hiddenNodes.length;
  const visibleCount = allNodeKeys.length - hiddenCount;
  const totalCount = allNodeKeys.length;

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button 
        className="btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔽 Filter Nodes (showing {visibleCount}/{totalCount})
      </button>
      
      {isOpen && (
        <div className="filter-dropdown-panel">
          <div className="filter-dropdown-controls">
            <input
              type="text"
              placeholder="Search node keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-search"
            />
            <div className="filter-actions">
              <button onClick={handleShowAll} className="btn filter-action-btn">
                Show All
              </button>
              <button onClick={handleHideAll} className="btn filter-action-btn">
                Hide All
              </button>
            </div>
          </div>
          
          <div className="filter-dropdown-list">
            {filteredNodeKeys.map((nodeKey) => (
              <label key={nodeKey} className="filter-node-item">
                <input
                  type="checkbox"
                  checked={hiddenNodes.includes(nodeKey)}
                  onChange={(e) => handleNodeToggle(nodeKey, e.target.checked)}
                />
                <span className="filter-node-label">
                  {nodeKey} {hiddenNodes.includes(nodeKey) && "🚫"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
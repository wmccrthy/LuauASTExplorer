import { useState, useCallback, useRef } from 'react';
import { VSCodeAPI, PrintCodeMessage } from '../typesAndInterfaces';

export const useCodeTooltip = (vscodeApi: VSCodeAPI | null) => {
  const [codeTooltips, setCodeTooltips] = useState<Record<string, string>>({});
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const requestedNodes = useRef<Set<string>>(new Set());

  const generateNodeId = useCallback((nodeValue: any, nodeKey: string): string => {
    // Create a stable ID based on node content
    const content = JSON.stringify(nodeValue);
    const hash = content.length.toString() + content.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
    return `${nodeKey}_${hash}`;
  }, []);

  const requestCodeTooltip = useCallback((nodeValue: any, nodeKey: string) => {
    if (!vscodeApi || !nodeValue?.tag) return;

    const nodeId = generateNodeId(nodeValue, nodeKey);
    
    // Don't request if already requested/loading or cached
    if (requestedNodes.current.has(nodeId) || codeTooltips[nodeId]) return;

    requestedNodes.current.add(nodeId);
    setLoadingNodes(prev => new Set(prev).add(nodeId));

    const message: PrintCodeMessage = {
      command: "printCode",
      nodeJson: JSON.stringify(nodeValue),
      nodeId: nodeId
    };

    vscodeApi.postMessage(message);
  }, [vscodeApi, generateNodeId, codeTooltips]);

  const handlePrintCodeResult = useCallback((message: any) => {
    if (message.command === "printCodeResult") {
      const { nodeId, status, code, error } = message;
      
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });

      if (status === "success" && code) {
        setCodeTooltips(prev => ({
          ...prev,
          [nodeId]: code.trim()
        }));
      } else if (status === "error") {
        setCodeTooltips(prev => ({
          ...prev,
          [nodeId]: `Error: ${error || 'Failed to print code'}`
        }));
      }
    }
  }, []);

  const getTooltipContent = useCallback((nodeValue: any, nodeKey: string, fallbackPath: string): string => {
    // If this is an object with a tag, try to get/request code tooltip
    if (nodeValue && typeof nodeValue === 'object' && !Array.isArray(nodeValue) && nodeValue.tag) {
      const nodeId = generateNodeId(nodeValue, nodeKey);
      
      // If we have a cached result, return it
      if (codeTooltips[nodeId]) {
        return codeTooltips[nodeId];
      }
      
      // If we're loading, show loading message
      if (loadingNodes.has(nodeId)) {
        return "Loading code...";
      }
      
      // Otherwise, request the code and show path for now
      requestCodeTooltip(nodeValue, nodeKey);
      return fallbackPath;
    }
    
    // Fallback to path tooltip for non-tag nodes
    return fallbackPath;
  }, [generateNodeId, codeTooltips, loadingNodes, requestCodeTooltip]);

  return {
    getTooltipContent,
    handlePrintCodeResult
  };
};

import { useState, useCallback, useRef } from "react";
import { VSCodeAPI, PrintCodeMessage } from "../typesAndInterfaces";

export const useCodeTooltip = (vscodeApi: VSCodeAPI | null) => {
  const [codeTooltips, setCodeTooltips] = useState<Record<string, string>>({});
  const requestedNodes = useRef<Set<string>>(new Set());

  const generateNodeId = useCallback(
    (nodeValue: any, nodeKey: string): string => {
      // Create a stable ID based on node content
      const content = JSON.stringify(nodeValue);
      const hash =
        content.length.toString() +
        content.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "");
      return `${nodeKey}_${hash}`;
    },
    []
  );

  const requestCodeTooltip = useCallback(
    (nodeValue: any, nodeKey: string) => {
      if (!vscodeApi || !nodeValue?.tag) return;

      const nodeId = generateNodeId(nodeValue, nodeKey);

      // Don't request if already requested/loading or cached
      if (requestedNodes.current.has(nodeId) || codeTooltips[nodeId]) return;

      console.log(
        "Frontend requesting code for nodeId:",
        nodeId,
        "nodeKey:",
        nodeKey
      );
      requestedNodes.current.add(nodeId);

      const message: PrintCodeMessage = {
        command: "printCode",
        nodeJson: JSON.stringify(nodeValue),
        nodeId: nodeId,
      };

      vscodeApi.postMessage(message);
    },
    [vscodeApi, generateNodeId, codeTooltips]
  );

  const handlePrintCodeResult = useCallback((message: any) => {
    console.log("Frontend received printCodeResult:", message);
    if (message.command === "printCodeResult") {
      const { nodeId, status, code, error } = message;

      if (status === "success" && code) {
        console.log("Setting code tooltip for nodeId:", nodeId, "code:", code);
        setCodeTooltips((prev) => ({
          ...prev,
          [nodeId]: code.trim(),
        }));
      } else if (status === "loading") {
        setCodeTooltips((prev) => ({
          ...prev,
          [nodeId]: "Loading...",
        }));
      } else if (status === "error") {
        console.log("Error for nodeId:", nodeId, "error:", error);
        // remove nodeId from from codeTooltips
        setCodeTooltips((prev) => {
          const newTooltips = { ...prev };
          delete newTooltips[nodeId];
          return newTooltips;
        });
      }
    }
  }, []);

  return {
    handlePrintCodeResult,
    requestCodeTooltip,
    codeTooltips,
    generateNodeId,
  };
};


import React, { useState, useRef, useEffect } from "react";
import "./CodeTooltip.css";
import "highlight.js/styles/default.css";
import { highlightLuauCode } from "../utils/syntaxHighlighting";

interface CodeTooltipProps {
  isCode: boolean;
  text: string;
  children: React.ReactNode;
  delay?: number;
}

export const CodeTooltip: React.FC<CodeTooltipProps> = ({
  isCode,
  text,
  children,
  delay = 20,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!text) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Capture the target element immediately before the setTimeout
    const target = e.currentTarget as HTMLElement;
    if (!target) return;

    timeoutRef.current = setTimeout(() => {
      try {
        const rect = target.getBoundingClientRect();
        const tooltipWidth = 850; // updated max-width for ~100 characters

        // Align to left edge of target, clamp only if it would go off-screen
        let x = rect.left;
        const rightBound = x + tooltipWidth;
        
        // Only adjust if tooltip would go off the right edge
        if (rightBound > window.innerWidth) {
          x = window.innerWidth - tooltipWidth;
        }
        
        // Ensure tooltip doesn't go off the left edge
        if (x < 0) {
          x = 0;
        }

        const newPosition = {
          x,
          y: rect.top - 5,
        };

        setPosition(newPosition);
        setIsVisible(true);
      } catch (err) {
        // Silently handle positioning errors
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Add a small delay before hiding to allow moving to tooltip
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const handleTooltipMouseEnter = () => {
    // Cancel hide timeout when entering tooltip
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    // Hide immediately when leaving tooltip
    setIsVisible(false);
  };

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as Node | null;
      const inTooltip =
        tooltipRef.current && tooltipRef.current.contains(target as Node);
      const inTrigger =
        triggerRef.current && triggerRef.current.contains(target as Node);
      if (inTooltip || inTrigger) {
        return; // ignore scrolls originating from tooltip or trigger
      }
      setIsVisible(false);
    };

    if (isVisible) {
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [isVisible]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline' }}
      >
        {children}
      </span>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className="code-tooltip"
          style={{
            left: position.x,
            top: position.y,
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="code-tooltip-header">
            {isCode ? "Node's Translated Code" : "Node Path"}
          </div>
          <div className="code-tooltip-divider"></div>
          <div className="code-tooltip-content">
            {isCode ? (
              <pre 
                className="code-block"
                dangerouslySetInnerHTML={{ __html: highlightLuauCode(text) }}
              />
            ) : (
              <div className="path-text">{text}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

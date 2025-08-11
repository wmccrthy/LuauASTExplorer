import React, { useState, useRef, useEffect } from "react";
import { unpackArrayType } from "../utils/astTypeHelpers";
import { ASTTypeDefinition } from "../utils/astTypeDefinitions";
import "./TypeTooltip.css";

interface TypeTooltipProps {
  typeName: string;
  typeDefinition?: ASTTypeDefinition;
  arrayType?: boolean;
  children: React.ReactNode;
  kind?: string;
  delay?: number;
}

export const TypeTooltip: React.FC<TypeTooltipProps> = ({
  typeName,
  typeDefinition,
  arrayType,
  children,
  kind = "",
  delay = 20,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (
      !typeDefinition ||
      (typeDefinition.properties?.length === 0 &&
        !typeDefinition.kinds &&
        !typeDefinition.unionMembers &&
        !typeDefinition.baseType)
    ) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Capture the target element immediately before the setTimeout
    const target = e.currentTarget as HTMLElement;

    if (!target) return;

    timeoutRef.current = setTimeout(() => {
      // Use the captured target, not e.currentTarget which may be null
      try {
        const rect = target.getBoundingClientRect();

        const newPosition = {
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
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
      return () => window.removeEventListener("scroll", handleScroll, true);
    }
  }, [isVisible]);

  const renderPropertyType = (type: string | string[]) => {
    if (Array.isArray(type)) {
      return type.join(" | ");
    }
    return type;
  };

  const handleTypeProperties = () => {
    if (typeDefinition && typeDefinition.properties) {
      return typeDefinition.properties.map((prop, index) => {
        const typeDisplay = prop.generic || renderPropertyType(prop.type);
        return (
          <li key={index} className="property-item">
            <span className="property-name">
              {prop.name}
              {prop.optional ? "?:" : prop.name.length > 0 ? ":" : ""}
            </span>
            <span className="property-type">{typeDisplay}</span>
          </li>
        );
      });
    } else if (typeDefinition && typeDefinition.kinds) {
      return typeDefinition.kinds[kind].properties?.map((prop, index) => {
        const typeDisplay = prop.generic || renderPropertyType(prop.type);
        return (
          <li key={index} className="property-item">
            <span className="property-name">
              {prop.name}
              {prop.optional ? "?:" : prop.name.length > 0 ? ":" : ""}
            </span>
            <span className="property-type">{typeDisplay}</span>
          </li>
        );
      });
    }
    return null;
  };

  // Adjust tooltip position to stay within viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;

      try {
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;

        let { x, y } = position;

        // Adjust horizontal position
        if (x + rect.width / 2 > viewportWidth - 20) {
          x = viewportWidth - rect.width / 2 - 20;
        } else if (x - rect.width / 2 < 20) {
          x = rect.width / 2 + 20;
        }

        // Adjust vertical position - show below if not enough space above
        if (y - rect.height < 20) {
          const triggerRect = triggerRef.current?.getBoundingClientRect();
          if (triggerRect) {
            y = triggerRect.bottom + 10;
            tooltip.classList.add("tooltip-below");
          }
        } else {
          tooltip.classList.remove("tooltip-below");
        }

        setPosition({ x, y });
      } catch (err) {
        // Silently handle positioning errors
      }
    }
  }, [isVisible, position]);

  return (
    <>
      <span
        ref={triggerRef}
        className="type-tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="" // Disable browser default tooltip
      >
        {children}
      </span>

      {isVisible &&
        typeDefinition &&
        ((typeDefinition.properties && typeDefinition.properties.length > 0) ||
          (typeDefinition.kinds && kind !== "") ||
          typeDefinition.unionMembers ||
          typeDefinition.baseType) && (
          <div
            ref={tooltipRef}
            className="type-tooltip"
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            style={{
              left: position.x,
              top: position.y,
              transform: "translateX(-50%) translateY(-100%)",
            }}
          >
            <div className="tooltip-header">
              {arrayType ? "Table of " : ""}
              <span className="tooltip-title">
                {arrayType ? unpackArrayType(typeName) : typeName}
              </span>
            </div>

            <div className="tooltip-content">
              {typeDefinition.baseType && (
                <div className="base-type">
                  <span className="base-type-label">extends </span>
                  <span className="base-type-name">
                    {typeDefinition.baseType}
                  </span>
                </div>
              )}

              {typeDefinition.unionMembers ? (
                <div className="union-members">
                  <div className="union-header">Union of:</div>
                  <ul className="union-list">
                    {typeDefinition.unionMembers.map((member, index) => (
                      <li key={index} className="union-member">
                        {member}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className="properties-list">{handleTypeProperties()}</ul>
              )}
            </div>

            {/* Arrow pointing to the trigger */}
            <div className="tooltip-arrow"></div>
          </div>
        )}
    </>
  );
};

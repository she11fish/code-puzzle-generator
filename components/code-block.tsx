"use client";

import { RefObject, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { HoverPopover } from "@/components/ui/popover";
import { mergeRefs } from "@/lib/utils";

interface CodeBlockProps {
  id: string;
  code: string;
  explanation: string;
  position: { x: number; y: number };
  isActive?: boolean;
  isIncorrect?: boolean;
  showHint?: boolean;
  hintDirection: { x: number; y: number } | null;
  isDraggable: boolean;
  hintEnabled: boolean;
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
  ref: RefObject<HTMLDivElement | null>;
}

export default function CodeBlock({
  id,
  code,
  explanation,
  position,
  isActive = false,
  isIncorrect = false,
  showHint = false,
  hintDirection,
  isDraggable = true,
  hintEnabled = false,
  className,
  ref,
}: CodeBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [codeWidth, setCodeWidth] = useState<number | null>(null);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled: !isDraggable,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: isActive || hintEnabled ? 10 : 1,
    touchAction: "none",
  };

  let finalRef:
    | RefObject<HTMLDivElement | null>
    | React.RefCallback<HTMLDivElement | null>;
  finalRef = mergeRefs([setNodeRef, ref]);

  return (
    <>
      <div
        ref={finalRef}
        style={style}
        className={`absolute cursor-grab ${isActive ? "cursor-grabbing" : ""} ${
          className ?? ""
        }`}
        {...listeners}
        {...attributes}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`
          bg-white rounded-md border-2 
          ${isIncorrect ? "border-red-500" : "border-purple-200"} 
          p-1 flex items-center
        `}
        >
          <div className="min-w-[150px]">
            <Editor
              height="40px"
              language={"python"}
              value={code}
              onMount={(editor) => {
                const element = editor
                  .getDomNode()!
                  .querySelector(
                    ".monaco-editor .lines-content > .view-lines > .view-line > span"
                  );
                if (!element) return;
                setCodeWidth(element!.clientWidth + 16);
              }}
              options={{
                minimap: { enabled: false },
                domReadOnly: true,
                scrollBeyondLastLine: false,
                lineNumbers: "off",
                folding: false,
                readOnly: true,
                fontSize: 12,
                lineHeight: 16,
                automaticLayout: true,
                scrollbar: {
                  vertical: "hidden",
                  horizontal: "hidden",
                },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                renderLineHighlight: "none",
                padding: { top: 8, bottom: 8 },
                cursorStyle: "line",
                mouseWheelZoom: false,
                dragAndDrop: false,
                contextmenu: false,
                multiCursorMergeOverlapping: false,
                renderWhitespace: "none",
              }}
              width={codeWidth ? codeWidth.toString() + "px" : undefined}
              theme="vs"
            />
          </div>
          {isHovered && !isActive && (
            <HoverPopover
              content={<p className="text-sm">{explanation}</p>}
              className="absolute -right-8 top-1/2 transform -translate-y-1/2"
            >
              <div className="ml-2 p-1 rounded-full hover:bg-gray-100">
                <HelpCircle className="h-5 w-5 text-gray-500" />
              </div>
            </HoverPopover>
          )}
        </div>

        {/* Hint arrows */}
        {showHint && hintDirection && (
          <div className="absolute z-[100] -top-8 left-1/2 transform -translate-x-1/2 text-green-500 animate-bounce">
            {hintDirection.y < 0 && <ArrowUp className="h-6 w-6" />}
          </div>
        )}
        {showHint && hintDirection && (
          <div className="absolute z-[100] top-1/2 -right-8 transform -translate-y-1/2 text-green-500 animate-bounce">
            {hintDirection.x > 0 && <ArrowRight className="h-6 w-6" />}
          </div>
        )}
        {showHint && hintDirection && (
          <div className="absolute z-[100] -bottom-8 left-1/2 transform -translate-x-1/2 text-green-500 animate-bounce">
            {hintDirection.y > 0 && <ArrowDown className="h-6 w-6" />}
          </div>
        )}
        {showHint && hintDirection && (
          <div className="absolute z-[100] top-1/2 -left-8 transform -translate-y-1/2 text-green-500 animate-bounce">
            {hintDirection.x < 0 && <ArrowLeft className="h-6 w-6" />}
          </div>
        )}
      </div>
    </>
  );
}

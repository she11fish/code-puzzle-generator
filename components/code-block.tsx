"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Editor from "@monaco-editor/react";

interface CodeBlockProps {
  id: string;
  code: string;
  explanation: string;
  position: { x: number; y: number };
  isActive?: boolean;
  isIncorrect?: boolean;
  showHint?: boolean;
  hintDirection: { x: number; y: number } | null;
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
}: CodeBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: isActive ? 10 : 1,
    touchAction: "none",
  };

  // Determine language for syntax highlighting
  const language =
    code.includes("def ") || code.includes("import ")
      ? "python"
      : code.includes("function") || code.includes("const ")
      ? "javascript"
      : "plaintext";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute cursor-grab ${isActive ? "cursor-grabbing" : ""}`}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          bg-white rounded-md shadow-md border-2 
          ${isIncorrect ? "border-red-500" : "border-purple-200"} 
          p-1 flex items-center
        `}
      >
        <div className="min-w-[150px] max-w-[300px]">
          <Editor
            height="40px"
            language={language}
            value={code}
            options={{
              minimap: { enabled: false },
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
            }}
            theme="vs"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="h-5 w-5 text-gray-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 text-sm">
            <p>{explanation}</p>
          </PopoverContent>
        </Popover>
      </div>

      {/* Hint arrows */}
      {showHint && hintDirection && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-green-500 animate-bounce">
          {hintDirection.y < 0 && <ArrowUp className="h-6 w-6" />}
        </div>
      )}
      {showHint && hintDirection && (
        <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 text-green-500 animate-bounce">
          {hintDirection.x > 0 && <ArrowRight className="h-6 w-6" />}
        </div>
      )}
      {showHint && hintDirection && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-green-500 animate-bounce">
          {hintDirection.y > 0 && <ArrowDown className="h-6 w-6" />}
        </div>
      )}
      {showHint && hintDirection && (
        <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 text-green-500 animate-bounce">
          {hintDirection.x < 0 && <ArrowLeft className="h-6 w-6" />}
        </div>
      )}
    </div>
  );
}

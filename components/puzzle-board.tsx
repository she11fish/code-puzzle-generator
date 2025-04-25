"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragMoveEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import CodeBlock from "@/components/code-block";
import { Undo, Redo, HelpCircle, Check, X } from "lucide-react";
import {
  TOLERANCE,
  INDENT_WIDTH,
  LINE_HEIGHT,
  LEFT_BOUNDARY_X,
  FIRST_BLOCK_X,
  FIRST_BLOCK_Y,
} from "@/lib/constants";

interface PuzzleBlock {
  id: string;
  code: string;
  explanation: string;
  correctPosition: { x: number; y: number };
}

interface PuzzleProps {
  puzzle: {
    blocks: PuzzleBlock[];
    solution: string;
  };
}

interface BlockPosition {
  id: string;
  x: number;
  y: number;
}

export default function PuzzleBoard({ puzzle }: PuzzleProps) {
  const [positions, setPositions] = useState<BlockPosition[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [incorrectBlocks, setIncorrectBlocks] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hintBlock, setHintBlock] = useState<string | null>(null);
  const [hintDirection, setHintDirection] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hintDisabled, setHintDisabled] = useState(false);
  const [history, setHistory] = useState<BlockPosition[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [shadowBlock, setShadowBlock] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  const boardRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Initialize positions
  useEffect(() => {
    if (puzzle && puzzle.blocks) {
      // Create initial positions with random placement on the left side
      const initialPositions = puzzle.blocks.map((block, index) => {
        if (index === 0)
          return {
            id: block.id,
            x: FIRST_BLOCK_X,
            y: FIRST_BLOCK_Y,
          };
        return {
          id: block.id,
          x: 20,
          y: 20 + (index - 1) * 60,
        };
      });

      setPositions(initialPositions);
      // Reset history
      setHistory([initialPositions]);
      setHistoryIndex(0);
      setIncorrectBlocks([]);
      setHintBlock(null);
      setHintDirection(null);
    }
  }, [puzzle]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPositions(history[historyIndex - 1]);
      setIncorrectBlocks([]);
      setHintBlock(null);
      setHintDirection(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPositions(history[historyIndex + 1]);
      setIncorrectBlocks([]);
      setHintBlock(null);
      setHintDirection(null);
    }
  };

  const handleCheck = () => {
    const incorrect: string[] = [];

    // Check each block's position against its correct position
    puzzle.blocks.forEach((block) => {
      const currentPos = positions.find((pos) => pos.id === block.id);
      if (!currentPos) return;

      const isCorrectX =
        Math.abs(currentPos.x - block.correctPosition.x) <= TOLERANCE;
      const isCorrectY =
        Math.abs(currentPos.y - block.correctPosition.y) <= TOLERANCE;
      const correctDuplicateBlock = puzzle.blocks.find(
        (b) =>
          b.id !== block.id &&
          Math.abs(currentPos.x - b.correctPosition.x) <= TOLERANCE &&
          Math.abs(currentPos.y - b.correctPosition.y) <= TOLERANCE &&
          b.code.trim() === block.code.trim()
      );
      if (correctDuplicateBlock) return;
      if (!isCorrectX || !isCorrectY) {
        incorrect.push(block.id);
      }
    });

    setIncorrectBlocks(incorrect);

    if (incorrect.length === 0) {
      setShowSuccess(true);
    }
  };

  const handleHint = () => {
    if (hintDisabled) return;

    const incorrect = puzzle.blocks.filter((block) => {
      const currentPos = positions.find((pos) => pos.id === block.id);
      if (!currentPos) return false;
      const isCorrectX =
        Math.abs(currentPos.x - block.correctPosition.x) <= TOLERANCE;
      const isCorrectY =
        Math.abs(currentPos.y - block.correctPosition.y) <= TOLERANCE;
      const correctDuplicateBlock = puzzle.blocks.find(
        (b) =>
          b.id !== block.id &&
          Math.abs(currentPos.x - b.correctPosition.x) <= TOLERANCE &&
          Math.abs(currentPos.y - b.correctPosition.y) <= TOLERANCE &&
          b.code.trim() === block.code.trim()
      );
      if (correctDuplicateBlock) return false;
      return !isCorrectX || !isCorrectY;
    });

    if (incorrect.length === 0) {
      toast({
        title: "All blocks are correctly placed!",
        description: "No hints needed.",
      });
      return;
    }

    // Select a random incorrect block
    const randomBlock = incorrect[Math.floor(Math.random() * incorrect.length)];
    const currentPos = positions.find((pos) => pos.id === randomBlock.id)!;
    setHintBlock(randomBlock.id);
    let randomBlockPosition = { ...randomBlock.correctPosition };
    const duplicateBlocks = puzzle.blocks.filter(
      (b) =>
        randomBlock.id !== b.id && randomBlock.code.trim() === b.code.trim()
    );
    const closestDuplicateBlock = duplicateBlocks.reduce((closest, b) => {
      const bDist = Math.hypot(
        b.correctPosition.x - currentPos.x,
        b.correctPosition.y - currentPos.y
      );

      const closestDist = Math.hypot(
        closest.correctPosition.x - currentPos.x,
        closest.correctPosition.y - currentPos.y
      );
      if (bDist < closestDist) {
        return b;
      }
      return closest;
    }, randomBlock);

    if (closestDuplicateBlock) {
      randomBlockPosition.x = closestDuplicateBlock.correctPosition.x;
      randomBlockPosition.y = closestDuplicateBlock.correctPosition.y;
    }

    const xDiff = randomBlockPosition.x - currentPos.x;
    const yDiff = randomBlockPosition.y - currentPos.y;
    let xDiffAfterToleration = xDiff;
    let yDiffAfterToleration = yDiff;
    if (Math.abs(xDiff) <= TOLERANCE) {
      xDiffAfterToleration = 0;
    }
    if (Math.abs(yDiff) <= TOLERANCE) {
      yDiffAfterToleration = 0;
    }
    setHintDirection({
      x: Math.sign(xDiffAfterToleration),
      y: Math.sign(yDiffAfterToleration),
    });

    // Disable hint button for 10 seconds
    setHintDisabled(true);
    setTimeout(() => {
      setHintDisabled(false);
    }, 10000);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history]);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, delta } = event;
    const id = active.id as string;

    setPositions((prev) => {
      const newPositions = prev.map((pos) => {
        if (pos.id === id) {
          const newX = pos.x + delta.x;
          const newY = pos.y + delta.y;

          if (!boardRef.current || !blockRef.current) return pos;
          const snappedX =
            INDENT_WIDTH +
            Math.round((newX - INDENT_WIDTH) / INDENT_WIDTH) * INDENT_WIDTH;
          const snappedY =
            LINE_HEIGHT +
            Math.round((newY - LINE_HEIGHT) / LINE_HEIGHT) * LINE_HEIGHT;

          const canvasWidth = boardRef.current.clientWidth;
          const canvasHeight = boardRef.current.clientHeight;
          const clampedX = Math.max(
            INDENT_WIDTH,
            Math.min(snappedX, canvasWidth - blockRef.current.clientWidth)
          );
          const clampedY = Math.max(
            LINE_HEIGHT,
            // Added padding to ensure it doesn't go too far down
            Math.min(snappedY, canvasHeight - LINE_HEIGHT - 39)
          );

          if (
            clampedX < LEFT_BOUNDARY_X ||
            positions.some(
              (position) => position.id !== id && position.y === clampedY
            )
          ) {
            const index = puzzle.blocks
              .filter((_, i) => i !== 0)
              .map((block) => block.id)
              .indexOf(id);
            return {
              id: id,
              x: 20,
              y: 20 + index * 60,
            };
          }
          return {
            ...pos,
            x: clampedX,
            y: clampedY,
          };
        }
        return pos;
      });

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newPositions);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      return newPositions;
    });

    // Clear any incorrect blocks highlighting
    setIncorrectBlocks([]);
    // Clear any hints
    setHintBlock(null);
    setHintDirection(null);
    setShadowBlock(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    const pos = positions.find((pos) => pos.id === activeId)!;

    const newX = pos.x + delta.x;
    const newY = pos.y + delta.y;

    if (!boardRef.current || !blockRef.current) {
      setShadowBlock(null);
      return;
    }
    const snappedX =
      INDENT_WIDTH +
      Math.round((newX - INDENT_WIDTH) / INDENT_WIDTH) * INDENT_WIDTH;
    const snappedY =
      LINE_HEIGHT +
      Math.round((newY - LINE_HEIGHT) / LINE_HEIGHT) * LINE_HEIGHT;

    const canvasWidth = boardRef.current.clientWidth;
    const canvasHeight = boardRef.current.clientHeight;
    const clampedX = Math.max(
      INDENT_WIDTH,
      Math.min(snappedX, canvasWidth - blockRef.current.clientWidth)
    );
    const clampedY = Math.max(
      LINE_HEIGHT,
      // Added padding to ensure it doesn't go too far down
      Math.min(snappedY, canvasHeight - LINE_HEIGHT - 39)
    );

    if (
      clampedX < LEFT_BOUNDARY_X ||
      positions.some(
        (position) => position.id !== id && position.y === clampedY
      )
    ) {
      setShadowBlock(null);
      return;
    }

    setShadowBlock({
      x: clampedX,
      y: clampedY,
    });
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
      >
        <div
          ref={boardRef}
          className="relative bg-white border border-gray-200 rounded-lg h-[500px] mb-4 overflow-hidden"
        >
          {/* Left side (workspace) */}
          <div className="absolute left-0 top-0 w-1/2 h-full bg-yellow-50 border-r border-gray-200"></div>
          {shadowBlock && (
            <div
              className="absolute z-50 pointer-events-none bg-blue-200/30 border-2 border-gray-400 rounded-md shadow-xl transition-all duration-150"
              style={{
                top: shadowBlock.y,
                left: shadowBlock.x,
                width: blockRef.current!.offsetWidth,
                height: blockRef.current!.offsetHeight,
              }}
            />
          )}

          {/* Right side (available blocks) */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-yellow-100"></div>
          {process.env.NODE_ENV === "development" && (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={`row-${i}`}
                  className="absolute right-0 w-1/2 h-px bg-gray-200"
                  style={{ top: i * LINE_HEIGHT }}
                />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={`col-${i}`}
                  className="absolute right-0 h-full w-px bg-gray-200"
                  style={{ left: (i + 16) * INDENT_WIDTH }}
                />
              ))}
            </>
          )}
          {/* Blocks */}
          {positions.map((position, index) => {
            const block = puzzle.blocks.find((b) => b.id === position.id);
            if (!block) return null;
            if (index === 0) {
              return (
                <CodeBlock
                  key={block.id}
                  id={block.id}
                  ref={blockRef}
                  code={block.code}
                  explanation={block.explanation}
                  position={{ x: position.x, y: position.y }}
                  isActive={activeId === block.id}
                  isIncorrect={incorrectBlocks.includes(block.id)}
                  showHint={hintBlock === block.id}
                  hintDirection={hintBlock === block.id ? hintDirection : null}
                  isDraggable={false}
                  hintEnabled={false}
                />
              );
            }
            return (
              <CodeBlock
                key={block.id}
                id={block.id}
                ref={blockRef}
                code={block.code}
                explanation={block.explanation}
                position={{ x: position.x, y: position.y }}
                isActive={activeId === block.id}
                isIncorrect={incorrectBlocks.includes(block.id)}
                showHint={hintBlock === block.id}
                hintDirection={hintBlock === block.id ? hintDirection : null}
                isDraggable={true}
                hintEnabled={hintBlock === block.id && Boolean(hintDirection)}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          <div className="space-x-2">
            <Button
              variant="secondary"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button
              variant="secondary"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Redo className="h-4 w-4 mr-1" />
              Redo
            </Button>
          </div>

          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={handleHint}
              disabled={hintDisabled}
              className={`bg-green-500 text-white hover:bg-green-600 ${
                hintDisabled ? "opacity-50" : ""
              }`}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Hint
              {hintDisabled && <span className="ml-1 text-xs">(10s)</span>}
            </Button>
            <Button
              onClick={handleCheck}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Check
            </Button>
          </div>
        </div>
      </DndContext>

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Congratulations! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              You've successfully solved the puzzle! All code blocks are in
              their correct positions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowSuccess(false)}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

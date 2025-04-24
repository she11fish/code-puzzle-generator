"use client";

import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
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
import { Undo, Redo, HelpCircle, Check } from "lucide-react";
import { TOLERANCE, INDENT_WIDTH, LINE_HEIGHT } from "@/lib/constants";

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
  const [highlightedPoint, setHighlightedPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const blockRefs = useRef<HTMLDivElement | null>(null);
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
      const initialPositions = puzzle.blocks.map((block, index) => ({
        id: block.id,
        x: 20, // Left side
        y: 20 + index * 60, // Stacked vertically with some spacing
      }));

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
      console.log("test", block.correctPosition.x, block.correctPosition.y);
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

    // Find incorrect blocks
    const incorrect = puzzle.blocks.filter((block) => {
      const currentPos = positions.find((pos) => pos.id === block.id);
      if (!currentPos) return false;
      const isCorrectX =
        Math.abs(currentPos.x - block.correctPosition.x) <= TOLERANCE;
      const isCorrectY =
        Math.abs(currentPos.y - block.correctPosition.y) <= TOLERANCE;

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
    setHintBlock(randomBlock.id);

    // Calculate direction to move
    const currentPos = positions.find((pos) => pos.id === randomBlock.id);
    if (currentPos) {
      const xDiff = randomBlock.correctPosition.x - currentPos.x;
      const yDiff = randomBlock.correctPosition.y - currentPos.y;
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
    }

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

          const block = puzzle.blocks.find((b) => b.id === id);
          if (!block || !boardRef.current || !blockRefs.current) return pos;

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
            Math.min(snappedX, canvasWidth - blockRefs.current.clientWidth)
          );
          const clampedY = Math.max(
            LINE_HEIGHT,
            // Added padding to ensure it doesn't go too far down
            Math.min(snappedY, canvasHeight - LINE_HEIGHT - 39)
          );
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
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4">
      <DndContext
        sensors={sensors}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={boardRef}
          className="relative bg-white border border-gray-200 rounded-lg h-[500px] mb-4 overflow-hidden"
        >
          {/* Left side (workspace) */}
          <div className="absolute left-0 top-0 w-1/2 h-full bg-yellow-50 border-r border-gray-200"></div>

          {/* Right side (available blocks) */}
          <div className="absolute right-0 top-0 w-1/2 h-full bg-yellow-100"></div>
          {process.env.NODE_ENV === "development" && (
            <>
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={`row-${i}`}
                  className="absolute w-full h-px bg-gray-200"
                  style={{ top: i * LINE_HEIGHT }}
                />
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={`col-${i}`}
                  className="absolute h-full w-px bg-gray-200"
                  style={{ left: i * INDENT_WIDTH }}
                />
              ))}
            </>
          )}
          {/* Blocks */}
          {positions.map((position, index) => {
            const block = puzzle.blocks.find((b) => b.id === position.id);
            if (!block) return null;
            return (
              <CodeBlock
                key={block.id}
                id={block.id}
                ref={blockRefs}
                code={block.code}
                explanation={block.explanation}
                position={{ x: position.x, y: position.y }}
                isActive={activeId === block.id}
                isIncorrect={incorrectBlocks.includes(block.id)}
                showHint={hintBlock === block.id}
                hintDirection={hintBlock === block.id ? hintDirection : null}
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

"use client";

import { useState, useEffect } from "react";
import TaskInput from "@/components/task-input";
import PuzzleBoard from "@/components/puzzle-board";
import ApiKeyModal from "@/components/api-key-modal";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { generatePuzzle } from "@/lib/generate-puzzle";
const puzzle = {
  blocks: [
    {
      id: "3b1725e2-d300-4aba-86f3-2c6fdb863014",
      code: "def print_block(char, width, height):".trim(),
      explanation:
        "Defines a function named 'print_block' that takes three parameters: 'char' for the character to print, 'width' for the number of characters per line, and 'height' for the number of lines to print.",
      correctPosition: { x: 900, y: 300 },
    },
    {
      id: "0639955a-5af1-4290-900b-a2a82bb4b217",
      code: "    for _ in range(height):".trim(),
      explanation:
        "Starts a loop that runs 'height' times, to print each line of the block.",
      correctPosition: { x: 900, y: 350 },
    },
    {
      id: "f15664cc-165b-4015-a010-90412bb62aec",
      code: "        print(char * width)".trim(),
      explanation:
        "Prints a line consisting of the character 'char' repeated 'width' times, creating one row of the block.",
      correctPosition: { x: 900, y: 400 },
    },
  ],
  solution: `def print_block(char, width, height):
    for _ in range(height):
        print(char * width)`,
};
export default function Home() {
  const [task, setTask] = useState("");
  // const [puzzle, setPuzzle] = useState<{
  //   blocks: Array<{
  //     id: string;
  //     code: string;
  //     explanation: string;
  //     correctPosition: { x: number; y: number };
  //   }>;
  //   solution: string;
  // } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { toast } = useToast();

  // Check if API key exists in local storage
  useEffect(() => {
    const apiKey = localStorage.getItem("openai-api-key");
    if (!apiKey) {
      console.log("No API key found");
    }
  }, []);

  const handleGenerate = async () => {
    if (!task.trim()) {
      toast({
        title: "Error",
        description: "Please describe the programming task first.",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem("openai-api-key");
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    try {
      setIsGenerating(true);
      const generatedPuzzle = await generatePuzzle(task, apiKey);
      // setPuzzle(generatedPuzzle);
      console.log(generatedPuzzle);
    } catch (error) {
      console.error("Error generating puzzle:", error);
      toast({
        title: "Error",
        description: "Failed to generate puzzle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApiKeySubmit = (apiKey: string) => {
    localStorage.setItem("openai-api-key", apiKey);
    setShowApiKeyModal(false);
    handleGenerate();
  };

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <h1 className="text-3xl font-bold text-center my-6">
        Code Puzzle Generator
      </h1>

      {!puzzle ? (
        <div className="max-w-3xl mx-auto">
          <TaskInput
            value={task}
            onChange={setTask}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Solve the Puzzle</h2>
            <Button
              variant="outline" //onClick={() => setPuzzle(null)}>
            >
              New Puzzle
            </Button>
          </div>
          <PuzzleBoard puzzle={puzzle} />
        </div>
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          onSubmit={handleApiKeySubmit}
          onCancel={() => setShowApiKeyModal(false)}
        />
      )}

      <Toaster />
    </main>
  );
}

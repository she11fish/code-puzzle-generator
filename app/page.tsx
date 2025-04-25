"use client";

import { useState, useEffect } from "react";
import TaskInput from "@/components/task-input";
import PuzzleBoard from "@/components/puzzle-board";
import ApiKeyModal from "@/components/api-key-modal";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { generatePuzzle } from "@/app/actions";

export default function Home() {
  const [task, setTask] = useState("");
  const [puzzle, setPuzzle] = useState<{
    blocks: Array<{
      id: string;
      code: string;
      explanation: string;
      correctPosition: { x: number; y: number };
    }>;
  } | null>(null);

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
      setPuzzle(generatedPuzzle);
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
            <Button variant="outline" onClick={() => setPuzzle(null)}>
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

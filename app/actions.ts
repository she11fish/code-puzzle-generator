"use server";

import { v4 as uuidv4 } from "uuid";
import { INDENT_WIDTH } from "../lib/constants";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { PuzzleResponseSchema } from "@/schema/puzzle";
import { Puzzle, PuzzleBlock } from "@/interface/puzzle";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rateLimiter";

export async function generatePuzzle(
  task: string,
  apiKey: string
): Promise<Puzzle> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const isRateLimited = rateLimit(ip);
  if (isRateLimited) {
    throw new Error("Rate limit exceeded, please try again later.");
  }
  try {
    const openai = new OpenAI({
      apiKey,
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a programming puzzle generator. Given a programming task, create a solution and then break it down into individual code blocks that can be rearranged to form the complete solution. For each code block, provide an explanation of what it does and why it's important.

Format your response as a JSON object with the following structure:
{
  "blocks": [
    {
      "code": "Line or block of code",
      "explanation": "Explanation of what this line of code does, its purpose, and why it is needed"
      "indentation" "The number of indetation needed for this line"
    },
    ...more blocks
  ]
}

Make sure each block is a meaningful unit of code (e.g., a line, a function, a loop body). Include all necessary code to solve the problem.`,
        },
        {
          role: "user",
          content: `Generate a programming puzzle for this task: ${task}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: zodResponseFormat(
        PuzzleResponseSchema,
        "puzzleResponse"
      ),
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error(`API request failed`);
    }

    const parsedContent = PuzzleResponseSchema.parse(JSON.parse(content));

    // Create blocks with positions
    const blocks: PuzzleBlock[] = parsedContent.blocks.map(
      (block: any, index: number) => {
        return {
          id: uuidv4(),
          code: block.code,
          explanation: block.explanation,
          correctPosition: {
            x: 700 + INDENT_WIDTH * block.indentation,
            y: 50 + index * 50,
          },
        };
      }
    );

    return {
      blocks,
    };
  } catch (error) {
    console.error("Error generating puzzle:", error);
    throw new Error(
      "Failed to generate puzzle. Please check your API key and try again."
    );
  }
}

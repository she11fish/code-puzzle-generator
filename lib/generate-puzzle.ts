import { v4 as uuidv4 } from "uuid"

interface PuzzleBlock {
  id: string
  code: string
  explanation: string
  correctPosition: { x: number; y: number }
}

interface Puzzle {
  blocks: PuzzleBlock[]
  solution: string
}

export async function generatePuzzle(task: string, apiKey: string): Promise<Puzzle> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: `You are a programming puzzle generator. Given a programming task, create a solution and then break it down into individual code blocks that can be rearranged to form the complete solution. For each code block, provide an explanation of what it does and why it's important.

Format your response as a JSON object with the following structure:
{
  "solution": "The complete code solution as a string",
  "blocks": [
    {
      "code": "Line or block of code",
      "explanation": "Explanation of what this code does"
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
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON response
    const parsedContent = JSON.parse(content)

    // Create blocks with positions
    const blocks: PuzzleBlock[] = parsedContent.blocks.map((block: any, index: number) => {
      // Determine if this block should be on the left or right side initially
      const isOnRight = index % 2 === 0

      return {
        id: uuidv4(),
        code: block.code,
        explanation: block.explanation,
        // Set the correct position (right side, stacked vertically)
        correctPosition: {
          x: 800, // Right side
          y: 20 + index * 60, // Stacked vertically with spacing
        },
      }
    })

    return {
      blocks,
      solution: parsedContent.solution,
    }
  } catch (error) {
    console.error("Error generating puzzle:", error)
    throw new Error("Failed to generate puzzle. Please check your API key and try again.")
  }
}

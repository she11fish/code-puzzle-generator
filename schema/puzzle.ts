import { z } from "zod";
const PuzzleBlockSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  indentation: z.number()
});

export const PuzzleResponseSchema = z.object({
  blocks: z.array(PuzzleBlockSchema),
});
 
import { z } from "zod";

const PuzzleBlockSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  indentation: z.number(),
});

export const PuzzleResponseSchema = z.object({
  blocks: z.array(PuzzleBlockSchema),
});

export const ServerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .object({
      blocks: z.array(
        z.object({
          id: z.string(),
          code: z.string(),
          explanation: z.string(),
          correctPosition: z.object({ x: z.number(), y: z.number() }),
        })
      ),
    })
    .nullable(),
});

export const TaskSchema = z
  .string({ message: "Task must be a string" })
  .min(10, { message: "A minimum of 10 characters is required." })
  .max(500, { message: "A maximum of 500 characters is allowed." });

export const ApiKeySchema = z
  .string({ message: "Please provide a proper API key and try again." })
  .min(10, { message: "Please provide a proper API key and try again." })
  .max(500, { message: "Please provide a proper API key and try again." });

export type ServerResponse = z.infer<typeof ServerResponseSchema>;

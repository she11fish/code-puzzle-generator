export interface PuzzleBlock {
  id: string;
  code: string;
  explanation: string;
  correctPosition: { x: number; y: number };
}

export interface Puzzle {
  blocks: PuzzleBlock[];
}

import { BOARD_SIZE, type Stone } from "./types";

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function inside(row: number, col: number) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function findWinningLine(
  board: Stone[][],
  row: number,
  col: number,
  color: 1 | 2
): Array<[number, number]> {
  for (const [dr, dc] of DIRECTIONS) {
    const line: Array<[number, number]> = [[row, col]];

    for (const sign of [-1, 1] as const) {
      let nextRow = row + dr * sign;
      let nextCol = col + dc * sign;
      const side: Array<[number, number]> = [];

      while (inside(nextRow, nextCol) && board[nextRow][nextCol] === color) {
        side.push([nextRow, nextCol]);
        nextRow += dr * sign;
        nextCol += dc * sign;
      }

      if (sign === -1) line.unshift(...side.reverse());
      else line.push(...side);
    }

    if (line.length >= 5) return line;
  }

  return [];
}

export function isBoardFull(board: Stone[][]) {
  return board.every((row) => row.every((stone) => stone !== 0));
}

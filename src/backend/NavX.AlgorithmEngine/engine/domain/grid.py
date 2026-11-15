"""Grid domain model for NavX Algorithm Engine."""

from typing import List, Tuple, Optional

Position = Tuple[int, int]


class Grid:
    """Represents the city grid map."""

    OPEN = 1
    TRAFFIC = 5
    BLOCKED = -1

    DIRECTIONS: List[Position] = [
        (-1, 0),  # Up
        (0, 1),   # Right
        (1, 0),   # Down
        (0, -1)   # Left
    ]

    def __init__(self, matrix: List[List[int]]) -> None:
        if not matrix or not matrix[0]:
            raise ValueError("Grid must not be empty.")
        
        num_cols = len(matrix[0])
        for row in matrix:
            if len(row) != num_cols:
                raise ValueError("Grid must be rectangular.")
            for cell in row:
                if cell not in (self.OPEN, self.TRAFFIC, self.BLOCKED):
                    raise ValueError(f"Invalid cell value: {cell}. Must be 1, 5, or -1.")
        
        self.matrix = matrix
        self.rows = len(matrix)
        self.cols = num_cols

    def in_bounds(self, pos: Position) -> bool:
        r, c = pos
        return 0 <= r < self.rows and 0 <= c < self.cols

    def is_traversable(self, pos: Position) -> bool:
        return self.in_bounds(pos) and self.matrix[pos[0]][pos[1]] != self.BLOCKED

    def cost(self, pos: Position) -> int:
        if not self.in_bounds(pos):
            raise IndexError(f"Position {pos} out of bounds.")
        cell_val = self.matrix[pos[0]][pos[1]]
        if cell_val == self.BLOCKED:
            raise ValueError(f"Position {pos} is blocked.")
        return cell_val

    def neighbors(self, pos: Position) -> List[Position]:
        result: List[Position] = []
        for dr, dc in self.DIRECTIONS:
            nxt: Position = (pos[0] + dr, pos[1] + dc)
            if self.is_traversable(nxt):
                result.append(nxt)
        return result
